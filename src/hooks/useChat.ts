
"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
// import type { ChatMessage as FirestoreChatMessage } from "@/lib/firebase/firestore";
// import { Timestamp } from "firebase/firestore";

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  isLoading?: boolean;
}

export function useChat(spreadsheetId: string | null) {
  const { user, googleAccessToken } = useAuth(); 
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMessage = (text: string, sender: "user" | "bot", isLoading?: boolean) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { id: Date.now().toString(), text, sender, timestamp: new Date(), isLoading },
    ]);
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!user || !spreadsheetId) {
        setError(user ? "Spreadsheet not selected." : "You must be signed in to chat.");
        return;
      }
      setIsLoading(true);
      setError(null);
      const userMessageId = Date.now().toString();
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: userMessageId, text, sender: "user", timestamp: new Date() },
      ]);
      
      const loadingBotMessageId = (Date.now() + 1).toString();
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: loadingBotMessageId, text: "...", sender: "bot", timestamp: new Date(), isLoading: true },
      ]);

      try {
        const firebaseIdToken = await user.getIdToken();
        const requestBody: any = { 
            question: text, 
            spreadsheetId, 
            useWritebackFlow: true 
        };

        // Include Google Access Token if available and writeback is intended
        if (googleAccessToken && requestBody.useWritebackFlow) {
            requestBody.googleAccessToken = googleAccessToken;
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${firebaseIdToken}`,
          },
          body: JSON.stringify(requestBody),
        });

        setMessages(prev => prev.filter(msg => msg.id !== loadingBotMessageId));

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to get response from chat API");
        }

        const data = await response.json();
        addMessage(data.response, "bot");

      } catch (err: any) {
        console.error("Chat error:", err);
        setError(err.message || "An unexpected error occurred.");
        setMessages(prev => prev.filter(msg => msg.id !== loadingBotMessageId));
        addMessage(err.message || "Sorry, I couldn't process that.", "bot");
      } finally {
        setIsLoading(false);
      }
    },
    [user, spreadsheetId, googleAccessToken] 
  );
  
  // Placeholder, initial messages could be loaded from Firestore or set to a default
  useEffect(() => {
    if (spreadsheetId && user) {
        setMessages([{ id: 'initial-bot-msg', text: `Ready to chat about sheet: ${spreadsheetId.substring(0,10)}... Ask me anything!`, sender: 'bot', timestamp: new Date() }]);
    } else if (!user && !spreadsheetId) {
         setMessages([{ id: 'initial-bot-msg-no-sheet', text: `Please sign in and connect a sheet to start chatting.`, sender: 'bot', timestamp: new Date() }]);
    } else if (user && !spreadsheetId) {
        setMessages([{ id: 'initial-bot-msg-no-sheet', text: `Please connect a sheet from the dashboard to start chatting.`, sender: 'bot', timestamp: new Date() }]);
    }
  }, [spreadsheetId, user, setMessages]);


  return { messages, isLoading, error, sendMessage, setMessages };
}
