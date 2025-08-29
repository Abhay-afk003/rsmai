"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, BrainCircuit, Search, Globe, MessageSquare, Newspaper, Users, User, Link as LinkIcon, Phone, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { performPainPointAnalysis, performScrape } from "@/app/actions";
import type { AnalyzeClientPainPointsOutput, ScrapeWebsiteInput, ScrapedResult } from "@/ai/schemas";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";

type ScrapeSource = "website" | "reddit" | "news" | "social";

type AnalysisHistoryItem = {
  id: string;
  date: string;
  scrapeQuery: string;
  scrapeSource: ScrapeSource;
  contact: ScrapedResult;
  isAnalyzingPainPoints?: boolean;
  painPoints?: AnalyzeClientPainPointsOutput["painPoints"];
};

const sourceConfig: Record<ScrapeSource, { label: string; placeholder: string; icon: React.ElementType }> = {
    website: { label: "ICP Details (Query)", placeholder: "e.g., 'marketing managers in tech startups'", icon: Globe },
    reddit: { label: "Topic/Subreddit", placeholder: "e.g., 'saas founders'", icon: MessageSquare },
    news: { label: "News Articles Query", placeholder: "e.g., 'companies seeking funding'", icon: Newspaper },
    social: { label: "Social Media Query", placeholder: "e.g., '#startup looking for developers'", icon: Users },
}

type ScrapedItem = ScrapedResult & { id: string };

