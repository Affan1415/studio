// src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import { auth as adminAuth } from "firebase-admin";
import { initAdminApp } from "@/lib/firebase/admin-config";
import { chatWithSheet, writebackToSheet } from "@/ai/flows"; // Assuming flows are barrel exported from src/ai/flows/index.ts
import { getStoredGoogleAccessToken as getClientSdkStoredToken, addChatMessage } from "@/lib/firebase/firestore"; // Uses client SDK for Firestore ops
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { formatSheetDataForPrompt, getBaseUrl } from "@/lib/utils";

initAdminApp();

// Helper function to fetch sheet data (could be from cache or API)
async function getSheetData(spreadsheetId: string, firebaseIdToken: string): Promise<any[][]> {
  // This internal call needs to authenticate itself to the sheet data API route
  const response = await fetch(`${getBaseUrl()}/api/sheets/${spreadsheetId}/data`, {
    headers: {
      Authorization: `Bearer ${firebaseIdToken}`,
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
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`; // Or RAW as per original req
  
  const response = await fetch(url, {
    method: 'PUT', // PATCH is also an option, PUT is simpler for single cell with valueInputOption
    headers: {
      Authorization: `Bearer ${googleAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[value]], // Value must be a 2D array
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const firebaseIdToken = authorization.split("Bearer ")[1];
    const decodedToken = await adminAuth().verifyIdToken(firebaseIdToken);
    const userId = decodedToken.uid;

    const { question, spreadsheetId, useWritebackFlow } = await request.json();

    if (!question || !spreadsheetId) {
      return NextResponse.json({ error: "Question and Spreadsheet ID are required" }, { status: 400 });
    }

    // Verify user has this sheet connected
    const userSheetRef = doc(db, "users", userId, "sheets", spreadsheetId);
    const userSheetDoc = await getDoc(userSheetRef); // client SDK
    if (!userSheetDoc.exists()) {
      return NextResponse.json({ error: "Sheet not connected or access denied" }, { status: 403 });
    }
    const sheetConfig = userSheetDoc.data();


    // Log user message
    await addChatMessage(userId, spreadsheetId, { text: question, sender: "user" });

    const sheetDataArray = await getSheetData(spreadsheetId, firebaseIdToken);
    const sheetDataString = formatSheetDataForPrompt(sheetDataArray); // Or provide raw JSON string to Genkit flow
    
    const googleAccessToken = await getClientSdkStoredToken(userId); // client SDK
    if (!googleAccessToken) {
        // This is critical for writeback. If not present, writeback cannot occur.
        // The chat can still proceed in a read-only mode if the flow supports it.
        console.warn(`Google Access Token not found for user ${userId}. Writeback will be disabled.`);
    }

    let aiResponse;
    if (useWritebackFlow && googleAccessToken) { // Prefer writeback flow if conditions met
      aiResponse = await writebackToSheet({
        question,
        sheetData: sheetDataString, // Or JSON.stringify(sheetDataArray)
        spreadsheetId,
        accessToken: googleAccessToken, // Pass token for potential direct API calls within flow if needed
      });
    } else {
      aiResponse = await chatWithSheet({
        question,
        sheetData: sheetDataString, // Or JSON.stringify(sheetDataArray)
      });
    }
    
    let botMessageText = aiResponse.response;
    let updateAppliedInfo;

    if (aiResponse.update && aiResponse.update.range && aiResponse.update.value) {
      if (googleAccessToken) {
        try {
          await updateGoogleSheet(spreadsheetId, aiResponse.update.range, aiResponse.update.value, googleAccessToken);
          botMessageText += `\n(Sheet updated at ${aiResponse.update.range} with value: "${aiResponse.update.value}")`;
          updateAppliedInfo = { range: aiResponse.update.range, value: aiResponse.update.value };
        } catch (updateError: any) {
          console.error("Failed to apply sheet update:", updateError);
          botMessageText += `\n(Note: I tried to update the sheet but encountered an error: ${updateError.message})`;
        }
      } else {
         botMessageText += `\n(Note: I identified an update for ${aiResponse.update.range} but couldn't apply it as Google Sheets access is not currently configured for writeback.)`;
      }
    }

    // Log bot response
    await addChatMessage(userId, spreadsheetId, { text: botMessageText, sender: "bot", updateApplied: updateAppliedInfo });

    return NextResponse.json({ response: botMessageText, update: aiResponse.update });

  } catch (error: any) {
    console.error("Error in chat API:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
    }
    // Log error for bot if it occurs during AI processing
    // await addChatMessage(userId, spreadsheetId, { text: `Sorry, I encountered an error: ${error.message}`, sender: "bot" });
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}
