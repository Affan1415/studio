import {
  signOut as firebaseSignOut,
  type UserCredential,
} from "firebase/auth";
import { auth, db } from "./config";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

// Google Sign-In has been removed.
// signInWithGoogle function and GoogleAuthProvider are no longer here.

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

export const getStoredGoogleAccessToken = async (userId: string): Promise<string | null> => {
  console.warn("Google Sign-In has been removed. getStoredGoogleAccessToken will always return null. Sheet interactions requiring user OAuth token will likely fail.");
  return null;
};

// Example function to handle user document creation/update for non-Google auth if needed in the future
export const handleUserDocument = async (user: import("firebase/auth").User): Promise<void> => {
  if (!user) return;
  const publicUserRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(publicUserRef);
  if (!userDoc.exists()) {
    try {
      await setDoc(publicUserRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error("Error creating user document:", error);
    }
  }
};
