"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { extractSheetIdFromUrl } from '@/lib/utils';
import { Icons } from '@/components/icons';
import type { SheetConfig } from '@/lib/firebase/firestore';
import { disconnectSheet, getUserSheets } from '@/lib/firebase/firestore'; // Assuming these functions exist
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from 'next/link';

export default function ManageSheetsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sheetUrl, setSheetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSheets, setIsFetchingSheets] = useState(true);
  const [connectedSheets, setConnectedSheets] = useState<SheetConfig[]>([]);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    // Ensure baseUrl is only set on the client-side
    setBaseUrl(window.location.origin);
  }, []);

  const fetchUserSheets = useCallback(async () => {
    if (!user) return;
    setIsFetchingSheets(true);
    try {
      const sheets = await getUserSheets(user.uid);
      setConnectedSheets(sheets);
    } catch (error) {
      console.error("Error fetching user sheets:", error);
      toast({ title: "Error", description: "Could not fetch your connected sheets.", variant: "destructive" });
    } finally {
      setIsFetchingSheets(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchUserSheets();
  }, [fetchUserSheets]);

  const handleConnectSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to connect a sheet.", variant: "destructive" });
      return;
    }
    if (!sheetUrl.trim()) {
      toast({ title: "Input Error", description: "Please enter a Google Sheet URL.", variant: "destructive" });
      return;
    }

    const spreadsheetId = extractSheetIdFromUrl(sheetUrl);
    if (!spreadsheetId) {
      toast({ title: "Invalid URL", description: "The URL provided is not a valid Google Sheet URL.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/sheets/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ sheetUrl }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to connect sheet.');
      }

      toast({ title: "Success!", description: `Sheet "${result.sheetName || spreadsheetId}" connected successfully.` });
      setSheetUrl('');
      fetchUserSheets(); // Refresh the list
    } catch (error: any) {
      console.error("Error connecting sheet:", error);
      toast({ title: "Connection Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectSheet = async (sheetIdToDisconnect: string) => {
    if (!user) return;
    try {
      await disconnectSheet(user.uid, sheetIdToDisconnect);
      toast({ title: "Sheet Disconnected", description: "The sheet has been disconnected." });
      fetchUserSheets(); // Refresh list
    } catch (error) {
      console.error("Error disconnecting sheet:", error);
      toast({ title: "Error", description: "Could not disconnect the sheet.", variant: "destructive" });
    }
  };
  
  const getEmbedSnippet = (sheetUrlForEmbed: string) => {
    if(!baseUrl) return "Loading embed snippet...";
    return `<script src="${baseUrl}/embed.js" data-sheet-url="${sheetUrlForEmbed}"></script>`;
  };


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Connect a New Google Sheet</CardTitle>
          <CardDescription>Paste the URL of the Google Sheet you want to connect to SheetChat.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleConnectSheet} className="space-y-4">
            <Input
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              disabled={isLoading}
              aria-label="Google Sheet URL"
            />
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <Icons.link className="mr-2 h-4 w-4" />}
              Connect Sheet
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Connected Sheets</CardTitle>
          <CardDescription>Manage your existing sheet connections or view their embed snippets.</CardDescription>
        </CardHeader>
        <CardContent>
          {isFetchingSheets ? (
            <div className="flex justify-center items-center h-24">
              <LoadingSpinner />
            </div>
          ) : connectedSheets.length === 0 ? (
            <p className="text-muted-foreground">You haven't connected any sheets yet.</p>
          ) : (
            <div className="space-y-4">
              {connectedSheets.map((sheet) => (
                <Card key={sheet.id} className="bg-secondary/50">
                  <CardHeader className="flex flex-row justify-between items-start pb-2">
                    <div>
                      <CardTitle className="text-base hover:underline">
                        <Link href={`/dashboard/chat/${sheet.id}`} title={`Chat with ${sheet.name}`}>
                          {sheet.name || sheet.id}
                        </Link>
                      </CardTitle>
                      <CardDescription className="text-xs truncate max-w-xs" title={sheet.url}>
                        <a href={sheet.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{sheet.url}</a>
                      </CardDescription>
                    </div>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                          <Icons.trash2 className="h-4 w-4" />
                           <span className="sr-only">Disconnect sheet</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will disconnect the sheet "{sheet.name || sheet.id}" from SheetChat. 
                            You can reconnect it later if needed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDisconnectSheet(sheet.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            Disconnect
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardHeader>
                  <CardContent className="text-xs">
                    <p>Added: {sheet.addedAt ? new Date(sheet.addedAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                     <div className="mt-2">
                        <p className="font-medium mb-1">Embed Snippet:</p>
                        <Input 
                            readOnly 
                            value={getEmbedSnippet(sheet.url)} 
                            className="text-xs bg-background"
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                    </div>
                  </CardContent>
                   <CardFooter className="pt-2">
                     <Link href={`/dashboard/prompts?sheetId=${sheet.id}`} legacyBehavior passHref>
                        <Button variant="outline" size="sm">
                            <Icons.edit3 className="mr-2 h-3 w-3" /> Custom Prompt
                        </Button>
                     </Link>
                      <Link href={`/dashboard/chat/${sheet.id}`} legacyBehavior passHref>
                        <Button variant="default" size="sm" className="ml-2">
                            <Icons.messageSquare className="mr-2 h-3 w-3" /> Chat Now
                        </Button>
                     </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
