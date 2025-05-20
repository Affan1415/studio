import {
  signInWithPopup,
  GoogleAuthProvider,
  type UserCredential,
  type User,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, db } from "./config";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

// Handles user document creation/update in Firestore
export const handleUserDocument = async (user: User): Promise<void> => {
  if (!user) return;
  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);

  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    lastLogin: serverTimestamp(),
  };

  if (!userDoc.exists()) {
    // New user
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
    });
  } else {
    // Existing user
    await setDoc(userRef, userData, { merge: true });
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string | null } | null> => {
  const provider = new GoogleAuthProvider();
  // You can request additional scopes here if needed for Google APIs
  provider.addScope('https://www.googleapis.com/auth/spreadsheets'); // Example for Google Sheets

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Get the Google OAuth Access Token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;

    await handleUserDocument(user);
    return { user, accessToken };
  } catch (error: any) {
    console.error("Error during Google sign-in:", error);
    // Handle specific errors (e.g., popup closed, network error)
    if (error.code === 'auth/popup-closed-by-user') {
      // User closed the popup
    }
    return null;
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

// The following functions are related to email/password and Google token storage,
// which are being replaced or handled differently with the new Google Sign-In.
// They can be removed or adapted if specific functionality is still needed.

// Email/Password Sign-Up (No longer used with primary Google Sign-In)
export const signUpWithEmail = async (email: string, password: string): Promise<UserCredential | null> => {
  console.warn("Email sign-up is not the primary authentication method.");
  return null;
};

// Email/Password Sign-In (No longer used with primary Google Sign-In)
export const signInWithEmail = async (email: string, password: string): Promise<UserCredential | null> => {
  console.warn("Email sign-in is not the primary authentication method.");
  return null;
};

// This function might be repurposed if server-side token storage is needed.
// For client-side, the AuthProvider will hold the accessToken.
export const getStoredGoogleAccessToken = async (userId: string): Promise<string | null> => {
  console.warn("Access token is now managed by AuthProvider. This function may be deprecated or repurposed.");
  // Example: If you were storing tokens in Firestore (more complex setup)
  // const tokenRef = doc(db, "users", userId, "private", "googleOAuth");
  // const tokenDoc = await getDoc(tokenRef);
  // if (tokenDoc.exists()) {
  //   return tokenDoc.data().accessToken;
  // }
  return null;
};
