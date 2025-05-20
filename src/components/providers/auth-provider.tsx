"use client";

import type { User as FirebaseUser, IdTokenResult } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase/config";
import type { DocumentData } from "firebase/firestore";

export interface User extends FirebaseUser {
  customData?: DocumentData; // For any custom user data from Firestore
  googleAccessToken?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin?: boolean; // Example for role-based access
  getGoogleAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // const [isAdmin, setIsAdmin] = useState<boolean>(false); // Example

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Optionally fetch custom user data from Firestore here
        // and combine it with firebaseUser
        // For example:
        // const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        // const customData = userDoc.exists() ? userDoc.data() : {};

        // Attempt to get Google Access Token (Firebase SDK might not expose it directly after initial sign-in)
        // We will primarily rely on storing it in Firestore after initial OAuth.
        setUser(firebaseUser as User);

        // Example: Check for admin custom claim
        // const idTokenResult = await firebaseUser.getIdTokenResult();
        // setIsAdmin(!!idTokenResult.claims.admin);
      } else {
        setUser(null);
        // setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getGoogleAccessToken = async (): Promise<string | null> => {
    if (!user) return null;
    // This is a placeholder. The actual token should be retrieved from Firestore
    // where it's stored after the initial OAuth flow.
    // Firebase's currentUser.getIdToken() gives a Firebase ID token, not the Google API access token.
    // We will manage the Google API access token separately.
    try {
      const response = await fetch('/api/user/tokens');
      if (response.ok) {
        const { accessToken } = await response.json();
        return accessToken;
      }
      // Potentially trigger re-auth or refresh flow if token is expired/missing
      console.warn("Could not retrieve Google Access Token from backend.");
      return null;
    } catch (error) {
      console.error("Error fetching Google Access Token:", error);
      return null;
    }
  };


  return (
    <AuthContext.Provider value={{ user, loading, getGoogleAccessToken }}>
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
