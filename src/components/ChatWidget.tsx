"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { ChatMessage } from "./ChatMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icons } from "./icons";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useAuth } from "./providers/auth-provider";
import { AuthButton } from "./AuthButton";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface ChatWidgetProps {
  sheetId: string | null; // Passed from embed or dashboard
  initialMessages?: any[]; // For pre-populating messages
  showAuthInWidget?: boolean; // To show login button inside widget if not authenticated
}

export function ChatWidget({ sheetId, initialMessages, showAuthInWidget = false }: ChatWidgetProps) {
  const { user, loading: authLoading } = useAuth();
  const { messages, isLoading, error, sendMessage, setMessages } = useChat(sheetId);
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMessages) {
      // Process initial messages if needed
      // setMessages(initialMessages.map(msg => ({...msg, timestamp: new Date(msg.timestamp)})))
    } else if(sheetId) {
       setMessages([{ id: 'initial-bot-msg', text: `Ready to chat about sheet: ${sheetId.substring(0,10)}... Ask me anything!`, sender: 'bot', timestamp: new Date() }]);
    } else {
       setMessages([{ id: 'initial-bot-msg-no-sheet', text: `Please connect a sheet to start chatting.`, sender: 'bot', timestamp: new Date() }]);
    }
  }, [sheetId, initialMessages, setMessages]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      // A slight delay to ensure the DOM has updated with the new message
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [messages]);
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading && sheetId) {
      sendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  if (authLoading) {
    return (
      <Card className="w-full max-w-md mx-auto h-[500px] flex items-center justify-center">
        <Icons.loader className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  if (showAuthInWidget && !user) {
    return (
      <Card className="w-full max-w-md mx-auto h-[500px] flex flex-col items-center justify-center p-6">
        <Icons.messageSquare className="h-12 w-12 text-primary mb-4" />
        <CardTitle className="mb-2 text-xl">Chat with SheetChat</CardTitle>
        <CardDescription className="mb-4 text-center">Please sign in to connect your Google Sheets and start chatting with your data.</CardDescription>
        <AuthButton />
      </Card>
    );
  }
  
  if (!sheetId && user) {
     return (
      <Card className="w-full max-w-md mx-auto h-[500px] flex flex-col items-center justify-center p-6">
        <Icons.alertTriangle className="h-12 w-12 text-destructive mb-4" />
        <CardTitle className="mb-2 text-xl">No Sheet Connected</CardTitle>
        <CardDescription className="mb-4 text-center">
          Please connect a Google Sheet from your <a href="/dashboard/sheets" className="underline text-primary hover:text-primary/80">dashboard</a> to start chatting.
        </CardDescription>
      </Card>
    );
  }


  return (
    <Card className="w-full max-w-md mx-auto flex flex-col h-[500px] shadow-2xl rounded-lg overflow-hidden">
      <CardHeader className="bg-primary text-primary-foreground p-4">
        <CardTitle className="text-lg flex items-center">
          <Icons.messageSquare className="h-6 w-6 mr-2" />
          SheetChat
          {sheetId && <span className="text-xs ml-2 opacity-80">(Sheet: ...{sheetId.slice(-8)})</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {error && (
            <Alert variant="destructive" className="my-2">
              <Icons.alertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder={sheetId ? "Ask about your sheet..." : "Connect a sheet first..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading || !sheetId || !user}
            className="flex-grow"
            aria-label="Chat message input"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim() || !sheetId || !user} size="icon">
            {isLoading ? (
              <Icons.loader className="h-4 w-4 animate-spin" />
            ) : (
              <Icons.send className="h-4 w-4" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
