// src/app/api/sheets/connect/route.ts
import { NextResponse } from "next/server";
import { auth as adminAuth } from "firebase-admin";
import { initAdminApp } from "@/lib/firebase/admin-config";
import { connectSheet, getStoredGoogleAccessToken } from "@/lib/firebase/firestore"; // Using client SDK for Firestore ops from backend
import { extractSheetIdFromUrl } from "@/lib/utils";

initAdminApp();

async function getSheetName(spreadsheetId: string, accessToken: string): Promise<string> {
  // TODO: Implement actual Google Sheets API call to get sheet name/title
  // Example:
  // const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title`, {
  //   headers: { Authorization: `Bearer ${accessToken}` },
  // });
  // if (!response.ok) throw new Error('Failed to fetch sheet details');
  // const data = await response.json();
  // return data.properties.title;
  return `Sheet: ${spreadsheetId.substring(0, 8)}`; // Placeholder
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken = await adminAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { sheetUrl } = await request.json();
    if (!sheetUrl) {
      return NextResponse.json({ error: "Sheet URL is required" }, { status: 400 });
    }

    const spreadsheetId = extractSheetIdFromUrl(sheetUrl);
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Invalid Google Sheet URL" }, { status: 400 });
    }
    
    // Fetch user's Google Access Token to potentially get sheet name (optional, or use API key for public properties)
    const googleAccessToken = await getStoredGoogleAccessToken(userId); // This uses the client SDK's getDoc
    if (!googleAccessToken) {
      // This implies the user needs to re-auth or there's an issue with token storage.
      // For now, we can proceed without fetching sheet name if token is missing, or deny connection.
      // Let's assume for now we can proceed and use a placeholder name or just the ID.
      console.warn(`Google Access Token not found for user ${userId}. Cannot fetch sheet name.`);
      // return NextResponse.json({ error: "Google OAuth token not found. Please re-authenticate." }, { status: 403 });
    }
    
    // Placeholder sheet name logic
    const sheetName = googleAccessToken ? await getSheetName(spreadsheetId, googleAccessToken) : `Sheet (${spreadsheetId.slice(0,5)}...)`;

    await connectSheet(userId, spreadsheetId, sheetName, sheetUrl);

    return NextResponse.json({ message: "Sheet connected successfully", spreadsheetId, sheetName });

  } catch (error: any) {
    console.error("Error connecting sheet:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error while connecting sheet" }, { status: 500 });
  }
}
