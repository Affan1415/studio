"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import type { SheetConfig } from '@/lib/firebase/firestore';
import { getUserSheets, updateSheetPrompt } from '@/lib/firebase/firestore';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const DEFAULT_PROMPT_PLACEHOLDER = `You are an assistant that can answer questions based on the provided Google Sheet data.
Here is the data from the Google Sheet:
{{{sheetData}}}

User question: {{{question}}}

Respond to the user's question. If the answer requires an update to the Google Sheet, provide an "update" payload in the JSON format:
{
  "range": "<cell to update>",
  "value": "<new value>"
}
Otherwise, the update field should be omitted from the JSON output.
Ensure your response is valid JSON.
`;


export default function ManagePromptsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [promptText, setPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSheets, setIsFetchingSheets] = useState(true);
  const [connectedSheets, setConnectedSheets] = useState<SheetConfig[]>([]);

  useEffect(() => {
    const sheetIdFromQuery = searchParams.get('sheetId');
    if (sheetIdFromQuery) {
      setSelectedSheetId(sheetIdFromQuery);
    }
  }, [searchParams]);

  const fetchUserSheets = useCallback(async () => {
    if (!user) return;
    setIsFetchingSheets(true);
    try {
      const sheets = await getUserSheets(user.uid);
      setConnectedSheets(sheets);
      if (sheets.length > 0 && !selectedSheetId) {
        // setSelectedSheetId(sheets[0].id); // Auto-select first sheet if none selected by query
      }
    } catch (error) {
      console.error("Error fetching user sheets:", error);
      toast({ title: "Error", description: "Could not fetch your connected sheets.", variant: "destructive" });
    } finally {
      setIsFetchingSheets(false);
    }
  }, [user, toast, selectedSheetId]);

  useEffect(() => {
    fetchUserSheets();
  }, [fetchUserSheets]);
  
  useEffect(() => {
    if (selectedSheetId) {
      const selectedSheet = connectedSheets.find(s => s.id === selectedSheetId);
      setPromptText(selectedSheet?.customPrompt || DEFAULT_PROMPT_PLACEHOLDER);
    } else {
      setPromptText(DEFAULT_PROMPT_PLACEHOLDER);
    }
  }, [selectedSheetId, connectedSheets]);

  const handleSavePrompt = async () => {
    if (!user || !selectedSheetId) {
      toast({ title: "Error", description: "No sheet selected or user not authenticated.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await updateSheetPrompt(user.uid, selectedSheetId, promptText);
      toast({ title: "Success!", description: "Prompt template updated successfully." });
      // Refresh sheets to get updated prompt
      fetchUserSheets();
    } catch (error: any) {
      console.error("Error updating prompt:", error);
      toast({ title: "Update Failed", description: error.message || "Could not save prompt.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Customize Prompt Templates</CardTitle>
          <CardDescription>
            Edit the AI prompt for specific sheets. Use `{{{sheetData}}}` and `{{{question}}}` as placeholders.
            The default Genkit flows might not use this custom prompt directly without modification. This UI is a starting point.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sheet-select">Select Sheet</Label>
            {isFetchingSheets ? <LoadingSpinner /> : (
              <Select
                value={selectedSheetId || undefined}
                onValueChange={(value) => setSelectedSheetId(value)}
                disabled={connectedSheets.length === 0}
              >
                <SelectTrigger id="sheet-select" className="w-full md:w-[300px]">
                  <SelectValue placeholder="Select a sheet..." />
                </SelectTrigger>
                <SelectContent>
                  {connectedSheets.map(sheet => (
                    <SelectItem key={sheet.id} value={sheet.id}>{sheet.name || sheet.id}</SelectItem>
                  ))}
                  {connectedSheets.length === 0 && <SelectItem value="no-sheets" disabled>No sheets connected</SelectItem>}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {selectedSheetId && (
            <>
              <Label htmlFor="prompt-template">Prompt Template for "{connectedSheets.find(s => s.id === selectedSheetId)?.name}"</Label>
              <Textarea
                id="prompt-template"
                placeholder={DEFAULT_PROMPT_PLACEHOLDER}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                rows={15}
                disabled={isLoading}
                className="font-mono text-sm"
              />
              <div className="flex justify-end">
                <Button onClick={handleSavePrompt} disabled={isLoading || !selectedSheetId}>
                  {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <Icons.settings className="mr-2 h-4 w-4" />}
                  Save Prompt
                </Button>
              </div>
            </>
          )}
          {!selectedSheetId && !isFetchingSheets && connectedSheets.length > 0 && (
            <p className="text-muted-foreground">Please select a sheet to edit its prompt template.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
            <CardTitle className="text-base">Note on Genkit Flows</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                The current Genkit flows (`chatWithSheet` and `writebackToSheet`) use hardcoded prompts.
                To utilize the custom prompts saved here, you would need to modify those Genkit flows to:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                <li>Accept a `customPrompt` string as part of their input.</li>
                <li>Use this `customPrompt` string in the `ai.definePrompt` configuration instead of the hardcoded one.</li>
                <li>The `/api/chat` route would then need to fetch this custom prompt from Firestore for the given `spreadsheetId` and pass it to the Genkit flow.</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
