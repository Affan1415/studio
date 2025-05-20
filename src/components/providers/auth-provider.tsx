// src/components/providers/auth-provider.tsx
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState } from "react";
// import type { DocumentData } from "firebase/firestore"; // Not used directly here anymore

// Keeping User interface flexible for FirebaseUser properties
export interface User extends FirebaseUser {}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  googleAccessToken: string | null;
  setGoogleAccessToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser as User);
        // Note: The Google access token obtained at sign-in is short-lived.
        // If you need it persistently, you'd typically store it (e.g., in context, localStorage for session)
        // or use a refresh token flow for long-term server-side access.
        // For now, `setGoogleAccessToken` will be called by AuthButton after sign-in.
      } else {
        setUser(null);
        setGoogleAccessToken(null); // Clear access token on sign out
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, googleAccessToken, setGoogleAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
