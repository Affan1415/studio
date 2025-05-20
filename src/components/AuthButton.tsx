
"use client";

import React from 'react'; // useState removed
// import { LogOut, UserCircle } from "lucide-react"; // Icons for auth states removed
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
// import { signOut } from "@/lib/firebase/auth"; // SignOut is now a no-op
// import { useRouter } from "next/navigation";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { EmailPasswordAuthForm } from './EmailPasswordAuthForm'; // Form removed

export function AuthButton() {
  const { user, loading } = useAuth(); // user is mock, loading is false
  // const router = useRouter();
  // const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false); // Dialog logic removed

  // const handleSignOut = async () => { // Sign out logic removed
  //   await signOut();
  //   router.push("/"); 
  // };

  if (loading) { // This case should not be hit with auth removed
    return <Button variant="outline" disabled>Loading...</Button>;
  }

  // Since authentication is removed, this button doesn't need to do much.
  // It could be removed entirely from layouts, or display some generic info.
  // For now, let's make it render nothing to avoid clutter if it's still in a layout.
  if (!user) { // This case should also not be hit if user is always mocked
     console.warn("AuthButton: No user found, this shouldn't happen with mocked auth.");
     return null;
  }

  // If a mock user exists, we could display something minimal or nothing.
  // Example: Display mock user's name if needed for debugging, otherwise null.
  // return <span className="text-sm text-muted-foreground">User: {user.displayName} (Mocked)</span>;

  // Returning null as its primary purpose (login/logout) is gone.
  // If it's still used in layouts, it won't render anything visible.
  return null;
}
