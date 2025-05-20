
"use client";

import React from 'react';
import { LogOut, UserCircle, Chrome } from "lucide-react"; // Added Chrome for Google icon
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { signInWithGoogle, signOut } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icons } from './icons'; // For loading spinner
import { useToast } from '@/hooks/use-toast';

export function AuthButton() {
  const { user, loading, setGoogleAccessToken, googleAccessToken } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignInWithGoogle = async () => {
    const result = await signInWithGoogle();
    if (result && result.user) {
      setGoogleAccessToken(result.accessToken);
      toast({
        title: "Signed In",
        description: `Welcome, ${result.user.displayName || result.user.email}!`,
      });
      console.log("Google Sign-In successful, Access Token:", result.accessToken ? "obtained" : "not obtained");
      router.push("/dashboard"); // Navigate to dashboard on successful login
    } else {
      // Handle sign-in failure (e.g., display a toast message)
      console.error("Google Sign-In failed or was cancelled.");
      toast({
        title: "Sign-In Failed",
        description: "Could not sign in with Google. The popup may have been closed or an error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setGoogleAccessToken(null); // Clear access token from context
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    router.push("/");
  };

  if (loading) {
    return <Button variant="outline" disabled><Icons.loader className="mr-2 h-4 w-4 animate-spin" />Loading...</Button>;
  }

  if (!user) {
    return (
      <Button onClick={handleSignInWithGoogle} variant="outline">
        <Chrome className="mr-2 h-4 w-4" /> Sign in with Google
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
            <AvatarFallback>
              {user.displayName ? user.displayName[0].toUpperCase() : <UserCircle />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
          <Icons.settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        {googleAccessToken && (
          <DropdownMenuItem disabled>
            <span className="text-xs text-muted-foreground truncate" title={googleAccessToken}>Access Token: obtained</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
