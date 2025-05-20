// src/components/providers/auth-provider.tsx
"use client";

import type { User as FirebaseUser } from "firebase/auth";
// import { onAuthStateChanged } from "firebase/auth"; // No longer needed
// import { auth } from "@/lib/firebase/config"; // No longer needed for onAuthStateChanged
import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState } from "react";
import type { DocumentData } from "firebase/firestore";

export interface User extends Partial<FirebaseUser> { // Making FirebaseUser properties partial
  uid: string; // uid is essential
  customData?: DocumentData;
  // Mock user will need to satisfy this, or make it more flexible
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  // getGoogleAccessToken method removed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define a mock user for the no-authentication setup
const mockUser: User = {
  uid: "mock-user-001",
  email: "user@example.com",
  displayName: "App User",
  photoURL: null,
  // Add any other User properties if your components rely on them, e.g.
  // emailVerified: true,
  // isAnonymous: false,
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // User is now always the mockUser, loading is always false.
  const [user, setUser] = useState<User | null>(mockUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // No actual authentication state to listen to.
    // We just ensure loading is false and user is set to the mock user.
    setUser(mockUser);
    setLoading(false);
  }, []);

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
