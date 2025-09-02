"use client";
import React, { useState, useTransition, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, Mail, MessageSquare, Copy, BrainCircuit, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { performCraftReply } from '@/app/actions';
import { Textarea } from './ui/textarea';
import type { AnalysisHistoryItem } from './scraper-page';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


type Platform = 'email' | 'whatsapp';

export default function ReplyCrafter() {
  const [activeContact, setActiveContact] = useState<AnalysisHistoryItem | null>(null);
  const [generatedReply, setGeneratedReply] = useState('');
  const [isCrafting, startCraftingTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    try {
      const item = sessionStorage.getItem('activeContact');
      if (item) {
        setActiveContact(JSON.parse(item));
      }
    } catch (error) {
      console.error("Failed to parse active contact from sessionStorage", error);
      sessionStorage.removeItem("activeContact");
    }
  }, []);

  const handleCraftReply = (platform: Platform) => {
    if (!activeContact || !activeContact.painPoints) {
      toast({
        title: 'Error',
        description: 'No active contact or pain points to craft a reply from.',
        variant: 'destructive',
      });
      return;
    }

    setGeneratedReply('');
    startCraftingTransition(async () => {
      const result = await performCraftReply({
        platform,
        contact: activeContact.contact,
        painPoints: activeContact.painPoints!,
      });

      if (result.success && result.data) {
        setGeneratedReply(result.data.message);
        toast({
          title: 'Reply Crafted',
          description: `Your ${platform} message is ready.`,
        });
      } else {
        toast({
          title: 'Crafting Failed',
          description: result.error || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    });
  };
  
  const handleCopyToClipboard = () => {
    if (!generatedReply) return;
    navigator.clipboard.writeText(generatedReply);
    toast({ title: 'Copied to Clipboard' });
  };

  const clearActiveContact = () => {
    sessionStorage.removeItem('activeContact');
    setActiveContact(null);
    setGeneratedReply('');
    toast({
        title: 'Contact Cleared',
        description: 'You can now select a new contact for reply crafting.'
    });
  }

  return (
      <div className="flex flex-col h-full">
        <header className="px-4 lg:px-6 h-14 flex items-center border-b shrink-0">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <h1 className="ml-2 text-lg font-semibold">Reply Crafter</h1>
        </header>
        <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-8 lg:p-12 h-full flex flex-col">
            {!activeContact ? (
                <div className="flex-1 flex items-center justify-center text-center">
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-muted-foreground">Select a contact from the Prospecting & Research page to start crafting replies.</p>
                        <Button onClick={() => router.push('/')}>Go to Prospecting & Research</Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                  <Card>
                      <CardHeader>
                          <div className="flex justify-between items-start">
                              <div>
                                  <CardTitle className="text-base">{activeContact.contact.name}</CardTitle>
                                  <CardDescription className="text-xs truncate">
                                      {activeContact.scrapeQuery} in {activeContact.scrapeLocation || activeContact.scrapeSource}
                                  </CardDescription>
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Clear Current Contact?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will remove the current contact from this page. You can select them again from the Market Research page.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={clearActiveContact}>Clear</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                          </div>
                      </CardHeader>
                  </Card>
                
                <div>
                    <h3 className="text-base font-semibold mb-2">Choose Platform</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleCraftReply('email')}
                        disabled={isCrafting}
                    >
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleCraftReply('whatsapp')}
                        disabled={isCrafting}
                    >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        WhatsApp
                    </Button>
                    </div>
                </div>

                {(isCrafting || generatedReply) && (
                    <div className="flex flex-col">
                        <h3 className="text-base font-semibold mb-2">Generated Reply</h3>
                        {isCrafting ? (
                            <div className="flex items-center justify-center text-muted-foreground rounded-md border border-dashed p-4 min-h-[300px]">
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                Crafting masterpiece...
                            </div>
                        ) : (
                            <div className="relative">
                                <Textarea
                                    value={generatedReply}
                                    readOnly
                                    className="w-full resize-none text-sm whitespace-pre-wrap min-h-[300px]"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2"
                                    onClick={handleCopyToClipboard}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
                </div>
            )}
            </div>
        </div>
      </div>
  );
}

    