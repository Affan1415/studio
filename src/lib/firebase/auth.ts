import {
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type UserCredential,
  type User,
} from "firebase/auth";
import { auth, db } from "./config";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

// Email/Password Sign-Up
export const signUpWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await handleUserDocument(userCredential.user); // Create user doc in Firestore
    return userCredential;
  } catch (error) {
    console.error("Error signing up with email and password:", error);
    throw error; // Re-throw for the component to handle
  }
};

// Email/Password Sign-In
export const signInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // User document should already exist or be handled by onAuthStateChanged logic if first login with new method
    return userCredential;
  } catch (error) {
    console.error("Error signing in with email and password:", error);
    throw error; // Re-throw for the component to handle
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

// This function is no longer relevant for Google OAuth token management
export const getStoredGoogleAccessToken = async (userId: string): Promise<string | null> => {
  console.warn("Google Sign-In has been removed. getStoredGoogleAccessToken will always return null.");
  return null;
};

// Handles user document creation in Firestore upon first sign-up or to update details
export const handleUserDocument = async (user: User): Promise<void> => {
  if (!user) return;
  const publicUserRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(publicUserRef);

  // Prepare base user data
  const userData: { [key: string]: any } = {
    uid: user.uid,
    email: user.email,
    // displayName and photoURL might be null for email/password users initially
    displayName: user.displayName || user.email?.split('@')[0] || "User", // Default display name
    photoURL: user.photoURL,
  };

  if (!userDoc.exists()) {
    // New user, create document with createdAt
    userData.createdAt = serverTimestamp();
    try {
      await setDoc(publicUserRef, userData);
    } catch (error) {
      console.error("Error creating user document:", error);
    }
  } else {
    // Existing user, update last login or other relevant fields if necessary (optional)
    // For now, we'll just ensure the basic info is there.
    // userData.lastLoginAt = serverTimestamp(); // Example
    try {
      await setDoc(publicUserRef, userData, { merge: true }); // Merge to avoid overwriting existing fields not handled here
    } catch (error) {
      console.error("Error updating user document:", error);
    }
  }
};
