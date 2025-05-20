"use client";

import { Suspense } from 'react';
import { useSearchParams } from "next/navigation";
import { ChatWidget } from "@/components/ChatWidget";
import { extractSheetIdFromUrl } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from '@/components/icons';
import { LoadingSpinner } from '@/components/LoadingSpinner';

function ChatEmbedContent() {
  const searchParams = useSearchParams();
  const sheetUrl = searchParams.get("sheetUrl");
  const sheetId = sheetUrl ? extractSheetIdFromUrl(sheetUrl) : null;

  if (!sheetUrl) {
    return (
      <Card className="w-full h-full flex flex-col items-center justify-center text-center p-4">
        <Icons.alertTriangle className="h-10 w-10 text-destructive mb-3" />
        <CardTitle className="text-lg">Configuration Error</CardTitle>
        <CardDescription>Sheet URL not provided for the chat widget.</CardDescription>
      </Card>
    );
  }

  if (!sheetId) {
     return (
      <Card className="w-full h-full flex flex-col items-center justify-center text-center p-4">
        <Icons.alertTriangle className="h-10 w-10 text-destructive mb-3" />
        <CardTitle className="text-lg">Invalid Sheet URL</CardTitle>
        <CardDescription>The provided Google Sheet URL is invalid.</CardDescription>
      </Card>
    );
  }
  
  // The AuthProvider is in RootLayout, so user state should be available here.
  // ChatWidget has internal handling for auth state.
  return <ChatWidget sheetId={sheetId} showAuthInWidget={true} />;
}


export default function ChatEmbedPage() {
  return (
    // Apply minimal styling for the embed page itself
    <div className="w-screen h-screen bg-transparent flex items-center justify-center">
      <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><LoadingSpinner size={40}/></div>}>
        <ChatEmbedContent />
      </Suspense>
    </div>
  );
}

// This page should have a minimal layout, or no layout if it's purely for iframe content.
// For simplicity, it will inherit the RootLayout which includes ThemeProvider and AuthProvider.
// If a completely clean page is needed, a different layout structure for /embed routes would be required.
