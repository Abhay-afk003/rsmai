"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Link as LinkIcon, Phone, Mail, Users, Trash2, CheckCheck, RefreshCcw, Send } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { add, format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { FeedbackLoopItem } from "@/components/reply-crafter";
import { BrainCircuit } from "lucide-react";

type FollowUpStatus = 'due' | 'upcoming' | 'overdue' | 'complete';

export default function FeedbackLoopPage() {
    const [history, setHistory] = useState<FeedbackLoopItem[]>([]);
    const { toast } = useToast();

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
            sessionStorage.removeItem("feedbackLoopHistory");
            setHistory([]);
        }
    }, []);

    useEffect(() => {
        loadHistory();
        
        const handleStorageChange = () => {
            loadHistory();
        };

        window.addEventListener('storage', handleStorageChange);
        
        // Also listen for focus to catch changes from other tabs without a full storage event
        window.addEventListener('focus', loadHistory);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', loadHistory);
        };
    }, [loadHistory]);

    useEffect(() => {
        try {
            sessionStorage.setItem("feedbackLoopHistory", JSON.stringify(history));
        } catch (error) {
            console.error("Failed to save history to sessionStorage", error);
        }
    }, [history]);

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
            description: "The contact has been removed from your feedback loop.",
        });
    };
    
    const clearHistory = () => {
      setHistory([]);
      toast({
          title: "Feedback Loop Cleared",
          description: "All contacts have been removed from your feedback loop.",
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
                <h1 className="ml-2 text-lg font-semibold">Feedback Loop</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <Card>
                    <CardHeader className="flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex-1">
                            <CardTitle>Outreach Follow-ups</CardTitle>
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
                                This action cannot be undone. This will permanently delete your entire feedback loop history.
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
                                                        This will permanently remove "{row.contact.name || 'Unnamed Contact'}" from your feedback loop.
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
                                        No contacts in the feedback loop. <br/>Craft a reply for a prospect to add them here.
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
    );
}
