
import * as admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;

export function initAdminApp(): admin.app.App {
  if (adminApp) {
    // console.log('Firebase Admin SDK already initialized. Returning existing app.');
    return adminApp;
  }

  console.log('Attempting to initialize Firebase Admin SDK...');

  let credentialToUse: admin.credential.Credential;

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('GOOGLE_APPLICATION_CREDENTIALS env var is set. Attempting to use it.');
    try {
      const base64EncodedKey = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (!base64EncodedKey.trim()) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS env var is empty.');
      }
      const decodedJsonString = Buffer.from(base64EncodedKey, 'base64').toString('utf-8');
      // console.log('Decoded JSON string from ENV:', decodedJsonString); // Sensitive, log locally for debug if needed

      const serviceAccount = JSON.parse(decodedJsonString);
      // console.log('Parsed service account object from ENV:', serviceAccount); // Sensitive

      if (!serviceAccount || typeof serviceAccount.project_id === 'undefined' || typeof serviceAccount.private_key === 'undefined' || typeof serviceAccount.client_email === 'undefined') {
        throw new Error('Parsed service account from ENV is invalid or missing required fields (project_id, private_key, client_email).');
      }
      credentialToUse = admin.credential.cert(serviceAccount);
      console.log('Successfully created credential using service account from GOOGLE_APPLICATION_CREDENTIALS.');
    } catch (e: any) {
      console.error('Error processing GOOGLE_APPLICATION_CREDENTIALS:', e.message);
      console.warn('Falling back to applicationDefault() due to error with GOOGLE_APPLICATION_CREDENTIALS.');
      try {
        credentialToUse = admin.credential.applicationDefault();
        console.log('Successfully created credential using applicationDefault() as fallback.');
      } catch (appDefaultError: any) {
        console.error('Critical Error: admin.credential.applicationDefault() also failed after GOOGLE_APPLICATION_CREDENTIALS processing error:', appDefaultError.message);
        throw new Error(`Firebase Admin SDK: Failed to obtain credentials. ENV var processing error: ${e.message}. Then applicationDefault() error: ${appDefaultError.message}`);
      }
    }
  } else {
    console.log('GOOGLE_APPLICATION_CREDENTIALS env var not set. Attempting to use applicationDefault().');
    try {
      credentialToUse = admin.credential.applicationDefault();
      console.log('Successfully created credential using applicationDefault().');
    } catch (e: any) {
      console.error('Critical Error: admin.credential.applicationDefault() failed:', e.message);
      throw new Error(`Firebase Admin SDK: Failed to obtain credentials via applicationDefault(): ${e.message}`);
    }
  }

  try {
    console.log('Calling admin.initializeApp() with the determined credential...');
    adminApp = admin.initializeApp({
      credential: credentialToUse,
    });
    console.log('Firebase Admin SDK initialized successfully.');
    return adminApp;
  } catch (error: any) {
    // Check if the error is because the app is already initialized (which can happen in some hot-reloading scenarios)
    if (error.code === 'app/duplicate-app' || (admin.apps.length > 0 && !adminApp) ) {
      console.warn('Firebase Admin SDK already initialized (duplicate app error or apps list not empty). Returning existing default app.');
      adminApp = admin.app(); // Get the already initialized default app
      return adminApp;
    }
    // Log other initialization errors
    console.error('Firebase Admin SDK critical initialization error during initializeApp:', error);
    throw error; // Re-throw if it's a critical error preventing app function
  }
}
