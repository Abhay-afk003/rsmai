"use client";
import React, { useState, useTransition, useEffect, useMemo, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, Mail, MessageSquare, Copy, BrainCircuit, X, User, Link as LinkIcon, Phone, Users, Trash2, CheckCheck, RefreshCcw, Send } from 'lucide-react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { add, format } from 'date-fns';

type Platform = 'email' | 'whatsapp';
type FollowUpStatus = 'due' | 'upcoming' | 'overdue' | 'complete';


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


export default function ReplyCrafter() {
  const [activeContact, setActiveContact] = useState<ResearchHistoryItem | null>(null);
  const [generatedReply, setGeneratedReply] = useState<CraftOutreachReplyOutput | null>(null);
  const [isCrafting, startCraftingTransition] = useTransition();
  const [platform, setPlatform] = useState<Platform>('email');
  const [history, setHistory] = useState<FeedbackLoopItem[]>([]);
  const { toast } = useToast();
  const router = useRouter();


   const loadHistory = useCallback(() => {
    try {
        const storedHistory = sessionStorage.getItem("feedbackLoopHistory");
        if (storedHistory) {
            const parsedHistory = JSON.parse(storedHistory);
            setHistory(parsedHistory);
        } else {
            setHistory([]);
        }
    } catch (error) {
        console.error("Failed to parse history from sessionStorage", error);
        sessionStorage.removeItem("feedbackLoopHistory"); // Clear corrupted data
        setHistory([]);
    }
  }, []);

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
    loadHistory();
  }, [loadHistory]);
  
  
   useEffect(() => {
      try {
          sessionStorage.setItem("feedbackLoopHistory", JSON.stringify(history));
      } catch (error) {
          console.error("Failed to save history to sessionStorage", error);
      }
  }, [history]);

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
        
        const feedbackItem: FeedbackLoopItem = {
          ...activeContact,
          generatedReply: result.data,
          platform,
          feedback: '', 
        };

        setHistory(prev => {
            const itemIndex = prev.findIndex((item) => item.id === feedbackItem.id);
            if (itemIndex > -1) {
              const updatedHistory = [...prev];
              updatedHistory[itemIndex] = feedbackItem;
              return updatedHistory;
            } else {
              return [feedbackItem, ...prev];
            }
        });

        toast({
          title: 'Reply Crafted & Ready for Follow-up',
          description: `Your ${platform} message is ready. Scroll down to manage follow-ups.`,
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
  
    const handleFeedbackChange = (id: string, newFeedback: string) => {
        setHistory(prev => prev.map(item => item.id === id ? { ...item, feedback: newFeedback } : item));
    };

    const setContacted = (id: string, contactedDate: Date) => {
        setHistory(prev => prev.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    followUp: {
                        status: 'awaiting_reply',
                        contactedDate: format(contactedDate, 'yyyy-MM-dd'),
                        followUpCount: 0,
                        nextFollowUpDate: format(add(contactedDate, { days: 3 }), 'yyyy-MM-dd'),
                    }
                };
            }
            return item;
        }));
        toast({ title: 'Follow-up set', description: 'Next follow-up scheduled in 3 days.' });
    };

    const setNextFollowUp = (id: string) => {
        setHistory(prev => prev.map(item => {
            if (item.id === id && item.followUp && item.followUp.status === 'awaiting_reply' && item.followUp.followUpCount < 2) {
                const newFollowUpCount = item.followUp.followUpCount + 1;
                const daysToAdd = (newFollowUpCount + 1) * 3;
                return {
                    ...item,
                    followUp: {
                        ...item.followUp,
                        followUpCount: newFollowUpCount,
                        nextFollowUpDate: format(add(new Date(), { days: daysToAdd }), 'yyyy-MM-dd'),
                    }
                };
            }
            return item;
        }));
        toast({ title: 'Next Follow-up Scheduled' });
    };

    const setReplied = (id: string) => {
        setHistory(prev => prev.map(item => {
            if (item.id === id && item.followUp) {
                return {
                    ...item,
                    followUp: {
                        ...item.followUp,
                        status: 'replied',
                        replyDate: format(new Date(), 'yyyy-MM-dd'),
                        nextFollowUpDate: undefined,
                    }
                };
            }
            return item;
        }));
        toast({ title: 'Prospect Replied!', description: 'Follow-up sequence for this contact has been stopped.' });
    };

    const resetFollowUp = (id: string) => {
        setHistory(prev => prev.map(item => {
            if (item.id === id) {
                const { followUp, ...rest } = item;
                return { ...rest, feedback: item.feedback || '' };
            }
            return item;
        }));
        toast({ title: 'Follow-up Reset', description: 'The follow-up status for this contact has been cleared.' });
    };
    
    const deleteHistoryItem = (id: string) => {
        setHistory(prev => prev.filter(item => item.id !== id));
        toast({
            title: "Contact Removed",
            description: "The contact has been removed from your follow-up loop.",
        });
    };
    
    const clearHistory = () => {
      setHistory([]);
      toast({
          title: "Follow-up Loop Cleared",
          description: "All contacts have been removed from your follow-up loop.",
      });
    };

    const getFollowUpStatus = (item: FeedbackLoopItem): FollowUpStatus => {
        if (!item.followUp) return 'upcoming'; 
        if (item.followUp.status === 'replied') return 'complete';
        if (!item.followUp.nextFollowUpDate) return 'complete';

        const today = new Date();
        today.setHours(0,0,0,0);
        const dueDate = new Date(item.followUp.nextFollowUpDate);
        dueDate.setHours(0,0,0,0);
        
        if (dueDate.getTime() < today.getTime()) return 'overdue';
        if (dueDate.getTime() === today.getTime()) return 'due';
        return 'upcoming';
    };

    const sortedHistory = useMemo(() => {
        const statusOrder: Record<FollowUpStatus, number> = { 'overdue': 1, 'due': 2, 'upcoming': 3, 'complete': 4 };
        return [...history].sort((a, b) => {
            const statusA = getFollowUpStatus(a);
            const statusB = getFollowUpStatus(b);
            if (statusA !== statusB) {
                return statusOrder[statusA] - statusOrder[statusB];
            }
            if (a.followUp?.nextFollowUpDate && b.followUp?.nextFollowUpDate) {
                return new Date(a.followUp.nextFollowUpDate).getTime() - new Date(b.followUp.nextFollowUpDate).getTime();
            }
            return 0;
        });
    }, [history]);

  return (
      <div className="flex flex-col h-full">
        <header className="hidden md:flex px-4 lg:px-6 h-14 items-center border-b shrink-0">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <h1 className="ml-2 text-lg font-semibold">Reply Crafter & Follow-ups</h1>
        </header>
        <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-8 h-full flex flex-col gap-6">
            {!activeContact ? (
                <div className="flex-1 flex items-center justify-center text-center border rounded-lg min-h-[300px]">
                    <div className="flex flex-col items-center gap-4 p-4">
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
                                  <CardDescription className="text-xs truncate max-w-[200px] sm:max-w-full">
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
                    <p className="text-sm text-muted-foreground mb-4">Generating a reply will add this contact to your follow-up loop below.</p>
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
              <Card>
                    <CardHeader className="flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex-1">
                            <CardTitle>Outreach Follow-ups (Baki)</CardTitle>
                            <CardDescription>
                                Track and manage all your active conversations and follow-ups.
                            </CardDescription>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={history.length === 0} className="w-full sm:w-auto">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Clear All
                            </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your entire follow-up history.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={clearHistory}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[250px] px-2">CLIENT</TableHead>
                                    <TableHead className="min-w-[300px] px-2">GENERATED REPLY</TableHead>
                                    <TableHead className="min-w-[200px] px-2">FEEDBACK</TableHead>
                                    <TableHead className="min-w-[200px] px-2">FOLLOW-UP STATUS</TableHead>
                                    <TableHead className="w-[120px] text-right px-2">ACTIONS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {sortedHistory.length > 0 ? (
                                sortedHistory.map((row) => {
                                    const followUpStatus = getFollowUpStatus(row);
                                    return (
                                    <TableRow key={row.id}>
                                        <TableCell className="align-top px-2 py-4">
                                            <div className="font-semibold text-base">{row.contact.name || 'Unnamed Contact'}</div>
                                            <p className="text-xs text-muted-foreground line-clamp-3 my-2">{row.contact.summary}</p>
                                            <div className="text-xs space-y-1.5 mt-2">
                                                <div className="flex items-start gap-1.5"><Mail className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground mt-0.5" /> <div className="flex flex-col gap-y-1">{row.contact.emails?.map(e => <a key={e} href={`mailto:${e}`} className="text-primary hover:underline">{e}</a>) || <span className="text-muted-foreground italic">N/A</span>}</div></div>
                                                <div className="flex items-start gap-1.5"><Phone className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground mt-0.5" /> <div className="flex flex-col gap-y-1">{row.contact.phoneNumbers?.map(p => <a key={p} href={`tel:${p}`} className="text-primary hover:underline">{p}</a>) || <span className="text-muted-foreground italic">N/A</span>}</div></div>
                                                <div className="flex items-start gap-1.5"><Users className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground mt-0.5" /><div className="flex flex-col gap-y-1">{row.contact.socialMediaLinks?.map(l => <a key={l} href={l} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{new URL(l).hostname.replace('www.','')}</a>) || <span className="text-muted-foreground italic">N/A</span>}</div></div>
                                                <div className="flex items-start gap-1.5 pt-1"><LinkIcon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground mt-0.5" /><a href={row.contact.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">Source Link</a></div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="align-top px-2 py-4">
                                            <div className="text-xs space-y-2">
                                                {row.platform === 'email' && row.generatedReply.subject && (
                                                    <div>
                                                        <p className="font-semibold text-primary">Subject</p>
                                                        <p className="text-foreground mt-0.5">{row.generatedReply.subject}</p>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-primary">Body</p>
                                                    <p className="text-foreground mt-0.5 whitespace-pre-wrap">{row.generatedReply.body}</p>
                                                </div>
                                                 <div>
                                                    <p className="font-semibold text-primary">Call To Action</p>
                                                    <p className="text-foreground mt-0.5 whitespace-pre-wrap">{row.generatedReply.callToAction}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="align-top px-2 py-4">
                                            <Textarea
                                                placeholder="Log feedback, replies..."
                                                className="text-xs h-24"
                                                value={row.feedback}
                                                onChange={(e) => handleFeedbackChange(row.id, e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell className="align-top px-2 py-4">
                                            {row.followUp ? (
                                                <div className="text-xs space-y-2">
                                                {row.followUp.status === 'replied' ? (
                                                    <div className="flex items-center gap-2 font-semibold text-green-500">
                                                        <CheckCheck className="h-4 w-4" />
                                                        <span>Replied on {format(new Date(row.followUp.replyDate!), 'MMM d, yyyy')}</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className={`font-semibold flex items-center gap-2 ${followUpStatus === 'overdue' ? 'text-destructive' : followUpStatus === 'due' ? 'text-amber-500' : ''}`}>
                                                             <div className={`h-2 w-2 rounded-full ${followUpStatus === 'overdue' ? 'bg-destructive' : followUpStatus === 'due' ? 'bg-amber-500' : 'bg-green-500'}`} />
                                                            Follow-up {row.followUp.followUpCount + 1}/3 due: {format(new Date(row.followUp.nextFollowUpDate!), 'MMM d, yyyy')}
                                                        </div>
                                                        <p className="text-muted-foreground">
                                                            Initially contacted on {format(new Date(row.followUp.contactedDate), 'MMM d, yyyy')}
                                                        </p>
                                                        {row.followUp.followUpCount < 2 && new Date(row.followUp.nextFollowUpDate!) <= new Date() && (
                                                            <Button size="sm" variant="outline" onClick={() => setNextFollowUp(row.id)}>
                                                                Set Next
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                                <Button variant="ghost" size="sm" onClick={() => resetFollowUp(row.id)} className="text-xs p-1 h-auto">
                                                    <RefreshCcw className="mr-1 h-3 w-3" /> Reset
                                                </Button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">Not contacted yet.</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right align-top px-2 py-4">
                                            <div className="flex flex-col gap-1.5 justify-end items-end">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="w-full justify-start" disabled={!!row.followUp}>
                                                            <Send className="mr-2 h-4 w-4" />
                                                            Contacted
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            onSelect={(date) => {
                                                                if (date) {
                                                                    setContacted(row.id, date);
                                                                    const popoverTrigger = document.querySelector(`[data-radix-collection-item][aria-expanded="true"]`);
                                                                    if (popoverTrigger) (popoverTrigger as HTMLElement).click();
                                                                }
                                                            }}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setReplied(row.id)} disabled={!row.followUp || row.followUp.status === 'replied'}>
                                                    <CheckCheck className="mr-2 h-4 w-4" />
                                                    Replied
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                        This will permanently remove "{row.contact.name || 'Unnamed Contact'}" from your follow-up loop.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => deleteHistoryItem(row.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    )
                                })
                                ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No contacts in the follow-up loop. <br/>Craft a reply for a prospect to add them here.
                                    </TableCell>
                                </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
  );
}

    