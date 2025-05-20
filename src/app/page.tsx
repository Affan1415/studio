"use client";

import Link from "next/link";
import { AuthButton } from "@/components/AuthButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet } from "lucide-react"; // Using Sheet icon for logo placeholder

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <Sheet className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">SheetChat</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Unlock insights from your Google Sheets with AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <p className="text-center text-foreground/80">
            Connect your Google Sheets and start conversing with your data like never before. 
            Ask questions, get summaries, and even update cells through chat.
          </p>
          {loading ? (
            <Button disabled className="w-full">Loading...</Button>
          ) : user ? (
            <div className="flex flex-col items-center space-y-4 w-full">
              <p className="text-sm text-foreground">Welcome back, {user.displayName || user.email}!</p>
              <Link href="/dashboard" legacyBehavior passHref>
                <Button className="w-full" size="lg">Go to Dashboard</Button>
              </Link>
              <AuthButton />
            </div>
          ) : (
            <AuthButton />
          )}
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} SheetChat. All rights reserved.</p>
        <p className="mt-1">Powered by Next.js, Firebase, and Google AI.</p>
      </footer>
    </div>
  );
}
