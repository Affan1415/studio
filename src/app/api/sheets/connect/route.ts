
// src/app/api/sheets/connect/route.ts
import { NextResponse } from "next/server";
import { auth as adminAuth } from "firebase-admin";
import { initAdminApp } from "@/lib/firebase/admin-config";
import { connectSheet } from "@/lib/firebase/firestore";
import { extractSheetIdFromUrl } from "@/lib/utils";
// import { getStoredGoogleAccessToken } from "@/lib/firebase/auth"; // We'll pass token from client

initAdminApp();

async function getSheetName(spreadsheetId: string, accessToken: string): Promise<string> {
  try {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to fetch sheet details for name:", errorData);
      // Fallback to a generic name if API call fails
      return `Sheet: ${spreadsheetId.substring(0, 8)}... (Name fetch failed)`;
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

    // Expect googleAccessToken to be passed in the body from the client
    const { sheetUrl, googleAccessToken } = await request.json(); 
    if (!sheetUrl) {
      return NextResponse.json({ error: "Sheet URL is required" }, { status: 400 });
    }
    if (!googleAccessToken) {
      return NextResponse.json({ error: "Google Access Token is required to connect and fetch sheet name." }, { status: 400 });
    }


    const spreadsheetId = extractSheetIdFromUrl(sheetUrl);
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Invalid Google Sheet URL" }, { status: 400 });
    }
        
    const sheetName = await getSheetName(spreadsheetId, googleAccessToken);

    await connectSheet(userId, spreadsheetId, sheetName, sheetUrl);

    return NextResponse.json({ message: "Sheet connected successfully", spreadsheetId, sheetName });

  } catch (error: any) {
    console.error("Error connecting sheet:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error while connecting sheet" }, { status: 500 });
  }
}
