
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { signOut } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const { user, setGoogleAccessToken } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    setGoogleAccessToken(null);
    router.push("/");
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account preferences and settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {user && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium">User Information</h3>
              <p className="text-sm text-muted-foreground"><strong>Email:</strong> {user.email}</p>
              <p className="text-sm text-muted-foreground"><strong>Display Name:</strong> {user.displayName || "Not set"}</p>
              <p className="text-sm text-muted-foreground"><strong>User ID:</strong> {user.uid}</p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Theme Preference</h3>
             <div className="flex items-center space-x-2">
                <Label htmlFor="theme-toggle-button">Toggle Light/Dark Mode</Label>
                <ThemeToggle />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Language (Coming Soon)</h3>
            <p className="text-sm text-muted-foreground">Language selection will be available in a future update.</p>
            <Button variant="outline" disabled>Select Language</Button>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-lg font-medium">Danger Zone</h3>
             <Button variant="destructive" onClick={handleSignOut}>
                <Icons.logOut className="mr-2 h-4 w-4" /> Sign Out
             </Button>
             <p className="text-xs text-muted-foreground mt-1">This will sign you out of your current session.</p>
          </div>

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About SheetChat</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            SheetChat version 0.1.0.
            <br />
            Powered by Next.js, Firebase, Tailwind CSS, and Google AI.
          </p>
          <p className="text-sm mt-2">
             <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                <Icons.github className="mr-2 h-4 w-4"/> View on GitHub (Placeholder)
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
