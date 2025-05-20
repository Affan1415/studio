"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import type { ChatMessage as FirestoreChatMessage } from "@/lib/firebase/firestore"; // Use a distinct type if needed
import { Timestamp } from "firebase/firestore";

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  isLoading?: boolean;
}

export function useChat(spreadsheetId: string | null) {
  const { user, getGoogleAccessToken } = useAuth();
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
        setError("User not authenticated or spreadsheet not selected.");
        return;
      }
      setIsLoading(true);
      setError(null);
      const userMessageId = Date.now().toString();
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: userMessageId, text, sender: "user", timestamp: new Date() },
      ]);
      
      // Add a temporary loading message for the bot
      const loadingBotMessageId = (Date.now() + 1).toString();
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: loadingBotMessageId, text: "...", sender: "bot", timestamp: new Date(), isLoading: true },
      ]);

      try {
        const firebaseIdToken = await user.getIdToken();
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${firebaseIdToken}`,
          },
          body: JSON.stringify({ question: text, spreadsheetId, useWritebackFlow: true }), // Example: enable writeback flow
        });

        // Remove the loading bot message
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
        // Remove loading message and add error message if needed
        setMessages(prev => prev.filter(msg => msg.id !== loadingBotMessageId));
        addMessage(err.message || "Sorry, I couldn't process that.", "bot");
      } finally {
        setIsLoading(false);
      }
    },
    [user, spreadsheetId, getGoogleAccessToken]
  );
  
  const loadInitialMessages = useCallback(async () => {
    if (!user || !spreadsheetId) return;
    // TODO: Implement fetching historical messages if needed
    // For now, we start with a clean slate or a welcome message
    // Example:
    // setMessages([{ id: 'initial-bot', text: `Hello! I'm ready to chat about sheet ${spreadsheetId}.`, sender: 'bot', timestamp: new Date() }]);
  }, [user, spreadsheetId]);


  return { messages, isLoading, error, sendMessage, loadInitialMessages, setMessages };
}
