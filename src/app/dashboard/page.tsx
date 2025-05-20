"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { useAuth } from "@/components/providers/auth-provider";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.displayName || "User"}!</h1>
      <p className="text-muted-foreground">
        Here's an overview of your SheetChat activity. Manage your connected sheets, customize prompts, and review conversations.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Connected Sheets</CardTitle>
            <Icons.sheet className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Manage your Google Sheets connections. Add new sheets or modify existing ones.
            </CardDescription>
            <Link href="/dashboard/sheets" passHref legacyBehavior>
              <Button className="w-full">Manage Sheets</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Prompt Templates</CardTitle>
            <Icons.edit3 className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Customize the AI's behavior by editing prompt templates for your sheets.
            </CardDescription>
            <Link href="/dashboard/prompts" passHref legacyBehavior>
              <Button className="w-full">Edit Prompts</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Chat Activity</CardTitle>
            <Icons.fileText className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Review recent conversations and interactions with your sheets.
            </CardDescription>
            <Link href="/dashboard/activity" passHref legacyBehavior>
              <Button className="w-full">View Activity</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Embed Chat Widget</CardTitle>
          <Icons.wand className="h-6 w-6 text-primary float-right" />
        </CardHeader>
        <CardContent>
          <CardDescription>
            Easily embed the SheetChat widget on any website. You'll need to connect a sheet first.
            Once a sheet is connected, you can get an embed snippet from the "Connected Sheets" page.
          </CardDescription>
          <div className="mt-4 p-3 bg-muted rounded-md">
            <code className="text-sm text-muted-foreground">
              &lt;script src="https://your-app-domain.com/embed.js" data-sheet-url="YOUR_GOOGLE_SHEET_URL"&gt;&lt;/script&gt;
            </code>
          </div>
          <p className="text-xs mt-2 text-muted-foreground">
            Replace `your-app-domain.com` with your actual application domain and `YOUR_GOOGLE_SHEET_URL` with the URL of a sheet you've connected.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
