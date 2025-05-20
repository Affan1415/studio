// src/app/api/user/tokens/route.ts
import { NextResponse } from "next/server";
import { auth as adminAuth } from "firebase-admin"; // Using Admin SDK for backend auth verification
import { initAdminApp } from "@/lib/firebase/admin-config";
import { getStoredGoogleAccessToken, signInWithGoogle } from "@/lib/firebase/auth"; // client-side auth helpers
import { db } from "@/lib/firebase/config"; // client-side db for user-specific token storage
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

initAdminApp(); // Initialize Firebase Admin SDK

// This route is primarily for the client to fetch its own stored token if needed,
// or for a server component to securely get it.
// Storing tokens is handled client-side after Google Sign In via lib/firebase/auth.ts `signInWithGoogle`
// which directly writes to Firestore. This API can be enhanced if server needs to initiate token storage.

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    
    const decodedToken = await adminAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const tokenData = await getStoredGoogleAccessToken(userId); // Uses client SDK to read from Firestore

    if (tokenData) {
      return NextResponse.json({ accessToken: tokenData });
    } else {
      return NextResponse.json({ error: "No Google OAuth token found for user." }, { status: 404 });
    }
  } catch (error: any) {
    console.error("Error fetching user tokens:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
        return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Example POST: if client needs to explicitly trigger a token store/update operation via API
// (Though current design has client's signInWithGoogle directly writing to Firestore)
export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken = await adminAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { accessToken /*, refreshToken, expiresIn */ } = await request.json();
    if (!accessToken) {
      return NextResponse.json({ error: "Access token is required" }, { status: 400 });
    }

    const userRef = doc(db, "users", userId, "googleOAuth", "credentials");
    await setDoc(userRef, {
      accessToken: accessToken,
      // refreshToken: refreshToken, // If provided
      lastUpdated: serverTimestamp(),
      // expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : undefined,
    }, { merge: true });

    return NextResponse.json({ message: "Token stored successfully" });

  } catch (error: any) {
    console.error("Error storing user token:", error);
     if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
        return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
