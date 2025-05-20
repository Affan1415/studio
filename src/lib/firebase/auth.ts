import {
  type UserCredential,
  type User,
} from "firebase/auth";
import { auth, db } from "./config"; // auth might not be used anymore if all auth calls are removed
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

// Email/Password Sign-Up (No longer used)
export const signUpWithEmail = async (email: string, password: string): Promise<UserCredential | null> => {
  console.warn("Email sign-up is disabled as authentication has been removed.");
  return null;
};

// Email/Password Sign-In (No longer used)
export const signInWithEmail = async (email: string, password: string): Promise<UserCredential | null> => {
  console.warn("Email sign-in is disabled as authentication has been removed.");
  return null;
};

export const signOut = async (): Promise<void> => {
  console.warn("Sign out is disabled as authentication has been removed.");
  // In a no-auth setup, signOut might clear local state if any, but Firebase signOut is irrelevant.
};

// This function is no longer relevant for Google OAuth token management
export const getStoredGoogleAccessToken = async (userId: string): Promise<string | null> => {
  console.warn("Google Sign-In has been removed. getStoredGoogleAccessToken will always return null.");
  return null;
};

// Handles user document creation in Firestore upon first sign-up or to update details
// This function might still be called by some logic, so we'll make it a no-op or adapt it.
// For a no-auth setup, creating user-specific documents might not make sense unless a generic ID is used.
export const handleUserDocument = async (user: User | null): Promise<void> => {
  if (!user) {
    console.warn("handleUserDocument called with no user; authentication is removed.");
    return;
  }
  // With auth removed, this function's original purpose is diminished.
  // If you still need a "user" document for a generic app user, you could create/update one with a fixed ID.
  // For now, let's log and do nothing to prevent errors.
  console.log("handleUserDocument called for user:", user.uid, " (Auth is removed, this might be a mock user)");

  // Example: If you wanted to create a generic document for "the app user"
  // const genericUserId = "default-app-user";
  // const publicUserRef = doc(db, "users", genericUserId);
  // const userDoc = await getDoc(publicUserRef);
  // const userData = {
  //   uid: genericUserId,
  //   email: user.email || "anonymous@example.com",
  //   displayName: user.displayName || "App User",
  //   photoURL: user.photoURL,
  //   lastActivity: serverTimestamp(),
  // };
  // try {
  //   await setDoc(publicUserRef, userData, { merge: true });
  // } catch (error) {
  //   console.error("Error creating/updating generic user document:", error);
  // }
};
