
"use client";

import React, { useState } from 'react';
import { LogOut, UserCircle } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/firebase/auth";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmailPasswordAuthForm } from './EmailPasswordAuthForm'; // Import the new form

export function AuthButton() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/"); // Redirect to home page after sign out
  };

  if (loading) {
    return <Button variant="outline" disabled>Loading...</Button>;
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User"} />
              <AvatarFallback>{user.displayName ? user.displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : "U")}</AvatarFallback>
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
          <DropdownMenuItem onClick={() => router.push('/dashboard')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            <span>Dashboard</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // If no user and not loading, show Sign In / Sign Up button triggering a dialog
  return (
    <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserCircle className="mr-2 h-4 w-4" />
          Sign In / Sign Up
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Access Your Account</DialogTitle>
          <DialogDescription>
            Sign in to continue or sign up to create a new account.
          </DialogDescription>
        </DialogHeader>
        <EmailPasswordAuthForm onSuccess={() => setIsAuthDialogOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