export default function ClientAnalysisPage() {
  const [scrapeQuery, setScrapeQuery] = useState("");
  const [scrapeSource, setScrapeSource] = useState<ScrapeSource>("website");
  const [scrapedResults, setScrapedResults] = useState<ScrapedItem[]>([]);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [expandedMobile, setExpandedMobile] = useState<Record<string, boolean>>({});
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
  
  const toggleMobileExpand = (id: string) => {
    setExpandedMobile(prev => ({...prev, [id]: !prev[id]}));
  };

  const handleScrape = () => {
    if (!scrapeQuery.trim()) {
      toast({ title: "Input required", description: `Please enter a ${sourceConfig[scrapeSource].label}.`, variant: "destructive" });
      return;
    }

    setScrapedResults([]);
    const scrapeInput: ScrapeWebsiteInput = { source: scrapeSource, query: scrapeQuery };

    startScrapingTransition(async () => {
      const scrapeResult = await performScrape(scrapeInput);
      if (scrapeResult.success && scrapeResult.data) {
        setScrapedResults(scrapeResult.data.results.map(r => ({ ...r, id: new Date().toISOString() + Math.random() })));
        setScrapeQuery("");
        toast({
          title: "Scraping Complete",
          description: `${scrapeResult.data.results.length} contacts found.`,
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
      scrapeQuery: scrapeQuery,
      scrapeSource: scrapeSource,
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

  const downloadCSV = () => {
    if (history.length === 0) {
      toast({ title: "No data to download", description: "Please add a contact to history first.", variant: "destructive" });
      return;
    }
    const header = "Date,Source,Query,Name,Source URL,Summary,Emails,Phone Numbers,Social Media,Pain Points\n";
    const rows = history.map((row) => {
      const { contact, painPoints } = row;
      const date = row.date;
      const source = row.scrapeSource;
      const query = `"${row.scrapeQuery.replace(/"/g, '""')}"`;
      const name = `"${contact.name || ''}"`;
      const sourceUrl = `"${contact.sourceUrl}"`;
      const summary = `"${(contact.summary || "").replace(/"/g, '""')}"`;
      const emails = `"${(contact.emails || []).join(", ")}"`;
      const phones = `"${(contact.phoneNumbers || []).join(", ")}"`;
      const socials = `"${(contact.socialMediaLinks || []).join(", ")}"`;
      const painPointsStr = `"${(painPoints || []).map(p => `${p.category}: ${p.description}`).join("; ").replace(/"/g, '""')}"`;
      
      return [date, source, query, name, sourceUrl, summary, emails, phones, socials, painPointsStr].join(",");
    }).join("\n");

    const csvContent = header + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "rsm-contact-analysis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-4 items-end">
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
                                <SelectItem value="social"><div className="flex items-center gap-2"><Users className="h-4 w-4" /> Social Media</div></SelectItem>
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
                            disabled={isPending}
                        />
                    </div>
                    
                    <Button onClick={handleScrape} disabled={isPending} className="w-full md:w-auto">
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
                                    <AccordionTrigger>
                                        <div className="flex justify-between items-center w-full pr-4">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                <span className="truncate text-left font-semibold">{result.name || "Unnamed Contact"}</span>
                                            </div>
                                            <Button size="sm" onClick={(e) => { e.stopPropagation(); handleAddToHistory(result); }}>
                                                Add to History
                                            </Button>
                                        </div>
                                    </AccordionTrigger>
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
                <Button onClick={downloadCSV} variant="outline" size="sm" disabled={history.length === 0} className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
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
                        <TableHead>Pain Points</TableHead>
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
                                <div className="flex gap-1.5 flex-wrap max-w-md">
                                {row.painPoints.map((p, i) => (
                                  <Tooltip key={i}>
                                    <TooltipTrigger>
                                      <Badge variant="outline" className="cursor-default border-primary/50 text-primary hover:bg-primary/10">{p.category}</Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-card border-border p-4 max-w-sm">
                                      <p className="text-card-foreground whitespace-pre-wrap break-words">{p.description}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                               </div>
                              ) : (
                                <Button variant="outline" size="sm" onClick={() => handlePainPointAnalysis(row.id, row.contact.summary)}>
                                  <Search className="mr-2 h-4 w-4" />
                                  Analyze Pain Points
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            {isAnalyzing ? (
                                <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span>Analyzing...</span>
                                </div>
                            ) : "No research history yet."}
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
                                    <CardTitle className="text-base truncate">{row.contact.name || 'Unnamed Contact'}</CardTitle>
                                    <CardDescription>{row.date}</CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4 text-sm">
                                    { (isAnalyzing && !row.painPoints && row.isAnalyzingPainPoints) ? (
                                        <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>Analyzing...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex flex-col gap-2">
                                                <h4 className="font-semibold">Contact Info</h4>
                                                <div className="flex flex-col gap-1.5 text-xs">
                                                    {row.contact.emails && row.contact.emails.length > 0 && <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> <div className="flex flex-wrap gap-x-2 gap-y-1">{row.contact.emails.map(e => <a key={e} href={`mailto:${e}`} className="text-primary hover:underline">{e}</a>)}</div></div>}
                                                    {row.contact.phoneNumbers && row.contact.phoneNumbers.length > 0 && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> <div className="flex flex-wrap gap-x-2 gap-y-1">{row.contact.phoneNumbers.map(p => <a key={p} href={`tel:${p}`} className="text-primary hover:underline">{p}</a>)}</div></div>}
                                                    {row.contact.socialMediaLinks && row.contact.socialMediaLinks.length > 0 && <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /><div className="flex flex-wrap gap-x-2 gap-y-1">{row.contact.socialMediaLinks.map(l => <a key={l} href={l} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{new URL(l).hostname.replace('www.','')}</a>)}</div></div>}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <h4 className="font-semibold">Pain Points</h4>
                                                {row.isAnalyzingPainPoints ? (
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        <span>Analyzing...</span>
                                                    </div>
                                                ) : row.painPoints ? (
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {row.painPoints.map((p, i) => (
                                                            <Tooltip key={i}>
                                                                <TooltipTrigger>
                                                                    <Badge variant="outline" className="cursor-default border-primary/50 text-primary hover:bg-primary/10">{p.category}</Badge>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="bg-card border-border p-4 max-w-xs">
                                                                    <p className="text-card-foreground whitespace-pre-wrap break-words">{p.description}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <Button variant="outline" size="sm" onClick={() => handlePainPointAnalysis(row.id, row.contact.summary)}>
                                                        <Search className="mr-2 h-4 w-4" />
                                                        Analyze Pain Points
                                                    </Button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="h-24 text-center text-muted-foreground flex items-center justify-center">
                            {isAnalyzing ? (
                                <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span>Analyzing...</span>
                                </div>
                            ) : "No research history yet."}
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
