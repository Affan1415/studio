import * as admin from "firebase-admin";

const hasBeenInitialized = admin.apps.length > 0;

export function initAdminApp() {
  if (hasBeenInitialized) {
    return;
  }

  // These environment variables are automatically set by Firebase Functions/Cloud Run if deployed there.
  // For local development, you might need to set GOOGLE_APPLICATION_CREDENTIALS to point to your service account key JSON file.
  // Or, if using `firebase emulators:start`, it might work without explicit creds.
  
  // For local development with `genkit start` or `next dev`, using `GOOGLE_APPLICATION_CREDENTIALS` is common.
  // Ensure your service account has necessary permissions.

  try {
    admin.initializeApp({
      credential: process.env.GOOGLE_APPLICATION_CREDENTIALS
        ? admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS)
        : admin.credential.applicationDefault(), // For environments like Cloud Functions/Run
      // databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com` // Optional
    });
    console.log("Firebase Admin SDK initialized.");
  } catch (error: any) {
    if (error.code === 'app/duplicate-app') {
      console.warn("Firebase Admin SDK already initialized (duplicate app error suppressed).");
    } else {
      console.error("Firebase Admin SDK initialization error:", error);
    }
  }
}
