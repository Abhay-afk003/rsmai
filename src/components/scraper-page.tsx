"use client";

import React, { useState, useTransition, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Link as LinkIcon, Phone, Mail, Users, Globe, MessageSquare, Newspaper, Instagram, Facebook, Linkedin, Youtube, Twitter, Download, Search, Trash2, FileDown, MessageCircle } from "lucide-react";
import { performScrape, performPainPointAnalysis } from "@/app/actions";
import type { ScrapeWebsiteInput, ScrapedResult, AnalyzeClientPainPointsOutput, CraftOutreachReplyOutput } from "@/ai/schemas";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";


type ScrapeSource = ScrapeWebsiteInput["source"];

const sourceConfig: Record<ScrapeSource, { label: string; placeholder: string; icon: React.ElementType }> = {
    website: { label: "Web & Public Data", placeholder: "e.g., 'marketing managers'", icon: Globe },
    reddit: { label: "Reddit Topic/Subreddit", placeholder: "e.g., 'saas founders'", icon: MessageSquare },
    news: { label: "News Articles Query", placeholder: "e.g., 'companies seeking funding'", icon: Newspaper },
    instagram: { label: "Instagram Search", placeholder: "e.g., 'fashion influencers'", icon: Instagram },
    facebook: { label: "Facebook Search", placeholder: "e.g., 'local business owners'", icon: Facebook },
    linkedin: { label: "LinkedIn Search", placeholder: "e.g., 'software engineers in SF'", icon: Linkedin },
    youtube: { label: "YouTube Search", placeholder: "e.g., 'tech review channels'", icon: Youtube },
}

export type AnalysisHistoryItem = {
    id: string;
    date: string;
    scrapeQuery: string;
    scrapeSource: ScrapeSource;
    scrapeLocation?: string;
    contact: ScrapedResult;
    isAnalyzingPainPoints?: boolean;
    painPoints?: AnalyzeClientPainPointsOutput["painPoints"];
    feedback?: string;
};
export type { CraftOutreachReplyOutput };


type ScrapedItem = ScrapedResult & { id: string };

const SOCIALS_TO_CHECK: Record<string, React.ElementType> = {
    linkedin: Linkedin,
    twitter: Twitter,
    instagram: Instagram,
    facebook: Facebook,
    youtube: Youtube,
};

