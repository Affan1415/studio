
// src/app/api/sheets/[spreadsheetId]/data/route.ts
import { NextResponse } from "next/server";
import { auth as adminAuth } from "firebase-admin";
import { initAdminApp } from "@/lib/firebase/admin-config";
import { getCachedSheetData, setCachedSheetData, getUserSheets } from "@/lib/firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { getStoredGoogleAccessToken } from "@/lib/firebase/auth"; // To get user's Google token

initAdminApp();

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Function to fetch data directly from Google Sheets API
async function fetchSheetFromGoogle(spreadsheetId: string, accessToken: string): Promise<any[][]> {
  const range = "A:Z"; // Fetch all columns, adjust if needed
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Google Sheets API error:", errorData);
    throw new Error(`Failed to fetch sheet data from Google: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.values || []; // Ensure it returns an array even if 'values' is undefined
}

export async function GET(
  request: Request,
  { params }: { params: { spreadsheetId: string } }
) {
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

    const { spreadsheetId } = params;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Spreadsheet ID is required" }, { status: 400 });
    }

    // Verify user has this sheet connected
    const userSheetRef = doc(db, "users", userId, "sheets", spreadsheetId);
    const userSheetDoc = await getDoc(userSheetRef);
    if (!userSheetDoc.exists()) {
      return NextResponse.json({ error: "Sheet not connected or access denied for this user." }, { status: 403 });
    }

    const cachedEntry = await getCachedSheetData(spreadsheetId);
    if (cachedEntry && cachedEntry.lastFetched) {
      const lastFetchedTime = (cachedEntry.lastFetched as any).toDate ? (cachedEntry.lastFetched as any).toDate().getTime() : new Date(cachedEntry.lastFetched.seconds * 1000).getTime();
      if (Date.now() - lastFetchedTime < CACHE_DURATION_MS) {
        return NextResponse.json({ data: JSON.parse(cachedEntry.data), source: "cache" });
      }
    }

    // Fetch user's Google Access Token (assuming it's stored securely after sign-in)
    // This part requires a robust way to get the user's current Google OAuth token.
    // The `googleAccessToken` obtained on client sign-in should be passed here if this route is called from client.
    // If this route is called from another backend service (like the chat API), that service needs the token.
    // For simplicity, we'll assume `getStoredGoogleAccessToken` can retrieve it,
    // but in a real app, the client often sends its fresh Google Access Token for such operations.
    // The request might need to include `googleAccessToken` in its body or headers if fetched by client.
    // For this example, we'll try to use `getStoredGoogleAccessToken` but it might be null.
    
    // A better pattern for client-initiated fetch: client sends its googleAccessToken.
    // For now, let's assume for this GET route, if called by client, client already has sheets access.
    // The server-side `getStoredGoogleAccessToken` is more for server-initiated background tasks.
    // Let's try to extract it from a custom header if client sends it.
    const googleAccessTokenFromHeader = request.headers.get("X-Google-Access-Token");

    if (!googleAccessTokenFromHeader) {
        // This route is called by the chat API, which *should* have the firebaseIdToken.
        // The chat API itself needs the googleAccessToken to pass to the sheets API if it's to update.
        // This specific /data route, if called by the client, needs a Google Access token.
        // If called by the chat API to GET data for the prompt, the chat API's `googleAccessToken` is for writeback, not necessarily this read.
        // For now, let's assume this route might be hit directly by client or internally.
        // If hit by chat API, it doesn't need googleAccessToken *for this read*, only sheetId + user auth.
        // This is tricky. Let's assume for now a public read or a read using a service account if no token.
        // BUT, since we verified userSheetRef, we should attempt fetch with USER'S token.
        // This means the client *must* provide its Google Access Token.
        // For now, let's use a placeholder/error if not provided.

        // This function is expected to be called by the Chat API. The Chat API gets the googleAccessToken from the client.
        // So this /data route doesn't directly need the googleAccessToken, it's called by a trusted backend (Chat API)
        // that has already authenticated the user.
        // The actual call to Google Sheets API from *this* route would need a service account or app's own credentials
        // if it's not using the user's token.
        // Let's assume, for now, that this route uses a generic (service account based) way to fetch,
        // and `fetchSheetFromGoogle` needs to be adapted if it's not using user's token.
        // For this re-auth, let's stick to USER'S token. So client must send it.
        
        // The `getSheetData` in `chat/route.ts` calls this. It only passes `firebaseIdToken`.
        // This route then needs to acquire the `googleAccessToken` itself.
        // This is where a server-side token store for `userId` would be useful.
        // The `getStoredGoogleAccessToken` would fetch from there.

        // For now, this API will rely on a Google Access Token being passed via a custom header,
        // or it will fail if one is needed and not present.
        // This is a placeholder. In a robust app, this token management is crucial.
        // The AuthProvider on the client should expose this token.
        // Client-side calls to this route would need to include it.
        
        // Let's assume `fetchSheetFromGoogle` requires a token.
        // The `getStoredGoogleAccessToken(userId)` is a server-side way.
        // If client calls this, it must pass token. For now, we try `getStoredGoogleAccessToken`.
        const userGoogleToken = await getStoredGoogleAccessToken(userId); // This is a server-side fetch if available
        if (!userGoogleToken) {
            return NextResponse.json({ error: "Google OAuth token not available for this user to fetch sheet data." }, { status: 403 });
        }
        // Fallback to this if no header, then use this.
        const sheetData = await fetchSheetFromGoogle(spreadsheetId, userGoogleToken);
        await setCachedSheetData(spreadsheetId, sheetData, userId);
        return NextResponse.json({ data: sheetData, source: "api (user token)" });
    }


    const sheetData = await fetchSheetFromGoogle(spreadsheetId, googleAccessTokenFromHeader);
    await setCachedSheetData(spreadsheetId, sheetData, userId);

    return NextResponse.json({ data: sheetData, source: "api (header token)" });

  } catch (error: any) {
    console.error("Error fetching sheet data:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
    }
    if (error.message?.includes("Google OAuth token not available")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message?.includes("Failed to fetch sheet data")) { // From fetchSheetFromGoogle
        return NextResponse.json({ error: error.message }, { status: 502 }); 
    }
    return NextResponse.json({ error: "Internal server error while fetching sheet data" }, { status: 500 });
  }
}
