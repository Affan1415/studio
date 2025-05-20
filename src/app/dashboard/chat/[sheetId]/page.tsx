"use client";

import { ChatWidget } from "@/components/ChatWidget";
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icons } from "@/components/icons";

export default function DashboardChatPage() {
  const params = useParams();
  const sheetId = typeof params.sheetId === 'string' ? params.sheetId : null;

  if (!sheetId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid Sheet</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Icons.alertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>No sheet ID provided or invalid sheet ID.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
       <ChatWidget sheetId={sheetId} />
    </div>
  );
}
