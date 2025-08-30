"use client";

import React, { useState, useEffect, useTransition } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, BrainCircuit, Search, Globe, MessageSquare, Newspaper, Instagram, Facebook, Linkedin, Youtube, FileDown, User, Link as LinkIcon, Phone, Mail, Users, Trash2, MapPin } from "lucide-react";
import { performPainPointAnalysis, performScrape } from "@/app/actions";
import type { AnalyzeClientPainPointsOutput, ScrapeWebsiteInput, ScrapedResult } from "@/ai/schemas";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from "@/components/ui/alert-dialog";

type ScrapeSource = ScrapeWebsiteInput["source"];

type AnalysisHistoryItem = {
  id: string;
  date: string;
  scrapeQuery: string;
  scrapeSource: ScrapeSource;
  scrapeLocation?: string;
  contact: ScrapedResult;
  isAnalyzingPainPoints?: boolean;
  painPoints?: AnalyzeClientPainPointsOutput["painPoints"];
};

const sourceConfig: Record<ScrapeSource, { label: string; placeholder: string; icon: React.ElementType }> = {
    website: { label: "Web & Public Data", placeholder: "e.g., 'marketing managers in tech startups'", icon: Globe },
    reddit: { label: "Reddit Topic/Subreddit", placeholder: "e.g., 'saas founders'", icon: MessageSquare },
    news: { label: "News Articles Query", placeholder: "e.g., 'companies seeking funding'", icon: Newspaper },
    instagram: { label: "Instagram Search", placeholder: "e.g., 'fashion influencers'", icon: Instagram },
    facebook: { label: "Facebook Search", placeholder: "e.g., 'local business owners'", icon: Facebook },
    linkedin: { label: "LinkedIn Search", placeholder: "e.g., 'software engineers in SF'", icon: Linkedin },
    youtube: { label: "YouTube Search", placeholder: "e.g., 'tech review channels'", icon: Youtube },
}

type ScrapedItem = ScrapedResult & { id: string };

