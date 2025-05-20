
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Log the config in development mode for debugging
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    // This will log in the browser console
    console.log("Firebase Config being used by CLIENT:", firebaseConfig);
  } else {
    // This will log in the server terminal
    console.log("Firebase Config being used by SERVER (SSR/API):", firebaseConfig);
  }
}

// Pre-initialization checks
if (!firebaseConfig.apiKey) {
  const message = "Firebase API Key is missing. Make sure NEXT_PUBLIC_FIREBASE_API_KEY is set in your .env file and the server was restarted.";
  if (typeof window === 'undefined') {
    console.error("SERVER ERROR:", message);
  } else {
    console.error("CLIENT ERROR:", message);
  }
  // Potentially throw an error here if you want to halt execution,
  // but logging might be sufficient for diagnosis.
}
if (!firebaseConfig.projectId) {
  const message = "Firebase Project ID is missing. Make sure NEXT_PUBLIC_FIREBASE_PROJECT_ID is set in your .env file and the server was restarted.";
   if (typeof window === 'undefined') {
    console.error("SERVER ERROR:", message);
  } else {
    console.error("CLIENT ERROR:", message);
  }
}


// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  // Check if all essential config values are present before initializing
  if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain) {
    app = initializeApp(firebaseConfig);
  } else {
    const errorMessage = "Firebase configuration is incomplete. Cannot initialize Firebase. Check .env file and server logs.";
    if (typeof window === 'undefined') {
        console.error("SERVER FATAL ERROR:", errorMessage);
    } else {
        console.error("CLIENT FATAL ERROR:", errorMessage);
    }
    // Prevent Firebase from being initialized with incomplete config.
    // This will likely lead to errors downstream, but the console messages should guide debugging.
    // @ts-ignore // Assign a dummy object to app to prevent further errors if code expects app to be defined.
    app = {} as FirebaseApp; 
  }
} else {
  app = getApp();
}

let auth: Auth;
let db: Firestore;

// Only try to get Auth and Firestore if app was properly initialized
// (i.e., if app is not our dummy {} object and has a name, which real Firebase apps do)
if (app && app.name) {
    try {
        auth = getAuth(app);
        db = getFirestore(app);
    } catch (e: any) {
        const initErrorMessage = `Error initializing Firebase services (Auth/Firestore): ${e.message}. This usually means the Firebase app object itself was not correctly initialized due to missing config.`;
        if (typeof window === 'undefined') {
            console.error("SERVER FATAL ERROR:", initErrorMessage, e);
        } else {
            console.error("CLIENT FATAL ERROR:", initErrorMessage, e);
        }
        // @ts-ignore
        auth = {} as Auth;
        // @ts-ignore
        db = {} as Firestore;
    }
} else {
    const noInitMessage = "Firebase app object is not valid (likely due to missing config). Auth and Firestore services will not be initialized.";
    if (typeof window === 'undefined') {
        console.error("SERVER WARNING:", noInitMessage);
    } else {
        console.error("CLIENT WARNING:", noInitMessage);
    }
    // @ts-ignore
    auth = {} as Auth; // Provide dummy objects to satisfy TypeScript and prevent crashes
    // @ts-ignore
    db = {} as Firestore;
}


export { app, auth, db };
