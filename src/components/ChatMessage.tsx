import type { ChatMessage as ChatMessageType } from "@/hooks/useChat";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "./icons";
import ReactMarkdown from 'react-markdown'; // For rendering markdown if AI responses include it
import { Card, CardContent } from "./ui/card";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === "user";

  return (
    <div
      className={cn(
        "flex items-start space-x-3 py-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8">
          {/* Placeholder for bot avatar image */}
          {/* <AvatarImage src="/bot-avatar.png" alt="Bot" /> */}
          <AvatarFallback>
            <Icons.bot className="h-5 w-5 text-primary" />
          </AvatarFallback>
        </Avatar>
      )}
      <Card className={cn(
        "max-w-xs md:max-w-md lg:max-w-lg rounded-xl shadow-md",
        isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
      )}>
        <CardContent className="p-3">
          {message.isLoading ? (
            <div className="flex items-center space-x-2">
              <Icons.loader className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert break-words">
              <ReactMarkdown
                components={{
                  // Customize rendering of p tags if needed, ReactMarkdown adds them by default
                  p: ({node, ...props}) => <p className="mb-0 last:mb-0" {...props} />
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          )}
        </CardContent>
      </Card>
      {isUser && (
        <Avatar className="h-8 w-8">
          {/* Placeholder for user avatar image, if available from auth */}
          {/* <AvatarImage src={user?.photoURL} alt="User" /> */}
          <AvatarFallback>
            <Icons.user className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
