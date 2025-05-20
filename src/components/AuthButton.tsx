
"use client";

import React, { useState } from 'react';
import { LogOut, UserCircle, Mail } from "lucide-react"; // Using Mail for Email/Pass auth
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/firebase/auth"; // signInWithGoogle removed for now
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Icons } from './icons';
import { useToast } from '@/hooks/use-toast';
import { EmailPasswordAuthForm } from './EmailPasswordAuthForm';

export function AuthButton() {
  const { user, loading, setGoogleAccessToken } = useAuth(); // googleAccessToken kept for potential future use
  const router = useRouter();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);


  // const handleSignInWithGoogle = async () => {
  //   // Logic for Google Sign-In, currently disabled
  //   // const result = await signInWithGoogle();
  //   // if (result && result.user) {
  //   //   setGoogleAccessToken(result.accessToken);
  //   //   toast({
  //   //     title: "Signed In via Google",
  //   //     description: `Welcome, ${result.user.displayName || result.user.email}!`,
  //   //   });
  //   //   router.push("/dashboard");
  //   // } else {
  //   //   toast({
  //   //     title: "Google Sign-In Failed",
  //   //     description: "Could not sign in with Google. The popup may have been closed or an error occurred.",
  //   //     variant: "destructive",
  //   //   });
  //   // }
  // };

  const handleSignOut = async () => {
    await signOut();
    setGoogleAccessToken(null); // Clear any access token
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    router.push("/");
  };

  const handleAuthSuccess = () => {
    setDialogOpen(false); // Close dialog on successful auth from form
  }

  if (loading) {
    return <Button variant="outline" disabled><Icons.loader className="mr-2 h-4 w-4 animate-spin" />Loading...</Button>;
  }

  if (!user) {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" /> Sign In / Sign Up
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Authenticate</DialogTitle>
            <DialogDescription>
              Sign in to your account or create a new one.
            </DialogDescription>
          </DialogHeader>
          <EmailPasswordAuthForm onAuthSuccess={handleAuthSuccess} />
        </DialogContent>
      </Dialog>
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
