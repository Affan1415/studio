
// src/app/api/sheets/connect/route.ts
import { NextResponse } from "next/server";
// import { auth as adminAuth } from "firebase-admin"; // Admin auth for token verification removed
// import { initAdminApp } from "@/lib/firebase/admin-config"; // Still needed if other admin features used
import { connectSheet } from "@/lib/firebase/firestore"; // getStoredGoogleAccessToken removed
import { extractSheetIdFromUrl } from "@/lib/utils";

// initAdminApp(); // Initialize admin app if still needed

const MOCK_USER_ID = "mock-user-001";

// This function will use a placeholder as access token won't be available
async function getSheetName(spreadsheetId: string, accessToken: string | null): Promise<string> {
  if (!accessToken) {
    console.warn("getSheetName: No access token, using placeholder sheet name.");
    return `Sheet: ${spreadsheetId.substring(0, 8)}... (Name not fetched)`;
  }
  // Actual Google Sheets API call to get sheet name/title
  // This part will not be reached if accessToken is null.
  try {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      console.error("Failed to fetch sheet details for name:", await response.text());
      throw new Error('Failed to fetch sheet details');
    }
    const data = await response.json();
    return data.properties.title || `Sheet: ${spreadsheetId.substring(0, 8)}`;
  } catch (error) {
    console.error("Error in getSheetName:", error);
    return `Sheet: ${spreadsheetId.substring(0, 8)}... (Error fetching name)`;
  }
}

export async function POST(request: Request) {
  try {
    // const authorization = request.headers.get("Authorization"); // Auth removed
    // if (!authorization?.startsWith("Bearer ")) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    // const idToken = authorization.split("Bearer ")[1];
    // const decodedToken = await adminAuth().verifyIdToken(idToken); // Auth removed
    // const userId = decodedToken.uid;
    const userId = MOCK_USER_ID;

    const { sheetUrl } = await request.json();
    if (!sheetUrl) {
      return NextResponse.json({ error: "Sheet URL is required" }, { status: 400 });
    }

    const spreadsheetId = extractSheetIdFromUrl(sheetUrl);
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Invalid Google Sheet URL" }, { status: 400 });
    }
    
    // Fetch user's Google Access Token - will be null
    // const googleAccessToken = await getStoredGoogleAccessToken(userId); 
    const googleAccessToken: string | null = null; 
    
    if (!googleAccessToken) {
      console.warn(`Google Access Token not found for user ${userId} (expected as auth is removed). Cannot fetch actual sheet name.`);
    }
    
    const sheetName = await getSheetName(spreadsheetId, googleAccessToken); // Will use placeholder logic

    await connectSheet(userId, spreadsheetId, sheetName, sheetUrl);

    return NextResponse.json({ message: "Sheet connected successfully (using mock user)", spreadsheetId, sheetName });

  } catch (error: any) {
    console.error("Error connecting sheet:", error);
    // if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') { // Auth errors no longer relevant
    //   return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
    // }
    return NextResponse.json({ error: "Internal server error while connecting sheet" }, { status: 500 });
  }
}
