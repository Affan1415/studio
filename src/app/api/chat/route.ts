
// src/app/api/chat/route.ts
import { NextResponse } from "next/server";
// import { auth as adminAuth } from "firebase-admin"; // Admin auth for token verification removed
// import { initAdminApp } from "@/lib/firebase/admin-config"; // Still needed if other admin features used, but not for auth
import { chatWithSheet, writebackToSheet } from "@/ai/flows";
import { addChatMessage } from "@/lib/firebase/firestore";
// import { doc, getDoc } from "firebase/firestore"; // For user sheet verification, now uses mock user
// import { db } from "@/lib/firebase/config"; // For user sheet verification
import { formatSheetDataForPrompt, getBaseUrl } from "@/lib/utils";

// initAdminApp(); // Initialize admin app if still needed for other purposes

const MOCK_USER_ID = "mock-user-001"; // Consistent mock user ID

// Helper function to fetch sheet data (could be from cache or API)
async function getSheetData(spreadsheetId: string): Promise<any[][]> {
  // This internal call needs to adapt as firebaseIdToken is removed
  // It might use a service account or other auth if sheets are private.
  // For now, assuming it might fetch public sheets or will be adapted later.
  const response = await fetch(`${getBaseUrl()}/api/sheets/${spreadsheetId}/data`
  //   , {
  //   headers: {
  //     // Authorization: `Bearer ${firebaseIdToken}`, // Removed
  //   },
  // }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to fetch sheet data for chat: ${errorData.error || response.statusText}`);
  }
  const result = await response.json();
  return result.data;
}

// Helper function to update Google Sheet - This will likely fail without a valid Google Access Token
async function updateGoogleSheet(spreadsheetId: string, range: string, value: string, googleAccessToken: string | null): Promise<void> {
  if (!googleAccessToken) {
    throw new Error("Cannot update Google Sheet: Google Access Token is missing.");
  }
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${googleAccessToken}`,
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
    // const authorization = request.headers.get("Authorization"); // Auth removed
    // if (!authorization?.startsWith("Bearer ")) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    // const firebaseIdToken = authorization.split("Bearer ")[1];
    // const decodedToken = await adminAuth().verifyIdToken(firebaseIdToken); // Auth removed
    // const userId = decodedToken.uid;
    const userId = MOCK_USER_ID; // Use mock user ID

    const { question, spreadsheetId, useWritebackFlow } = await request.json();

    if (!question || !spreadsheetId) {
      return NextResponse.json({ error: "Question and Spreadsheet ID are required" }, { status: 400 });
    }

    // User sheet verification might need to be adapted or removed if it relies on real user IDs
    // const userSheetRef = doc(db, "users", userId, "sheets", spreadsheetId);
    // const userSheetDoc = await getDoc(userSheetRef);
    // if (!userSheetDoc.exists()) {
    //   // If using MOCK_USER_ID, this check might need to be bypassed or use the mock ID for a generic record
    //   console.warn(`Sheet check for ${spreadsheetId} bypassed or using mock user ${userId}.`);
    //   // return NextResponse.json({ error: "Sheet not connected or access denied" }, { status: 403 });
    // }
    // const sheetConfig = userSheetDoc.data();


    await addChatMessage(userId, spreadsheetId, { text: question, sender: "user" });

    const sheetDataArray = await getSheetData(spreadsheetId); // firebaseIdToken removed
    const sheetDataString = formatSheetDataForPrompt(sheetDataArray);
    
    // getClientSdkStoredToken was for Google Sign-In, will return null.
    // const googleAccessToken = await getClientSdkStoredToken(userId); 
    const googleAccessToken: string | null = null; // Explicitly null as Google auth is removed
    
    if (!googleAccessToken && useWritebackFlow) {
        console.warn(`Google Access Token not found for user ${userId}. Writeback will be disabled.`);
    }

    let aiResponse;
    if (useWritebackFlow && googleAccessToken) {
      aiResponse = await writebackToSheet({
        question,
        sheetData: sheetDataString,
        spreadsheetId,
        accessToken: googleAccessToken,
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
         botMessageText += `\n(Note: I identified an update for ${aiResponse.update.range} but couldn't apply it as Google Sheets access is not currently configured.)`;
      }
    }

    await addChatMessage(userId, spreadsheetId, { text: botMessageText, sender: "bot", updateApplied: updateAppliedInfo });

    return NextResponse.json({ response: botMessageText, update: aiResponse.update });

  } catch (error: any) {
    console.error("Error in chat API:", error);
    // if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') { // Auth errors no longer relevant
    //   return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
    // }
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}
