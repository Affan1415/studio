import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type UserCredential,
  type User,
  signOut as firebaseSignOut,
  // GoogleAuthProvider, // No longer directly used here for sign-in trigger
  // signInWithPopup, // No longer directly used here for sign-in trigger
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

// Sign Up with Email and Password
export const signUpWithEmail = async (email: string, password: string): Promise<UserCredential | null> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await handleUserDocument(result.user);
    return result;
  } catch (error: any) {
    console.error("Error signing up with email and password:", error);
    // Consider re-throwing or returning error code for UI handling
    throw error; // Re-throw to be caught by calling component
  }
};

// Sign In with Email and Password
export const signInWithEmail = async (email: string, password: string): Promise<UserCredential | null> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await handleUserDocument(result.user); // Update lastLogin, etc.
    return result;
  } catch (error: any) {
    console.error("Error signing in with email and password:", error);
    // Consider re-throwing or returning error code for UI handling
    throw error; // Re-throw to be caught by calling component
  }
};


// Sign in with Google (Kept for potential future re-enablement, but not primary)
export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string | null } | null> => {
  const provider = new (await import('firebase/auth')).GoogleAuthProvider(); // Dynamically import
  provider.addScope('https://www.googleapis.com/auth/spreadsheets');

  try {
    const signInWithPopup = (await import('firebase/auth')).signInWithPopup;
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const GoogleAuthProviderCredentials = (await import('firebase/auth')).GoogleAuthProvider;
    const credential = GoogleAuthProviderCredentials.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;

    await handleUserDocument(user);
    return { user, accessToken };
  } catch (error: any) {
    console.error("Error during Google sign-in:", error);
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

// This function might be repurposed if server-side token storage is needed.
// For client-side, the AuthProvider will hold the accessToken if Google Sign-In is used.
export const getStoredGoogleAccessToken = async (userId: string): Promise<string | null> => {
  console.warn("Access token is managed by AuthProvider for Google Sign-In. This function may be deprecated or repurposed for other token types.");
  return null;
};
