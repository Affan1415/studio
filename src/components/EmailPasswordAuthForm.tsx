
"use client";

// This component is not actively used when Google Sign-In is the primary authentication method.
// It is kept as a placeholder or for potential future use with email/password auth.

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function EmailPasswordAuthForm() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Email/Password Authentication</CardTitle>
        <CardDescription>
          This form is currently not active. Google Sign-In is the primary authentication method.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          To enable email/password authentication, further development work is needed.
        </p>
      </CardContent>
    </Card>
  );
}
