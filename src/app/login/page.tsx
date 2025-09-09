"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { BrainCircuit, KeyRound } from 'lucide-react';

// This should be in an environment variable in a real application
const SUPER_SECRET_PASSKEY = "baki-hanma"; 

export default function LoginPage() {
  const [passkey, setPasskey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = () => {
    setIsLoading(true);

    if (passkey === SUPER_SECRET_PASSKEY) {
      try {
        sessionStorage.setItem('rsm-authenticated', 'true');
        toast({
          title: 'Success',
          description: 'Welcome to RSM Insights AI.',
        });
        router.push('/');
      } catch (error) {
        console.error("Failed to set sessionStorage", error);
        toast({
          title: 'Error',
          description: 'Could not save session. Please enable cookies/site data.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    } else {
      toast({
        title: 'Authentication Failed',
        description: 'The passkey you entered is incorrect.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <BrainCircuit className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">RSM Insights</h1>
          </div>
          <CardTitle>Passkey Required</CardTitle>
          <CardDescription>Enter the passkey to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
                <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="passkey"
                        type="password"
                        placeholder="Enter your passkey"
                        value={passkey}
                        onChange={(e) => setPasskey(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        disabled={isLoading}
                        className="pl-10"
                    />
                </div>
            </div>
            <Button onClick={handleLogin} disabled={isLoading || !passkey} className="w-full">
              {isLoading ? 'Verifying...' : 'Access Dashboard'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
