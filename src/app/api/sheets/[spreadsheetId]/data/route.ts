// src/app/api/sheets/[spreadsheetId]/data/route.ts
import { NextResponse } from "next/server";
import { auth as adminAuth } from "firebase-admin";
import { initAdminApp } from "@/lib/firebase/admin-config";
import { getCachedSheetData, setCachedSheetData, getStoredGoogleAccessToken as getClientSdkStoredToken } from "@/lib/firebase/firestore"; // Uses client SDK's getDoc for Firestore ops
import { doc, getDoc } from "firebase/firestore"; // Import client SDK getDoc explicitly for user sheet check
import { db } from "@/lib/firebase/config"; // client SDK db instance

initAdminApp();

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Function to fetch data directly from Google Sheets API
async function fetchSheetFromGoogle(spreadsheetId: string, accessToken: string): Promise<any[][]> {
  const range = "A:Z"; // Fetch all columns in all existing rows
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Google Sheets API error:", errorData);
    throw new Error(`Failed to fetch sheet data: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.values || []; // data.values is an array of arrays
}

export async function GET(
  request: Request,
  { params }: { params: { spreadsheetId: string } }
) {
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken = await adminAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { spreadsheetId } = params;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Spreadsheet ID is required" }, { status: 400 });
    }

    // Verify user has this sheet connected
    const userSheetRef = doc(db, "users", userId, "sheets", spreadsheetId);
    const userSheetDoc = await getDoc(userSheetRef); // Using client SDK getDoc
    if (!userSheetDoc.exists()) {
      return NextResponse.json({ error: "Sheet not connected or access denied" }, { status: 403 });
    }

    // Check cache
    const cachedEntry = await getCachedSheetData(spreadsheetId); // Using client SDK getDoc
    if (cachedEntry && cachedEntry.lastFetched) {
      const lastFetchedTime = (cachedEntry.lastFetched as any).toDate ? (cachedEntry.lastFetched as any).toDate().getTime() : new Date(cachedEntry.lastFetched.seconds * 1000).getTime();
      if (Date.now() - lastFetchedTime < CACHE_DURATION_MS) {
        return NextResponse.json({ data: JSON.parse(cachedEntry.data), source: "cache" });
      }
    }

    // Fetch user's Google Access Token
    const googleAccessToken = await getClientSdkStoredToken(userId); // Using client SDK getDoc
    if (!googleAccessToken) {
      return NextResponse.json({ error: "Google OAuth token not found. Please re-authenticate." }, { status: 403 });
    }

    // Fetch from Google Sheets API
    const sheetData = await fetchSheetFromGoogle(spreadsheetId, googleAccessToken);

    // Update cache
    await setCachedSheetData(spreadsheetId, sheetData, userId); // Using client SDK setDoc

    return NextResponse.json({ data: sheetData, source: "api" });

  } catch (error: any) {
    console.error("Error fetching sheet data:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
    }
    if (error.message?.includes("Failed to fetch sheet data")) {
        return NextResponse.json({ error: error.message }, { status: 502 }); // Bad Gateway if Sheets API fails
    }
    return NextResponse.json({ error: "Internal server error while fetching sheet data" }, { status: 500 });
  }
}
