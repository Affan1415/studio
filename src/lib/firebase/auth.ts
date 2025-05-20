import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type UserCredential,
  type OAuthCredential,
} from "firebase/auth";
import { auth, db } from "./config";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

const googleProvider = new GoogleAuthProvider();
// Request Google Sheets API scope
googleProvider.addScope("https://www.googleapis.com/auth/spreadsheets");

export const signInWithGoogle = async (): Promise<UserCredential | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (credential && credential.accessToken && result.user) {
      // Store the Google OAuth access token and refresh token (if available) in Firestore
      const userRef = doc(db, "users", result.user.uid, "googleOAuth", "credentials");
      await setDoc(userRef, {
        accessToken: credential.accessToken,
        // refreshToken: result.user.refreshToken, // Firebase SDK might not expose refresh token this way easily for Google post-initial auth
        // Instead, rely on Firebase to manage session or re-prompt if access token expires and cannot be refreshed by SDK.
        // For long-lived server access, a proper OAuth flow with server-side refresh token handling is robust.
        // For this client-heavy app, we'll use the access token and re-prompt if it expires and can't be used.
        lastUpdated: serverTimestamp(),
        // expiresAt: Date.now() + (credential.expiresIn || 3600) * 1000, // Approximate expiry if expiresIn is available
      }, { merge: true });

      // Store basic user info if new user
      const publicUserRef = doc(db, "users", result.user.uid);
      const userDoc = await getDoc(publicUserRef);
      if (!userDoc.exists()) {
        await setDoc(publicUserRef, {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          createdAt: serverTimestamp(),
        }, { merge: true });
      }
    } else {
      console.error("Google OAuth credential or access token not found.");
      return null;
    }
    return result;
  } catch (error) {
    console.error("Error during Google sign-in:", error);
    return null;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

export const getStoredGoogleAccessToken = async (userId: string): Promise<string | null> => {
  if (!userId) return null;
  try {
    const tokenRef = doc(db, "users", userId, "googleOAuth", "credentials");
    const tokenDoc = await getDoc(tokenRef);
    if (tokenDoc.exists()) {
      const data = tokenDoc.data();
      // TODO: Add logic to check if token is expired and handle refresh if possible/necessary
      return data.accessToken;
    }
    return null;
  } catch (error) {
    console.error("Error fetching stored Google access token:", error);
    return null;
  }
};
