
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

// Sign in with Google
export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string | null } | null> => {
  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/spreadsheets'); // Request access to Google Sheets

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
     if (error.code === 'auth/popup-closed-by-user') {
      // User closed the popup
      // Handled in AuthButton by checking for null result
    }
    return null; // Indicate failure
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
