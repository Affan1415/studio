import * as admin from "firebase-admin";

let hasBeenInitialized = admin.apps.length > 0;

export function initAdminApp() {
  if (hasBeenInitialized) {
    return admin.app(); // Return the already initialized app
  }

  try {
    const app = admin.initializeApp({
      credential: process.env.GOOGLE_APPLICATION_CREDENTIALS
        ? admin.credential.cert(JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'base64').toString('utf-8')))
        : admin.credential.applicationDefault(),
    });
    console.log("Firebase Admin SDK initialized.");
    hasBeenInitialized = true;
    return app;
  } catch (error: any) {
    // Check if the error is because the app is already initialized (which can happen in some hot-reloading scenarios)
    if (error.code === 'app/duplicate-app') {
      console.warn("Firebase Admin SDK already initialized (duplicate app error suppressed).");
      hasBeenInitialized = true;
      return admin.app(); // Return the existing app
    }
    // Log other initialization errors
    console.error("Firebase Admin SDK initialization error:", error);
    // Optionally re-throw or handle more gracefully depending on your application's needs
    throw error; // Re-throw if it's a critical error preventing app function
  }
}
