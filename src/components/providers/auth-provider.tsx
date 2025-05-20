// src/components/providers/auth-provider.tsx
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface User extends FirebaseUser {}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  googleAccessToken: string | null; // Still here for potential Google Sign-In later
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
        // Google access token is typically set after a successful Google sign-in.
        // If user authenticated with email/password, this remains null unless explicitly set elsewhere.
      } else {
        setUser(null);
        setGoogleAccessToken(null); // Clear Google access token on sign out
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
