
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmail, signUpWithEmail } from '@/lib/firebase/auth';
import { Icons } from './icons'; // For loader icon
import { useRouter } from 'next/navigation';
import { useAuth } from './providers/auth-provider';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type FormData = z.infer<typeof formSchema>;

interface EmailPasswordAuthFormProps {
  onAuthSuccess?: () => void; // Callback for when auth is successful (e.g., to close a dialog)
}

export function EmailPasswordAuthForm({ onAuthSuccess }: EmailPasswordAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const { toast } = useToast();
  const router = useRouter();
  const { setGoogleAccessToken } = useAuth(); // Though not Google, good to clear any residual token.

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      if (activeTab === 'signup') {
        await signUpWithEmail(data.email, data.password);
        toast({
          title: 'Account Created',
          description: 'You have successfully signed up. Please sign in.',
        });
        setActiveTab('signin'); // Switch to sign-in tab after successful sign-up
        form.reset(); // Reset form for sign-in
      } else {
        const result = await signInWithEmail(data.email, data.password);
        if (result && result.user) {
          setGoogleAccessToken(null); // Clear any potential old Google token
          toast({
            title: 'Signed In',
            description: `Welcome back, ${result.user.email}!`,
          });
          if (onAuthSuccess) onAuthSuccess();
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      console.error(`${activeTab} error:`, error);
      toast({
        title: `${activeTab === 'signin' ? 'Sign-In' : 'Sign-Up'} Failed`,
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
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
      <TabsContent value={activeTab}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...form.register('email')}
              disabled={isLoading}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...form.register('password')}
              disabled={isLoading}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Icons.loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              activeTab === 'signin' ? 'Sign In' : 'Sign Up'
            )}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
