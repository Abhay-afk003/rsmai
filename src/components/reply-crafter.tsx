"use client";
import React, { useState, useTransition, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, Mail, MessageSquare, Copy, BrainCircuit, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { performCraftReply } from '@/app/actions';
import { Textarea } from './ui/textarea';
import type { ResearchHistoryItem } from './scraper-page';
import type { CraftOutreachReplyOutput, PainPoint } from '@/ai/schemas';
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

const ReplyPart = ({ label, content }: { label: string; content?: string; }) => {
  const { toast } = useToast();
  if (!content) return null;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Copied to Clipboard', description: `${label} copied!` });
  };

  return (
    <div className="grid gap-2">
        <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-muted-foreground">{label}</label>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyToClipboard}>
                <Copy className="h-4 w-4" />
            </Button>
        </div>
      <Textarea
        value={content}
        readOnly
        className="w-full resize-none text-sm whitespace-pre-wrap"
        rows={label === 'Body' ? 8 : (label === 'Subject' ? 1 : 2)}
      />
    </div>
  );
};

export interface FeedbackLoopItem extends ResearchHistoryItem {
  generatedReply: CraftOutreachReplyOutput;
  platform: Platform;
  feedback: string;
  followUp?: {
      status: 'awaiting_reply' | 'replied';
      contactedDate: string;
      followUpCount: number;
      nextFollowUpDate?: string;
      replyDate?: string;
  };
}

export default function ReplyCrafter() {
  const [activeContact, setActiveContact] = useState<ResearchHistoryItem | null>(null);
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
        painPoints: activeContact.painPoints as PainPoint[],
      });

      if (result.success && result.data) {
        setGeneratedReply(result.data);
        
        try {
            const feedbackItem: FeedbackLoopItem = {
              ...activeContact,
              generatedReply: result.data,
              platform,
              feedback: '', 
            };
            
            const storedHistory = sessionStorage.getItem("feedbackLoopHistory");
            const feedbackHistory: FeedbackLoopItem[] = storedHistory ? JSON.parse(storedHistory) : [];
            
            if (!feedbackHistory.some((item) => item.id === feedbackItem.id)) {
                const newHistory = [feedbackItem, ...feedbackHistory];
                sessionStorage.setItem("feedbackLoopHistory", JSON.stringify(newHistory));
            }
        } catch (e) {
            console.error("Could not process feedback loop history", e)
        }


        toast({
          title: 'Reply Crafted & Sent to Feedback Loop',
          description: `Your ${platform} message is ready.`,
          action: (
              <Button variant="outline" size="sm" onClick={() => router.push('/feedback-loop')}>
                  Go to Feedback Loop
              </Button>
          ),
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
    let recipient, action;
    if (platform === 'email') {
        recipient = activeContact.contact.emails?.[0];
        action = recipient ? `mailto:${recipient}` : '#';
        return recipient ? <a href={action} className="text-primary hover:underline">To: {recipient}</a> : 'No email found';
    }
    if (platform === 'whatsapp') {
        recipient = activeContact.contact.phoneNumbers?.[0];
        action = recipient ? `https://wa.me/${recipient.replace(/\D/g, '')}` : '#';
        return recipient ? <a href={action} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">To: {recipient}</a> : 'No phone number found';
    }
    return null;
  }

  return (
      <div className="flex flex-col h-full">
        <header className="hidden md:flex px-4 lg:px-6 h-14 items-center border-b shrink-0">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <h1 className="ml-2 text-lg font-semibold">Reply Crafter</h1>
        </header>
        <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-8 h-full flex flex-col">
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
                    <h3 className="text-base font-semibold mb-2">Choose Platform & Generate Reply</h3>
                    <p className="text-sm text-muted-foreground mb-4">Generating a reply will add this contact to your "Feedback Loop" for follow-up tracking.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                        variant={platform === 'email' ? 'default' : 'outline'}
                        onClick={() => handleCraftReply('email')}
                        disabled={isCrafting}
                    >
                        <Mail className="mr-2 h-4 w-4" />
                        Generate Email
                    </Button>
                    <Button
                        variant={platform === 'whatsapp' ? 'default' : 'outline'}
                        onClick={() => handleCraftReply('whatsapp')}
                        disabled={isCrafting}
                    >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Generate WhatsApp
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
                        {platform === 'email' && <ReplyPart label="Subject" content={generatedReply.subject} />}
                        <ReplyPart label="Body" content={generatedReply.body} />
                        <ReplyPart label="Call To Action" content={generatedReply.callToAction} />
                    </div>
                )}
                </div>
            )}
            </div>
        </div>
      </div>
  );
}