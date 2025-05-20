
"use client";

import Link from "next/link";
// import { AuthButton } from "@/components/AuthButton"; // AuthButton removed
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icons } from "@/components/icons";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function HomePage() {
  const { user, loading } = useAuth(); // user will be the mock user, loading will be false

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <Icons.sheet className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">SheetChat</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Unlock insights from your Google Sheets with AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <p className="text-center text-foreground/80 px-4">
            Connect your Google Sheets and start conversing with your data like never before. 
            Ask questions, get summaries, and (potentially) update cells through chat.
          </p>
          {loading ? ( // This will likely not be true anymore
            <div className="flex flex-col items-center justify-center h-24">
              <LoadingSpinner size={32}/>
            </div>
          ) : ( // Auth is removed, so always show dashboard button
            <div className="flex flex-col items-center space-y-4 w-full px-6">
              {user && <p className="text-sm text-foreground">Welcome, {user.displayName || user.email}!</p>}
              <Link href="/dashboard" legacyBehavior passHref>
                <Button className="w-full" size="lg">Go to Dashboard</Button>
              </Link>
              {/* AuthButton removed from here. If sign-in is re-added, it would go here. */}
            </div>
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
