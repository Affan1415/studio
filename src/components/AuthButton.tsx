
"use client";

import React from 'react';
import { LogIn, LogOut, UserCircle } from "lucide-react";
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
import { Icons } from './icons';
import { useToast } from '@/hooks/use-toast';

export function AuthButton() {
  const { user, loading, setGoogleAccessToken } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignInWithGoogle = async () => {
    const result = await signInWithGoogle();
    if (result && result.user) {
      setGoogleAccessToken(result.accessToken); // Store the access token
      toast({
        title: "Signed In",
        description: `Welcome, ${result.user.displayName || result.user.email}!`,
      });
      router.push("/dashboard");
    } else {
      // signInWithGoogle already logs detailed errors to console
      toast({
        title: "Google Sign-In Failed",
        description: "The Google Sign-In process was cancelled or failed. Please ensure pop-ups are enabled and try again. Check console for more details.",
        variant: "destructive",
      });
      console.error("Google Sign-In failed or was cancelled.");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setGoogleAccessToken(null); // Clear the access token
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
      <Button variant="outline" onClick={handleSignInWithGoogle}>
        <LogIn className="mr-2 h-4 w-4" /> Sign In with Google
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User"} />
            <AvatarFallback>
              {user.displayName ? user.displayName[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : <UserCircle />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName || user.email}</p>
            {user.displayName && <p className="text-xs leading-none text-muted-foreground">{user.email}</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
          <Icons.settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