export default function ClientAnalysisPage() {
  const [scrapeQuery, setScrapeQuery] = useState("");
  const [scrapeLocation, setScrapeLocation] = useState("");
  const [scrapeSource, setScrapeSource] = useState<ScrapeSource>("website");
  const [scrapedResults, setScrapedResults] = useState<ScrapedItem[]>([]);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isScraping, startScrapingTransition] = useTransition();
  const [isAnalyzing, startAnalyzingTransition] = useTransition();
  const isPending = isScraping || isAnalyzing;

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
        setScrapedResults(scrapeResult.data.results.map(r => ({ ...r, id: new Date().toISOString() + Math.random() })));
        toast({
          title: "Scraping Complete",
          description: `${scrapeResult.data.results.length} contacts found. Select which ones to add to your research history.`,
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

  const handleAddToHistory = (result: ScrapedItem) => {
    const newHistoryItem: AnalysisHistoryItem = {
      id: result.id,
      date: new Date().toLocaleDateString(),
      scrapeQuery: scrapeQuery || "N/A",
      scrapeSource: scrapeSource,
      ...(scrapeLocation.trim() && { scrapeLocation: scrapeLocation.trim() }),
      contact: result,
    };
    setHistory(prev => [newHistoryItem, ...prev]);
    setScrapedResults(prev => prev.filter(r => r.id !== result.id));
    toast({
      title: "Contact Added",
      description: `${result.name || 'Unnamed contact'} has been added to your research history.`,
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
      
      const socialsMissing = `""`; // Placeholder for manual entry
      const painPointsStr = `"${(painPoints || []).map(p => `[${p.category}] ${p.description}\nPlan: ${p.suggestedService}`).join('\n\n').replace(/"/g, '""')}"`;
      const feedback = `""`; // Placeholder for manual entry

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

  const currentSourceConfig = sourceConfig[scrapeSource];

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen">
        <header className="px-4 lg:px-6 h-14 flex items-center border-b">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <h1 className="ml-2 text-lg font-semibold">RSM Insights AI</h1>
        </header>
        <main className="flex-1 p-4 md:p-8 lg:p-12">
          <div className="grid gap-8 max-w-7xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Contact Scraping</CardTitle>
                <CardDescription>
                  Scrape contact details from various sources based on your Ideal Customer Profile (ICP).
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[180px_1fr_1fr_auto] gap-4 items-end">
                    <div className="grid gap-2">
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

                    <div className="grid gap-2">
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

                    <div className="grid gap-2">
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
                    
                    <Button onClick={handleScrape} disabled={isPending} className="w-full lg:w-auto">
                      {isScraping ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scraping...
                        </>
                      ) : (
                        "Scrape Contacts"
                      )}
                    </Button>
                </div>

                {scrapedResults.length > 0 && (
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Scraped Contacts</h3>
                        <Accordion type="single" collapsible className="w-full">
                            {scrapedResults.map((result) => (
                                <AccordionItem value={result.id} key={result.id}>
                                    <div className="flex justify-between items-center w-full pr-4 py-1">
                                        <AccordionTrigger className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                <span className="truncate text-left font-semibold">{result.name || "Unnamed Contact"}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <Button size="sm" onClick={(e) => { e.stopPropagation(); handleAddToHistory(result); }}>
                                            Add to History
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
                    </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <CardTitle>Research History</CardTitle>
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
                {/* Desktop Table */}
                <div className="border rounded-md hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Date</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Contact Info</TableHead>
                        <TableHead>Pain Point Analysis</TableHead>
                        <TableHead className="w-[50px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.length > 0 ? (
                        history.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.date}</TableCell>
                            <TableCell className="max-w-xs">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="font-semibold cursor-pointer hover:underline truncate">{row.contact.name || 'Unnamed Contact'}</div>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-md bg-card border-border p-4">
                                        <p className="font-bold mb-2">{row.contact.name}</p>
                                        <p className="text-card-foreground whitespace-pre-wrap break-words">{row.contact.summary}</p>
                                        <a href={row.contact.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-2 block truncate">
                                            Source: {row.contact.sourceUrl}
                                        </a>
                                    </TooltipContent>
                                </Tooltip>
                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <MapPin className="h-3 w-3"/>
                                    <span className="italic">"{row.scrapeQuery}" in {row.scrapeLocation || row.scrapeSource}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1.5 text-xs">
                                {row.contact.emails && row.contact.emails.length > 0 && <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> <div className="flex flex-wrap gap-x-2 gap-y-1">{row.contact.emails.map(e => <a key={e} href={`mailto:${e}`} className="text-primary hover:underline">{e}</a>)}</div></div>}
                                {row.contact.phoneNumbers && row.contact.phoneNumbers.length > 0 && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> <div className="flex flex-wrap gap-x-2 gap-y-1">{row.contact.phoneNumbers.map(p => <a key={p} href={`tel:${p}`} className="text-primary hover:underline">{p}</a>)}</div></div>}
                                {row.contact.socialMediaLinks && row.contact.socialMediaLinks.length > 0 && <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /><div className="flex flex-wrap gap-x-2 gap-y-1">{row.contact.socialMediaLinks.map(l => <a key={l} href={l} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{new URL(l).hostname.replace('www.','')}</a>)}</div></div>}
                              </div>
                            </TableCell>
                            <TableCell>
                              {row.isAnalyzingPainPoints ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Analyzing...</span>
                                </div>
                              ) : row.painPoints ? (
                                <Accordion type="single" collapsible className="w-full">
                                  <AccordionItem value="item-1">
                                    <AccordionTrigger>
                                      <div className="flex gap-1.5 flex-wrap max-w-md">
                                          {row.painPoints.slice(0, 3).map((p, i) => (
                                              <Badge key={i} variant="outline" className="cursor-pointer border-primary/50 text-primary hover:bg-primary/10">{p.category}</Badge>
                                          ))}
                                          {row.painPoints.length > 3 && <Badge variant="secondary">+{row.painPoints.length-3} more</Badge>}
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <div className="space-y-4">
                                        {row.painPoints.map((p, i) => (
                                          <div key={i} className="text-xs">
                                              <p className="font-semibold text-primary">{p.category}: <span className="text-foreground font-normal">{p.description}</span></p>
                                              <p className="font-semibold text-accent mt-1">Plan of Action: <span className="text-foreground font-normal">{p.suggestedService}</span></p>
                                          </div>
                                        ))}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              ) : (
                                <Button variant="outline" size="sm" onClick={() => handlePainPointAnalysis(row.id, JSON.stringify(row.contact))}>
                                  <Search className="mr-2 h-4 w-4" />
                                  Analyze Pain Points
                                </Button>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <Trash2 className="h-4 w-4 text-destructive/70" />
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
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            No research history yet. Add a contact to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {/* Mobile Cards */}
                <div className="grid gap-4 md:hidden">
                    {history.length > 0 ? (
                        history.map(row => (
                            <Card key={row.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <CardTitle className="text-base truncate">{row.contact.name || 'Unnamed Contact'}</CardTitle>
                                            <CardDescription>{row.date} via {row.scrapeSource}</CardDescription>
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="-mr-2 -mt-2">
                                                    <Trash2 className="h-4 w-4 text-destructive/70" />
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
                                </CardHeader>
                                <CardContent className="grid gap-4 text-sm">
                                    <div className="flex flex-col gap-2">
                                        <h4 className="font-semibold">Contact Info</h4>
                                        <div className="flex flex-col gap-1.5 text-xs">
                                            {row.contact.emails && row.contact.emails.length > 0 && <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 flex-shrink-0" /> <div className="flex flex-wrap gap-x-2 gap-y-1">{row.contact.emails.map(e => <a key={e} href={`mailto:${e}`} className="text-primary hover:underline break-all">{e}</a>)}</div></div>}
                                            {row.contact.phoneNumbers && row.contact.phoneNumbers.length > 0 && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 flex-shrink-0" /> <div className="flex flex-wrap gap-x-2 gap-y-1">{row.contact.phoneNumbers.map(p => <a key={p} href={`tel:${p}`} className="text-primary hover:underline">{p}</a>)}</div></div>}
                                            {row.contact.socialMediaLinks && row.contact.socialMediaLinks.length > 0 && <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 flex-shrink-0" /><div className="flex flex-wrap gap-x-2 gap-y-1">{row.contact.socialMediaLinks.map(l => <a key={l} href={l} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{new URL(l).hostname.replace('www.','')}</a>)}</div></div>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <h4 className="font-semibold">Pain Point Analysis</h4>
                                        {row.isAnalyzingPainPoints ? (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Analyzing...</span>
                                            </div>
                                        ) : row.painPoints ? (
                                             <Accordion type="single" collapsible className="w-full">
                                                <AccordionItem value="item-1">
                                                    <AccordionTrigger>
                                                        <div className="flex gap-1.5 flex-wrap">
                                                            {row.painPoints.slice(0, 2).map((p, i) => (
                                                                <Badge key={i} variant="outline" className="cursor-pointer border-primary/50 text-primary hover:bg-primary/10">{p.category}</Badge>
                                                            ))}
                                                            {row.painPoints.length > 2 && <Badge variant="secondary">+{row.painPoints.length-2} more</Badge>}
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                    <div className="space-y-4">
                                                        {row.painPoints.map((p, i) => (
                                                        <div key={i} className="text-xs">
                                                            <p className="font-semibold text-primary">{p.category}: <span className="text-foreground font-normal">{p.description}</span></p>
                                                            <p className="font-semibold text-accent mt-1">Plan of Action: <span className="text-foreground font-normal">{p.suggestedService}</span></p>
                                                        </div>
                                                        ))}
                                                    </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        ) : (
                                            <Button variant="outline" size="sm" onClick={() => handlePainPointAnalysis(row.id, JSON.stringify(row.contact))}>
                                                <Search className="mr-2 h-4 w-4" />
                                                Analyze Pain Points
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                         <div className="h-24 text-center text-muted-foreground flex items-center justify-center border rounded-md">
                            No research history yet.
                        </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
