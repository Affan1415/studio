
import {
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

interface SignInResult {
  user: User | null;
  accessToken: string | null;
  error?: {
    code?: string;
    message?: string;
  };
}

// Sign in with Google
export const signInWithGoogle = async (): Promise<SignInResult> => {
  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
  const provider = new GoogleAuthProvider();
  // Request access to Google Sheets.
  // This scope is crucial for the app's core functionality.
  provider.addScope('https://www.googleapis.com/auth/spreadsheets'); 

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Get Google OAuth access token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;
    
    await handleUserDocument(user); // Create or update user document in Firestore
    return { user, accessToken };
  } catch (error: any) {
    console.error("Error during Google sign-in:", error);
    return { 
      user: null, 
      accessToken: null, 
      error: { 
        code: error.code || 'UNKNOWN_ERROR', 
        message: error.message || 'An unexpected error occurred during sign-in.' 
      } 
    };
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

// This function might be repurposed if server-side token storage is needed.
// For client-side, the AuthProvider will hold the accessToken if Google Sign-In is used.
export const getStoredGoogleAccessToken = async (userId: string): Promise<string | null> => {
  // This implementation is a placeholder as access token is now managed in AuthProvider for client-side.
  // For server-side scenarios, a secure token store would be needed.
  console.warn("getStoredGoogleAccessToken is a placeholder and might be deprecated for client-side token management.");
  // Example: If you were storing tokens in Firestore (ensure secure server-side access only)
  // const tokenRef = doc(db, "users", userId, "private", "googleCredentials");
  // const tokenDoc = await getDoc(tokenRef);
  // if (tokenDoc.exists()) {
  //   return tokenDoc.data().accessToken;
  // }
  return null;
};

// Placeholder for Email/Password Sign Up if re-enabled
export const signUpWithEmail = async (email: string, password: string): Promise<SignInResult> => {
  // const { createUserWithEmailAndPassword } = await import('firebase/auth');
  // try {
  //   const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  //   await handleUserDocument(userCredential.user);
  //   return { user: userCredential.user, accessToken: null }; // No Google access token here
  // } catch (error: any) {
  //   console.error("Error signing up with email and password:", error);
  //   return { user: null, accessToken: null, error: { code: error.code, message: error.message } };
  // }
  console.warn("signUpWithEmail is currently disabled.");
  return { user: null, accessToken: null, error: { message: "Email/Password sign-up is disabled."} };
};

// Placeholder for Email/Password Sign In if re-enabled
export const signInWithEmail = async (email: string, password: string): Promise<SignInResult> => {
  // const { signInWithEmailAndPassword } = await import('firebase/auth');
  // try {
  //   const userCredential = await signInWithEmailAndPassword(auth, email, password);
  //   await handleUserDocument(userCredential.user); // Update last login
  //   return { user: userCredential.user, accessToken: null }; // No Google access token here
  // } catch (error: any) {
  //   console.error("Error signing in with email and password:", error);
  //   return { user: null, accessToken: null, error: { code: error.code, message: error.message } };
  // }
  console.warn("signInWithEmail is currently disabled.");
  return { user: null, accessToken: null, error: { message: "Email/Password sign-in is disabled."} };
};
