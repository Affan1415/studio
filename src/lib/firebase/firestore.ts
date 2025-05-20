import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  deleteDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "./config";

// Sheet Management
export interface SheetConfig {
  id: string; // spreadsheetId
  name: string;
  url: string;
  userId: string;
  addedAt: Timestamp;
  customPrompt?: string;
}

export const connectSheet = async (userId: string, sheetId: string, sheetName: string, sheetUrl: string): Promise<void> => {
  const sheetRef = doc(db, "users", userId, "sheets", sheetId);
  await setDoc(sheetRef, {
    name: sheetName,
    url: sheetUrl,
    userId: userId,
    addedAt: serverTimestamp(),
  });
};

export const disconnectSheet = async (userId: string, sheetId: string): Promise<void> => {
  const sheetRef = doc(db, "users", userId, "sheets", sheetId);
  await deleteDoc(sheetRef);
  // Optionally, also delete related cache if it's user-specific or no longer needed by others
  // const cacheRef = doc(db, "sheetCache", sheetId);
  // await deleteDoc(cacheRef);
};

export const getUserSheets = async (userId: string): Promise<SheetConfig[]> => {
  const sheetsColRef = collection(db, "users", userId, "sheets");
  const q = query(sheetsColRef, orderBy("addedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as SheetConfig));
};

export const updateSheetPrompt = async (userId: string, sheetId: string, prompt: string): Promise<void> => {
  const sheetRef = doc(db, "users", userId, "sheets", sheetId);
  await updateDoc(sheetRef, { customPrompt: prompt });
};


// Sheet Data Cache
interface SheetCache {
  data: string; // JSON stringified array of arrays
  lastFetched: Timestamp;
  fetchedByUid: string; // To know who initiated the last fetch
}

export const getCachedSheetData = async (sheetId: string): Promise<SheetCache | null> => {
  const cacheRef = doc(db, "sheetCache", sheetId);
  const docSnap = await getDoc(cacheRef);
  if (docSnap.exists()) {
    return docSnap.data() as SheetCache;
  }
  return null;
};

export const setCachedSheetData = async (sheetId: string, data: any[][], fetchedByUid: string): Promise<void> => {
  const cacheRef = doc(db, "sheetCache", sheetId);
  await setDoc(cacheRef, {
    data: JSON.stringify(data),
    lastFetched: serverTimestamp(),
    fetchedByUid,
  });
};


// Chat Logs
export interface ChatMessage {
  id?: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Timestamp;
  updateApplied?: { range: string; value: string };
}

export interface ChatSession {
  id?: string;
  userId: string;
  sheetId: string;
  startTime: Timestamp;
  lastMessageTime?: Timestamp;
  messages: ChatMessage[]; // Storing messages as a sub-array here for simplicity for "recent chats"
                           // For very long chats, a subcollection is better.
}

// Example: Add a message to a chat session.
// A more robust system would use subcollections for messages if sessions can be very long.
export const addChatMessage = async (
  userId: string,
  sheetId: string,
  message: Omit<ChatMessage, "timestamp" | "id">
): Promise<void> => {
  // This is a simplified chat log for activity view.
  // We'll create a new log entry per message for simplicity in querying recent activity.
  const chatLogRef = collection(db, "chatLogs");
  await addDoc(chatLogRef, {
    userId,
    sheetId,
    ...message,
    timestamp: serverTimestamp(),
  });
};

export const getRecentChatActivity = async (userId: string, count: number = 10): Promise<ChatMessage[]> => {
  const logsRef = collection(db, "chatLogs");
  const q = query(logsRef, where("userId", "==", userId), orderBy("timestamp", "desc"), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as ChatMessage));
};

// Firestore document types (can be expanded)
export interface UserDocument {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    createdAt: Timestamp;
    // other custom fields
}

export interface UserGoogleOAuthCredentials {
    accessToken: string;
    refreshToken?: string; // Store if available and plan to use server-side refresh
    lastUpdated: Timestamp;
    // expiresAt?: number; // Store if planning client-side expiry checks
}
