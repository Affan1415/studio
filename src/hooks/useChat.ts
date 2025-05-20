
"use client";

import { useState, useCallback } from "react";
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
  // user will be the mock user from AuthProvider. getGoogleAccessToken was removed.
  const { user } = useAuth(); 
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
      if (!user || !spreadsheetId) { // user will be the mock user
        setError("User (mocked) not available or spreadsheet not selected.");
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
        // const firebaseIdToken = await user.getIdToken(); // getIdToken may not exist on mock user or is irrelevant
        // The API call will now proceed without an IdToken.
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${firebaseIdToken}`, // Auth header removed
          },
          body: JSON.stringify({ question: text, spreadsheetId, useWritebackFlow: true }),
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
    [user, spreadsheetId] // getGoogleAccessToken removed from dependencies
  );
  
  const loadInitialMessages = useCallback(async () => {
    if (!user || !spreadsheetId) return; // user is mock user
    // For now, we start with a clean slate or a welcome message
    // setMessages([{ id: 'initial-bot', text: `Hello! I'm ready to chat about sheet ${spreadsheetId}. (Auth Disabled)`, sender: 'bot', timestamp: new Date() }]);
  }, [user, spreadsheetId]);


  return { messages, isLoading, error, sendMessage, loadInitialMessages, setMessages };
}
