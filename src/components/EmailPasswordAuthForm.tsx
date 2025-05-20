
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Icons } from '@/components/icons';
import { signInWithEmail, signUpWithEmail } from '@/lib/firebase/auth';
import { useToast } from '@/hooks/use-toast';

const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const signUpSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ['confirmPassword'], // Point error to confirmPassword field
});

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;

interface EmailPasswordAuthFormProps {
  onSuccess?: () => void; // Callback for successful auth
}

export function EmailPasswordAuthForm({ onSuccess }: EmailPasswordAuthFormProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const handleSignIn = async (values: SignInFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmail(values.email, values.password);
      toast({ title: 'Signed In', description: 'Welcome back!' });
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (values: SignUpFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await signUpWithEmail(values.email, values.password);
      toast({ title: 'Account Created', description: 'You have successfully signed up!' });
      onSuccess?.();
    } catch (err: any)
    {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use. Please try signing in or use a different email.');
      } else {
        setError(err.message || 'Failed to sign up. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      <TabsContent value="signin">
        <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4 mt-4">
          <div className="space-y-1">
            <Label htmlFor="signin-email">Email</Label>
            <Input id="signin-email" type="email" {...signInForm.register('email')} placeholder="you@example.com" />
            {signInForm.formState.errors.email && (
              <p className="text-xs text-destructive">{signInForm.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="signin-password">Password</Label>
            <Input id="signin-password" type="password" {...signInForm.register('password')} placeholder="••••••••" />
            {signInForm.formState.errors.password && (
              <p className="text-xs text-destructive">{signInForm.formState.errors.password.message}</p>
            )}
          </div>
          {error && activeTab === 'signin' && (
            <Alert variant="destructive" className="text-xs">
              <Icons.alertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <Icons.loader className="animate-spin" /> : 'Sign In'}
          </Button>
        </form>
      </TabsContent>
      <TabsContent value="signup">
        <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4 mt-4">
          <div className="space-y-1">
            <Label htmlFor="signup-email">Email</Label>
            <Input id="signup-email" type="email" {...signUpForm.register('email')} placeholder="you@example.com" />
            {signUpForm.formState.errors.email && (
              <p className="text-xs text-destructive">{signUpForm.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="signup-password">Password</Label>
            <Input id="signup-password" type="password" {...signUpForm.register('password')} placeholder="••••••••" />
            {signUpForm.formState.errors.password && (
              <p className="text-xs text-destructive">{signUpForm.formState.errors.password.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="signup-confirmPassword">Confirm Password</Label>
            <Input id="signup-confirmPassword" type="password" {...signUpForm.register('confirmPassword')} placeholder="••••••••" />
            {signUpForm.formState.errors.confirmPassword && (
              <p className="text-xs text-destructive">{signUpForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>
           {error && activeTab === 'signup' && (
            <Alert variant="destructive" className="text-xs">
              <Icons.alertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <Icons.loader className="animate-spin" /> : 'Sign Up'}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