export default function ScraperPage() {
  const [scrapeQuery, setScrapeQuery] = useState("");
  const [scrapeLocation, setScrapeLocation] = useState("");
  const [scrapeSource, setScrapeSource] = useState<ScrapeSource>("website");
  const [scrapedResults, setScrapedResults] = useState<ScrapedItem[]>([]);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  
  const [isScraping, startScrapingTransition] = useTransition();
  const [isAnalyzing, startAnalyzingTransition] = useTransition();

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedHistory = sessionStorage.getItem("analysisHistory");
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to parse history from sessionStorage", error);
      sessionStorage.removeItem("analysisHistory");
    }
  }, []);

  useEffect(() => {
    try {
        sessionStorage.setItem("analysisHistory", JSON.stringify(history));
    } catch (error) {
        console.error("Failed to save history to sessionStorage", error);
    }
  }, [history]);

  const handleScrape = () => {
    if (!scrapeQuery.trim()) {
      toast({ title: "Input required", description: `Please enter a ${sourceConfig[scrapeSource].label}.`, variant: "destructive" });
      return;
    }

    setScrapedResults([]);
    const scrapeInput: ScrapeWebsiteInput = { 
      source: scrapeSource, 
      query: scrapeQuery,
      ...(scrapeLocation.trim() && { location: scrapeLocation.trim() })
    };

    startScrapingTransition(async () => {
      const scrapeResult = await performScrape(scrapeInput);
      if (scrapeResult.success && scrapeResult.data) {
        setScrapedResults(scrapeResult.data.results.map((r) => ({ ...r, id: `${r.sourceUrl}-${Math.random()}` })));
        toast({
          title: "Scraping Complete",
          description: `${scrapeResult.data.results.length} contacts found. Select which ones to add to your research.`,
        });
      } else {
        toast({
          title: "Scraping Failed",
          description: scrapeResult.error || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  const handleAddToHistory = (resultToAdd: ScrapedItem) => {
    if (history.some(item => item.contact.sourceUrl === resultToAdd.sourceUrl)) {
        toast({
            title: "Duplicate",
            description: "This contact is already in your research history.",
            variant: "destructive"
        });
        return;
    }
  
    const newHistoryItem: AnalysisHistoryItem = {
      id: resultToAdd.id,
      date: new Date().toLocaleDateString(),
      scrapeQuery: scrapeQuery || "N/A",
      scrapeSource: scrapeSource,
      ...(scrapeLocation.trim() && { scrapeLocation: scrapeLocation.trim() }),
      contact: resultToAdd,
      feedback: "",
    };
  
    setHistory(prev => [newHistoryItem, ...prev]);
    setScrapedResults(prev => prev.filter(r => r.id !== resultToAdd.id));
    toast({
        title: "Contact Added",
        description: `${resultToAdd.name || 'Unnamed contact'} has been added to your research.`,
    });
  };

  const handlePainPointAnalysis = (id: string, clientData: string) => {
    setHistory(prev => prev.map(item => item.id === id ? { ...item, isAnalyzingPainPoints: true } : item));

    startAnalyzingTransition(async () => {
        const result = await performPainPointAnalysis(clientData);
        if (result.success && result.data) {
            setHistory(prev => prev.map(item => item.id === id ? { ...item, painPoints: result.data!.painPoints, isAnalyzingPainPoints: false } : item));
            toast({
                title: "Pain Point Analysis Complete",
                description: "Direct pain points have been identified.",
            });
        } else {
            setHistory(prev => prev.map(item => item.id === id ? { ...item, isAnalyzingPainPoints: false } : item));
            toast({
                title: "Analysis Failed",
                description: result.error || "An unknown error occurred.",
                variant: "destructive",
            });
        }
    });
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    toast({
        title: "Contact Removed",
        description: "The contact has been removed from your research history.",
    });
  };

  const clearHistory = () => {
      setHistory([]);
      toast({
          title: "History Cleared",
          description: "All contacts have been removed from your research history.",
      });
  };
  
  const handleFeedbackChange = (id: string, newFeedback: string) => {
    setHistory(prev => prev.map(item => item.id === id ? { ...item, feedback: newFeedback } : item));
  };


  const downloadCSV = () => {
    if (history.length === 0) {
      toast({ title: "No data to download", description: "Please add a contact to history first.", variant: "destructive" });
      return;
    }
    const header = "COUNT,DATE,CLIENT DETAILS,SOCIALS MISSING,PAIN POINTS,FEEDBACK\n";
    const rows = history.map((row, index) => {
      const { contact, painPoints } = row;
      const count = index + 1;
      const date = row.date;
      const clientDetails = `"${[
        `Name: ${contact.name || 'N/A'}`,
        `Query: ${row.scrapeQuery}`,
        `Location: ${row.scrapeLocation || 'N/A'}`,
        `Source: ${row.scrapeSource}`,
        `Source URL: ${contact.sourceUrl}`,
        `Summary: ${(contact.summary || "").replace(/"/g, '""')}`,
        `Emails: ${(contact.emails || []).join(", ")}`,
        `Phones: ${(contact.phoneNumbers || []).join(", ")}`,
        `Socials: ${(contact.socialMediaLinks || []).join(", ")}`
      ].join('\n')}"`;
      
      const foundSocials = new Set((contact.socialMediaLinks || []).map(link => {
        try {
            const hostname = new URL(link).hostname.toLowerCase();
            if (hostname.includes('linkedin')) return 'linkedin';
            if (hostname.includes('twitter') || hostname.includes('x.com')) return 'twitter';
            if (hostname.includes('instagram')) return 'instagram';
            if (hostname.includes('facebook')) return 'facebook';
            if (hostname.includes('youtube')) return 'youtube';
        } catch {
            return null;
        }
        return null;
      }).filter(Boolean));

      const missingSocials = Object.keys(SOCIALS_TO_CHECK).filter(s => !foundSocials.has(s)).join(', ');

      const socialsMissing = `"${missingSocials || 'None'}"`;
      const painPointsStr = `"${(painPoints || []).map(p => `[${p.category}] ${p.description}\nPlan: ${p.suggestedService}`).join('\n\n').replace(/"/g, '""')}"`;
      const feedback = `"${(row.feedback || '').replace(/"/g, '""')}"`;

      return [count, date, clientDetails, socialsMissing, painPointsStr, feedback].join(",");
    }).join("\n");

    const csvContent = header + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "market-research-pain-points.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const downloadPDF = () => {
    if (history.length === 0) {
        toast({ title: "No data to download", description: "Please add a contact to history first.", variant: "destructive" });
        return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("RSM Insights AI - Research History", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report generated on ${new Date().toLocaleDateString()}`, 14, 29);

    const tableData = history.map(row => {
        const { contact, painPoints } = row;
        const painPointsText = (painPoints || []).map(p => `[${p.category}] ${p.description}\nPlan: ${p.suggestedService}`).join('\n\n');
        const contactInfo = [
            `Query: ${row.scrapeQuery}`,
            `Location: ${row.scrapeLocation || 'N/A'}`,
            `Source: ${row.scrapeSource}`,
            (contact.emails || []).join(', '),
            (contact.phoneNumbers || []).join(', '),
            (contact.socialMediaLinks || []).join(', '),
        ].filter(Boolean).join('\n');

        return [
            row.date,
            contact.name || 'N/A',
            contactInfo,
            painPointsText || "Not analyzed yet."
        ];
    });

    (doc as any).autoTable({
        head: [['Date', 'Name', 'Contact Info', 'Pain Point Analysis']],
        body: tableData,
        startY: 35,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 35 },
            2: { cellWidth: 45 },
            3: { cellWidth: 'auto' },
        },
        didParseCell: function(data: any) {
            if (data.column.dataKey === 3) {
                data.cell.styles.fontStyle = 'italic';
            }
        }
    });

    doc.save('rsm-contact-analysis.pdf');
  };

  const handleCraftReply = (item: AnalysisHistoryItem) => {
    sessionStorage.setItem('activeContact', JSON.stringify(item));
    router.push('/reply-crafter');
  };

  const currentSourceConfig = sourceConfig[scrapeSource];
  const isPending = isScraping || isAnalyzing;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-6">
          <div className="border rounded-lg">
            <CardHeader>
              <CardTitle>Contact Scraping</CardTitle>
              <CardDescription>Scrape contact details based on your Ideal Customer Profile (ICP).</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="flex flex-col lg:flex-row gap-4 items-end">
                  <div className="grid gap-2 w-full lg:w-[200px]">
                      <label htmlFor="scrape-source" className="text-sm font-medium">Data Source</label>
                      <Select value={scrapeSource} onValueChange={(v) => setScrapeSource(v as ScrapeSource)} disabled={isPending}>
                          <SelectTrigger id="scrape-source">
                              <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="website"><div className="flex items-center gap-2"><Globe className="h-4 w-4" /> Web & Public Data</div></SelectItem>
                              <SelectItem value="reddit"><div className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Reddit</div></SelectItem>
                              <SelectItem value="news"><div className="flex items-center gap-2"><Newspaper className="h-4 w-4" /> News Articles</div></SelectItem>
                              <SelectItem value="linkedin"><div className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn</div></SelectItem>
                              <SelectItem value="facebook"><div className="flex items-center gap-2"><Facebook className="h-4 w-4" /> Facebook</div></SelectItem>
                              <SelectItem value="instagram"><div className="flex items-center gap-2"><Instagram className="h-4 w-4" /> Instagram</div></SelectItem>
                              <SelectItem value="youtube"><div className="flex items-center gap-2"><Youtube className="h-4 w-4" /> YouTube</div></SelectItem>
                          </SelectContent>
                      </Select>
                  </div>

                  <div className="grid gap-2 flex-1 w-full">
                      <label htmlFor="query-input" className="text-sm font-medium">{currentSourceConfig.label}</label>
                      <Input 
                          id="query-input"
                          placeholder={currentSourceConfig.placeholder}
                          value={scrapeQuery}
                          onChange={(e) => setScrapeQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
                          disabled={isPending}
                      />
                  </div>

                  <div className="grid gap-2 flex-1 w-full">
                      <label htmlFor="location-input" className="text-sm font-medium">Location (Optional)</label>
                      <Input 
                          id="location-input"
                          placeholder="e.g., California, USA"
                          value={scrapeLocation}
                          onChange={(e) => setScrapeLocation(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
                          disabled={isPending}
                      />
                  </div>
                   <Button onClick={handleScrape} disabled={isScraping} className="w-full lg:w-auto">
                      {isScraping ? (
                      <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scraping...
                      </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Scrape Contacts
                        </>
                      )}
                  </Button>
              </div>

              {scrapedResults.length > 0 && (
                  <div className="border rounded-lg p-2 sm:p-4">
                      <h3 className="font-semibold mb-2">Scraped Contacts ({scrapedResults.length} found)</h3>
                      <p className="text-sm text-muted-foreground mb-4">Select contacts to add them to your research history below.</p>
                      <ScrollArea className="h-72">
                        <Accordion type="single" collapsible className="w-full pr-4">
                            {scrapedResults.map((result) => (
                                <AccordionItem value={result.id} key={result.id}>
                                    <div className="flex justify-between items-center w-full py-1">
                                        <AccordionTrigger className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                <span className="truncate text-left font-semibold">{result.name || "Unnamed Contact"}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <Button size="sm" onClick={(e) => { e.stopPropagation(); handleAddToHistory(result); }}>
                                            Add to Research
                                        </Button>
                                    </div>
                                    <AccordionContent>
                                        <p className="text-sm text-muted-foreground mb-4">{result.summary}</p>
                                        <div className="grid gap-2 text-xs">
                                            <div className="flex items-center gap-2">
                                                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                                <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                                                    {result.sourceUrl}
                                                </a>
                                            </div>
                                            {result.emails && result.emails.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                                                        {result.emails.map(email => (
                                                            <a key={email} href={`mailto:${email}`} className="text-primary hover:underline">{email}</a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {result.phoneNumbers && result.phoneNumbers.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                                                        {result.phoneNumbers.map(phone => (
                                                            <a key={phone} href={`tel:${phone}`} className="text-primary hover:underline">{phone}</a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {result.socialMediaLinks && result.socialMediaLinks.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <div className="flex flex-wrap gap-2">
                                                        {result.socialMediaLinks.map(link => (
                                                            <a key={link} href={link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{new URL(link).hostname.replace('www.','')}</a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                      </ScrollArea>
                  </div>
              )}
              
            </CardContent>
          </div>

          <Card>
                <CardHeader className="flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle>Market Research Pain Points</CardTitle>
                    <CardDescription>
                      A log of all your scraped contacts. Results are saved in your browser session.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button onClick={downloadCSV} variant="outline" size="sm" disabled={history.length === 0} className="w-full sm:w-auto">
                          <Download className="mr-2 h-4 w-4" />
                          Download CSV
                      </Button>
                      <Button onClick={downloadPDF} variant="outline" size="sm" disabled={history.length === 0} className="w-full sm:w-auto">
                          <FileDown className="mr-2 h-4 w-4" />
                          Download PDF
                      </Button>
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
                              This action cannot be undone. This will permanently delete your entire research history from this session.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={clearHistory}>Continue</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px] text-center px-2">COUNT</TableHead>
                          <TableHead className="min-w-[100px] px-2">DATE</TableHead>
                          <TableHead className="min-w-[300px] px-2">CLIENT DETAILS</TableHead>
                          <TableHead className="min-w-[150px] px-2">SOCIALS MISSING</TableHead>
                          <TableHead className="min-w-[300px] px-2">PAIN POINTS</TableHead>
                          <TableHead className="min-w-[200px] px-2">FEEDBACK</TableHead>
                          <TableHead className="w-[120px] text-right px-2">ACTIONS</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.length > 0 ? (
                          history.map((row, index) => {
                             const foundSocials = new Set((row.contact.socialMediaLinks || []).map(link => {
                                  try {
                                      const hostname = new URL(link).hostname.toLowerCase();
                                      if (hostname.includes('linkedin')) return 'linkedin';
                                      if (hostname.includes('twitter') || hostname.includes('x.com')) return 'twitter';
                                      if (hostname.includes('instagram')) return 'instagram';
                                      if (hostname.includes('facebook')) return 'facebook';
                                      if (hostname.includes('youtube')) return 'youtube';
                                  } catch { return null; }
                                  return null;
                              }).filter(Boolean));

                              const missingSocials = Object.entries(SOCIALS_TO_CHECK).filter(([key]) => !foundSocials.has(key as string));

                             return (
                            <TableRow key={row.id}>
                              <TableCell className="text-center px-2 py-4">{index + 1}</TableCell>
                              <TableCell className="px-2 py-4">{row.date}</TableCell>
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
                                  {missingSocials.length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                          {missingSocials.map(([key, Icon]) => (
                                              <Tooltip key={key}>
                                                  <TooltipTrigger asChild>
                                                      <span><Icon className="h-4 w-4 text-muted-foreground" /></span>
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                      <p>Missing {key.charAt(0).toUpperCase() + key.slice(1)}</p>
                                                  </TooltipContent>
                                              </Tooltip>
                                          ))}
                                      </div>
                                  ) : (
                                      <span className="text-xs text-muted-foreground italic">None</span>
                                  )}
                              </TableCell>
                              <TableCell className="align-top px-2 py-4">
                                {row.isAnalyzingPainPoints ? (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Analyzing...</span>
                                  </div>
                                ) : row.painPoints ? (
                                  <div className="space-y-3">
                                      {row.painPoints.map((p, i) => (
                                        <div key={i} className="text-xs">
                                            <p className="font-semibold text-primary">{p.category}</p>
                                            <p className="text-foreground mt-0.5">{p.description}</p>
                                            <p className="font-semibold text-accent mt-1.5">Plan:</p>
                                            <p className="text-foreground mt-0.5">{p.suggestedService}</p>
                                        </div>
                                      ))}
                                  </div>
                                ) : (
                                  <Button variant="outline" size="sm" onClick={() => handlePainPointAnalysis(row.id, JSON.stringify(row.contact))}>
                                    <Search className="mr-2 h-4 w-4" />
                                    Analyze
                                  </Button>
                                )}
                              </TableCell>
                              <TableCell className="align-top px-2 py-4">
                                  <Textarea 
                                      placeholder="Log feedback, replies..."
                                      className="text-xs h-24"
                                      value={row.feedback}
                                      onChange={(e) => handleFeedbackChange(row.id, e.target.value)}
                                  />
                              </TableCell>
                              <TableCell className="text-right align-top px-2 py-4">
                                  <div className="flex flex-col gap-1.5 justify-end items-end">
                                      {row.painPoints && (
                                          <Button variant="ghost" size="sm" onClick={() => handleCraftReply(row)} className="w-full justify-start">
                                              <MessageCircle className="mr-2 h-4 w-4" />
                                              Craft Reply
                                          </Button>
                                      )}
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
                                              This will permanently remove "{row.contact.name || 'Unnamed Contact'}" from your history.
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
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                              No research history yet. Add a contact from the scraper above to get started.
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
    </TooltipProvider>
  );
}
