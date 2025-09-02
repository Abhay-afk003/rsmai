"use client";
import React, { useState, useTransition, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, Mail, MessageSquare, Copy, BrainCircuit, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { performCraftReply } from '@/app/actions';
import { Textarea } from './ui/textarea';
import type { AnalysisHistoryItem, CraftOutreachReplyOutput } from './scraper-page';
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
} from "@/components/ui/alert-dialog"


type Platform = 'email' | 'whatsapp';

const ReplyPart = ({ label, content, platform }: { label: string; content?: string; platform: Platform }) => {
  const { toast } = useToast();
  if (!content) return null;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Copied to Clipboard', description: `${label} copied!` });
  };
  
  const getRecipient = () => {
      if (platform === 'email') return 'mailto:';
      if (platform === 'whatsapp') return `https://wa.me/`;
      return '';
  }

  return (
    <div className="grid gap-2">
        <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-muted-foreground">{label}</label>
            <div className='flex gap-2'>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyToClipboard}>
                    <Copy className="h-4 w-4" />
                </Button>
            </div>
        </div>
      <Textarea
        value={content}
        readOnly
        className="w-full resize-none text-sm whitespace-pre-wrap"
        rows={label === 'Body' ? 8 : 1}
      />
    </div>
  );
};


export default function ReplyCrafter() {
  const [activeContact, setActiveContact] = useState<AnalysisHistoryItem | null>(null);
  const [generatedReply, setGeneratedReply] = useState<CraftOutreachReplyOutput | null>(null);
  const [isCrafting, startCraftingTransition] = useTransition();
  const [platform, setPlatform] = useState<Platform>('email');
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
    setPlatform(platform);
    setGeneratedReply(null);
    startCraftingTransition(async () => {
      const result = await performCraftReply({
        platform,
        contact: activeContact.contact,
        painPoints: activeContact.painPoints!,
      });

      if (result.success && result.data) {
        setGeneratedReply(result.data);
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
  
  const clearActiveContact = () => {
    sessionStorage.removeItem('activeContact');
    setActiveContact(null);
    setGeneratedReply(null);
    toast({
        title: 'Contact Cleared',
        description: 'You can now select a new contact for reply crafting.'
    });
  }

  const getRecipientInfo = () => {
    if (!activeContact) return null;
    if (platform === 'email') {
        return activeContact.contact.emails?.[0] ? `To: ${activeContact.contact.emails[0]}` : 'No email found';
    }
    if (platform === 'whatsapp') {
        return activeContact.contact.phoneNumbers?.[0] ? `To: ${activeContact.contact.phoneNumbers[0]}` : 'No phone number found';
    }
    return null;
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

                {isCrafting && (
                    <div className="flex items-center justify-center text-muted-foreground rounded-md border border-dashed p-4 min-h-[300px]">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        Crafting masterpiece...
                    </div>
                )}

                {generatedReply && (
                    <div className="space-y-4">
                        <h3 className="text-base font-semibold text-primary">{getRecipientInfo()}</h3>
                        {platform === 'email' && <ReplyPart label="Subject" content={generatedReply.subject} platform={platform} />}
                        <ReplyPart label="Body" content={generatedReply.body} platform={platform} />
                        <ReplyPart label="Call To Action" content={generatedReply.callToAction} platform={platform} />
                    </div>
                )}
                </div>
            )}
            </div>
        </div>
      </div>
  );
}
