"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase/config";
import type { DocumentData } from "firebase/firestore";

export interface User extends FirebaseUser {
  customData?: DocumentData; // For any custom user data from Firestore
  // googleAccessToken field removed as Google Auth is removed
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin?: boolean; // Example for role-based access
  // getGoogleAccessToken method removed
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

  // getGoogleAccessToken method removed as Google Sign-In is no longer used.
  // If other OAuth providers are added in the future, similar token management might be needed.

  return (
    <AuthContext.Provider value={{ user, loading }}>
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
