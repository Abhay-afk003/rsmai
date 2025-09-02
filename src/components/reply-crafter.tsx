"use client";
import React, { useState, useTransition } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, Mail, MessageSquare, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { performCraftReply } from '@/app/actions';
import { Textarea } from './ui/textarea';
import type { AnalysisHistoryItem } from './client-analysis-page';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';

type ReplyCrafterProps = {
  activeContact: AnalysisHistoryItem | null;
};

type Platform = 'email' | 'whatsapp';

export default function ReplyCrafter({ activeContact }: ReplyCrafterProps) {
  const [generatedReply, setGeneratedReply] = useState('');
  const [isCrafting, startCraftingTransition] = useTransition();
  const { toast } = useToast();

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

  return (
    <ScrollArea className="h-full">
        <div className="p-4 h-full flex flex-col">
        <h2 className="text-lg font-semibold">Reply Generator</h2>
        <Separator className="my-4" />

        {!activeContact ? (
            <div className="flex-1 flex items-center justify-center text-center">
                <p className="text-muted-foreground">Select a contact with analyzed pain points from the history table to start crafting replies.</p>
            </div>
        ) : (
            <div className="flex-1 flex flex-col gap-4">
            <Card>
                <CardHeader>
                <CardTitle className="text-base">{activeContact.contact.name}</CardTitle>
                <CardDescription className="text-xs truncate">
                    {activeContact.scrapeQuery}
                </CardDescription>
                </CardHeader>
            </Card>
            
            <div>
                <h3 className="text-sm font-medium mb-2">Choose Platform</h3>
                <div className="grid grid-cols-2 gap-2">
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
                <div className="flex-1 flex flex-col">
                    <h3 className="text-sm font-medium mb-2">Generated Reply</h3>
                    {isCrafting ? (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground rounded-md border border-dashed p-4 min-h-[200px]">
                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            Crafting masterpiece...
                        </div>
                    ) : (
                        <div className="relative flex-1">
                            <Textarea
                                value={generatedReply}
                                readOnly
                                className="w-full h-full resize-none text-sm whitespace-pre-wrap min-h-[200px]"
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
    </ScrollArea>
  );
}
