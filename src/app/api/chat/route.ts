
// src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import { auth as adminAuth } from "firebase-admin";
import { initAdminApp } from "@/lib/firebase/admin-config";
import { chatWithSheet, writebackToSheet } from "@/ai/flows";
import { addChatMessage } from "@/lib/firebase/firestore";
import { doc, getDoc } from "firebase/firestore"; 
import { db } from "@/lib/firebase/config"; 
import { formatSheetDataForPrompt, getBaseUrl } from "@/lib/utils";

initAdminApp();

// Helper function to fetch sheet data
async function getSheetData(spreadsheetId: string, firebaseIdToken: string): Promise<any[][]> {
  const response = await fetch(`${getBaseUrl()}/api/sheets/${spreadsheetId}/data`, {
    headers: {
      Authorization: `Bearer ${firebaseIdToken}`, // Pass Firebase ID token for backend auth
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to fetch sheet data for chat: ${errorData.error || response.statusText}`);
  }
  const result = await response.json();
  return result.data;
}

// Helper function to update Google Sheet
async function updateGoogleSheet(spreadsheetId: string, range: string, value: string, googleAccessToken: string): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${googleAccessToken}`, // Use the Google OAuth Access Token
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[value]],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Google Sheets API update error:", errorData);
    throw new Error(`Failed to update sheet: ${errorData.error?.message || response.statusText}`);
  }
}


export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }
    const firebaseIdToken = authorization.split("Bearer ")[1];
    
    let decodedToken;
    try {
        decodedToken = await adminAuth().verifyIdToken(firebaseIdToken);
    } catch (error: any) {
        console.error("Error verifying Firebase ID token:", error);
        return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }
    const userId = decodedToken.uid;

    const { question, spreadsheetId, useWritebackFlow, googleAccessToken } = await request.json();

    if (!question || !spreadsheetId) {
      return NextResponse.json({ error: "Question and Spreadsheet ID are required" }, { status: 400 });
    }

    const userSheetRef = doc(db, "users", userId, "sheets", spreadsheetId);
    const userSheetDoc = await getDoc(userSheetRef);
    if (!userSheetDoc.exists()) {
      return NextResponse.json({ error: "Sheet not connected or access denied for this user." }, { status: 403 });
    }
    // const sheetConfig = userSheetDoc.data(); // Potentially use sheet specific config later


    await addChatMessage(userId, spreadsheetId, { text: question, sender: "user" });

    const sheetDataArray = await getSheetData(spreadsheetId, firebaseIdToken); // Pass Firebase ID token
    const sheetDataString = formatSheetDataForPrompt(sheetDataArray);
        
    if (!googleAccessToken && useWritebackFlow) {
        console.warn(`Google Access Token not found for user ${userId} for writeback flow. Writeback will be attempted without it if flow proceeds, but likely fail.`);
    }

    let aiResponse;
    if (useWritebackFlow && googleAccessToken) { // Ensure token exists for writeback
      aiResponse = await writebackToSheet({
        question,
        sheetData: sheetDataString,
        spreadsheetId,
        accessToken: googleAccessToken, // Pass Google Access Token to the flow
      });
    } else {
      aiResponse = await chatWithSheet({
        question,
        sheetData: sheetDataString,
      });
    }
    
    let botMessageText = aiResponse.response;
    let updateAppliedInfo;

    if (aiResponse.update && aiResponse.update.range && aiResponse.update.value) {
      if (googleAccessToken) { // Check for token before attempting update
        try {
          await updateGoogleSheet(spreadsheetId, aiResponse.update.range, aiResponse.update.value, googleAccessToken);
          botMessageText += `\n(Sheet updated at ${aiResponse.update.range} with value: "${aiResponse.update.value}")`;
          updateAppliedInfo = { range: aiResponse.update.range, value: aiResponse.update.value };
        } catch (updateError: any) {
          console.error("Failed to apply sheet update:", updateError);
          botMessageText += `\n(Note: I tried to update the sheet but encountered an error: ${updateError.message})`;
        }
      } else {
         botMessageText += `\n(Note: I identified an update for ${aiResponse.update.range} but couldn't apply it as Google Sheets access token is missing.)`;
      }
    }

    await addChatMessage(userId, spreadsheetId, { text: botMessageText, sender: "bot", updateApplied: updateAppliedInfo });

    return NextResponse.json({ response: botMessageText, update: aiResponse.update });

  } catch (error: any) {
    console.error("Error in chat API:", error);
    // Check if it's a known auth error type, otherwise generic
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
    }
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}
