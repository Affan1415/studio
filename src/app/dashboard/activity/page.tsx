"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import type { ChatMessage as FirestoreChatMessage } from '@/lib/firebase/firestore';
import { getRecentChatActivity } from '@/lib/firebase/firestore';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function ChatActivityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activity, setActivity] = useState<FirestoreChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const recentActivity = await getRecentChatActivity(user.uid, 20); // Fetch last 20 messages
      setActivity(recentActivity);
    } catch (error) {
      console.error("Error fetching chat activity:", error);
      toast({ title: "Error", description: "Could not fetch chat activity.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Recent Chat Activity</CardTitle>
          <CardDescription>View the latest interactions across your connected sheets.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <LoadingSpinner />
            </div>
          ) : activity.length === 0 ? (
            <p className="text-muted-foreground">No chat activity found yet.</p>
          ) : (
            <ScrollArea className="h-[500px] border rounded-md p-2">
              <div className="space-y-4">
                {activity.map((msg) => (
                  <Card key={msg.id} className={`p-3 ${msg.sender === 'user' ? 'bg-secondary/30' : 'bg-muted/30'}`}>
                    <div className="flex items-start space-x-3">
                      <div>
                        {msg.sender === 'user' ? <Icons.user className="h-5 w-5 mt-0.5" /> : <Icons.bot className="h-5 w-5 mt-0.5 text-primary" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                          <span>
                            {msg.sender === 'user' ? 'You' : 'SheetChat Bot'}
                            {/* @ts-ignore */}
                            {msg.sheetId && (
                              <Link href={`/dashboard/chat/${msg.sheetId}`} className="ml-1 hover:underline" title="Go to chat">
                                (Sheet: ...{/* @ts-ignore */}
                                {msg.sheetId.slice(-6)})
                              </Link>
                            )}
                          </span>
                          <span>{msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleString() : 'N/A'}</span>
                        </div>
                        <p className="text-sm">{msg.text}</p>
                        {msg.updateApplied && (
                           <Badge variant="outline" className="mt-1 text-xs">
                             Applied update: {msg.updateApplied.range} = "{msg.updateApplied.value}"
                           </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
