
// src/app/api/sheets/[spreadsheetId]/data/route.ts
import { NextResponse } from "next/server";
// import { auth as adminAuth } from "firebase-admin"; // Admin auth for token verification removed
// import { initAdminApp } from "@/lib/firebase/admin-config"; // Still needed if other admin features used
import { getCachedSheetData, setCachedSheetData } from "@/lib/firebase/firestore";
// import { doc, getDoc } from "firebase/firestore"; // For user sheet verification
// import { db } from "@/lib/firebase/config"; // For user sheet verification

// initAdminApp(); // Initialize admin app if still needed

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const MOCK_USER_ID = "mock-user-001";

// Function to fetch data directly from Google Sheets API
// This will fail for private sheets without a valid accessToken
async function fetchSheetFromGoogle(spreadsheetId: string, accessToken: string | null): Promise<any[][]> {
  if (!accessToken) {
    // Attempt to fetch as if it's a public sheet, or handle error.
    // For now, we'll error out if no token for a private sheet.
    // If your sheets are public, this API call structure needs to change (e.g. use API key in URL).
    console.error("fetchSheetFromGoogle: No access token provided. Cannot fetch private sheet data.");
    throw new Error("Google OAuth token not found. Cannot fetch private sheet data without authentication.");
  }
  
  const range = "A:Z";
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
  return data.values || [];
}

export async function GET(
  request: Request,
  { params }: { params: { spreadsheetId: string } }
) {
  try {
    // const authorization = request.headers.get("Authorization"); // Auth removed
    // if (!authorization?.startsWith("Bearer ")) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    // const idToken = authorization.split("Bearer ")[1];
    // const decodedToken = await adminAuth().verifyIdToken(idToken); // Auth removed
    // const userId = decodedToken.uid;
    const userId = MOCK_USER_ID;

    const { spreadsheetId } = params;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Spreadsheet ID is required" }, { status: 400 });
    }

    // User sheet verification might need to be adapted or removed
    // const userSheetRef = doc(db, "users", userId, "sheets", spreadsheetId);
    // const userSheetDoc = await getDoc(userSheetRef);
    // if (!userSheetDoc.exists()) {
    //   console.warn(`Sheet check for ${spreadsheetId} bypassed or using mock user ${userId}.`);
    //   // return NextResponse.json({ error: "Sheet not connected or access denied" }, { status: 403 });
    // }

    const cachedEntry = await getCachedSheetData(spreadsheetId);
    if (cachedEntry && cachedEntry.lastFetched) {
      const lastFetchedTime = (cachedEntry.lastFetched as any).toDate ? (cachedEntry.lastFetched as any).toDate().getTime() : new Date(cachedEntry.lastFetched.seconds * 1000).getTime();
      if (Date.now() - lastFetchedTime < CACHE_DURATION_MS) {
        return NextResponse.json({ data: JSON.parse(cachedEntry.data), source: "cache" });
      }
    }

    // Fetch user's Google Access Token - This will be null as Google auth is removed.
    // const googleAccessToken = await getClientSdkStoredToken(userId); 
    const googleAccessToken: string | null = null;

    if (!googleAccessToken) {
      // This is expected with auth removed. The app must handle this.
      // Fetching private sheets will fail. Public sheets would need a different API call.
      console.warn("Google OAuth token not found (expected as auth is removed). Trying to fetch sheet data without it will likely fail for private sheets.");
      // To allow fetching public sheets, fetchSheetFromGoogle would need an API key or be structured differently.
      // For now, we let it try and potentially fail if the sheet is private.
    }

    const sheetData = await fetchSheetFromGoogle(spreadsheetId, googleAccessToken);
    await setCachedSheetData(spreadsheetId, sheetData, userId);

    return NextResponse.json({ data: sheetData, source: "api" });

  } catch (error: any) {
    console.error("Error fetching sheet data:", error);
    // if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') { // Auth errors no longer relevant
    //   return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
    // }
    if (error.message?.includes("Google OAuth token not found")) {
        return NextResponse.json({ error: error.message }, { status: 403 }); // Forbidden if token is explicitly missing
    }
    if (error.message?.includes("Failed to fetch sheet data")) {
        return NextResponse.json({ error: error.message }, { status: 502 }); 
    }
    return NextResponse.json({ error: "Internal server error while fetching sheet data" }, { status: 500 });
  }
}
