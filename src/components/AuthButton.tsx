
"use client";

import React from 'react';
import { LogIn, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { signInWithGoogle, signOut } from "@/lib/firebase/auth"; // Removed signInWithEmail, signUpWithEmail
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
// Dialog components for email/password form - remove if not used
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { EmailPasswordAuthForm } from "./EmailPasswordAuthForm"; // Remove if not used

export function AuthButton() {
  const { user, loading, setGoogleAccessToken } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  // const [isAuthDialogOpen, setIsAuthDialogOpen] = React.useState(false); // Remove if not used

  const handleSignInWithGoogle = async () => {
    const result = await signInWithGoogle();
    if (result && result.user) {
      if (result.accessToken) {
        setGoogleAccessToken(result.accessToken);
      }
      toast({
        title: "Signed In",
        description: `Welcome, ${result.user.displayName || result.user.email}!`,
      });
      router.push("/dashboard");
    } else {
      let errorMessage = "Google Sign-In process was cancelled or failed. Please ensure pop-ups are enabled and try again.";
      if (result && result.error) {
        errorMessage = `Google Sign-In Failed: ${result.error.message} (Code: ${result.error.code || 'N/A'})`;
        console.error("Google Sign-In Error Details:", result.error);
      } else {
        console.error("Google Sign-In failed or was cancelled with no specific error details.");
      }
      toast({
        title: "Google Sign-In Failed",
        description: errorMessage,
        variant: "destructive",
      });
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
    // Reverted to only Google Sign-In button
    return (
      <Button variant="outline" onClick={handleSignInWithGoogle}>
        <Icons.logIn className="mr-2 h-4 w-4" /> Sign In with Google
      </Button>
    );
    // Below is the structure for Dialog-based Email/Password + Google, remove/comment if not needed
    /*
    return (
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <LogIn className="mr-2 h-4 w-4" /> Sign In / Sign Up
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Access Your Account</DialogTitle>
            <DialogDescription>
              Sign in or create an account to continue.
            </DialogDescription>
          </DialogHeader>
          <EmailPasswordAuthForm 
            onGoogleSignIn={async () => {
              setIsAuthDialogOpen(false); // Close dialog before Google popup
              await handleSignInWithGoogle();
            }}
            onAuthSuccess={() => {
              setIsAuthDialogOpen(false); // Close dialog on success
              router.push('/dashboard');
            }}
          />
        </DialogContent>
      </Dialog>
    );
    */
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
