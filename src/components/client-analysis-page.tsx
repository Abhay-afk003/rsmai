"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, BrainCircuit, Search, Link as LinkIcon, Globe, MessageSquare, Newspaper, Users } from "lucide-react";
import { performAnalysis, performMarketResearch, performScrape } from "@/app/actions";
import type { AnalyzeClientPainPointsOutput, ScrapeWebsiteInput } from "@/ai/schemas";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ScrapeSource = "website" | "reddit" | "news" | "social";

type AnalysisResult = {
  id: string;
  date: string;
  scrapedUrl?: string;
  scrapeQuery?: string;
  scrapeSource?: ScrapeSource;
  clientData: string;
  socialsMissing: string[];
  painPoints: AnalyzeClientPainPointsOutput["painPoints"];
  feedback: string;
  marketResearch?: string;
  isResearching?: boolean;
};

const socialChecks: { name: string; regex: RegExp }[] = [
  { name: "Email", regex: /\S+@\S+\.\S+/ },
  { name: "Twitter", regex: /twitter\.com/ },
  { name: "LinkedIn", regex: /linkedin\.com/ },
];

function getMissingSocials(text: string): string[] {
  const missing: string[] = [];
  socialChecks.forEach(social => {
    if (!social.regex.test(text)) {
      missing.push(social.name);
    }
  });
  return missing;
}

const sourceConfig: Record<ScrapeSource, { label: string; placeholder: string; icon: React.ElementType }> = {
    website: { label: "ICP Details (Query)", placeholder: "e.g., 'small business marketing tools'", icon: Globe },
    reddit: { label: "Subreddit", placeholder: "e.g., programming", icon: MessageSquare },
    news: { label: "News Articles Query", placeholder: "e.g., AI in healthcare", icon: Newspaper },
    social: { label: "Social Media Query", placeholder: "e.g., #customerfeedback", icon: Users },
}

export default function ClientAnalysisPage() {
  const [scrapedData, setScrapedData] = useState("");
  const [scrapeQuery, setScrapeQuery] = useState("");
  const [scrapeSource, setScrapeSource] = useState<ScrapeSource>("website");
  const [history, setHistory] = useState<AnalysisResult[]>([]);
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

  const handleScrapeAndAnalyze = () => {
    if (!scrapeQuery.trim()) {
      toast({ title: "Input required", description: `Please enter a ${sourceConfig[scrapeSource].label}.`, variant: "destructive" });
      return;
    }

    let scrapedContent = "";
    const scrapeInput: ScrapeWebsiteInput = { source: scrapeSource, query: scrapeQuery };

    startScrapingTransition(async () => {
      const scrapeResult = await performScrape(scrapeInput);
      if (scrapeResult.success && scrapeResult.data) {
        scrapedContent = scrapeResult.data.content;
        
        setScrapedData(scrapedContent);
        toast({
          title: "Scraping Complete",
          description: "Content has been extracted.",
        });

        startAnalyzingTransition(async () => {
          const analysisResult = await performAnalysis(scrapedContent);
          if (analysisResult.success && analysisResult.data) {
            const newResult: AnalysisResult = {
              id: new Date().toISOString(),
              date: new Date().toLocaleDateString(),
              scrapedUrl: undefined, // We are not using URL anymore for 'website'
              scrapeQuery: scrapeQuery,
              scrapeSource: scrapeSource,
              clientData: scrapedContent,
              socialsMissing: getMissingSocials(scrapedContent),
              painPoints: analysisResult.data.painPoints,
              feedback: "N/A",
            };
            setHistory(prev => [newResult, ...prev]);
            setScrapedData("");
            setScrapeQuery("");
            toast({
              title: "Analysis Complete",
              description: "Pain points have been identified and added to history.",
            });
          } else {
            toast({
              title: "Analysis Failed",
              description: analysisResult.error || "An unknown error occurred.",
              variant: "destructive",
            });
          }
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

  const handleManualAnalysis = () => {
    if (!scrapedData.trim()) {
      toast({
        title: "Input required",
        description: "Please paste some client data to analyze.",
        variant: "destructive",
      });
      return;
    }

    startAnalyzingTransition(async () => {
      const result = await performAnalysis(scrapedData);
      if (result.success && result.data) {
        const newResult: AnalysisResult = {
          id: new Date().toISOString(),
          date: new Date().toLocaleDateString(),
          clientData: scrapedData,
          socialsMissing: getMissingSocials(scrapedData),
          painPoints: result.data.painPoints,
          feedback: "N/A",
        };
        setHistory(prev => [newResult, ...prev]);
        setScrapedData("");
        toast({
          title: "Analysis Complete",
          description: "Pain points have been identified and added to history.",
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: result.error || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    });
  };


  const handleMarketResearch = (id: string, clientData: string) => {
    setHistory(prev => prev.map(item => item.id === id ? { ...item, isResearching: true } : item));

    startAnalyzingTransition(async () => {
        const result = await performMarketResearch(clientData);
        if (result.success && result.data) {
            setHistory(prev => prev.map(item => item.id === id ? { ...item, marketResearch: result.data!.researchSummary, isResearching: false } : item));
            toast({
                title: "Market Research Complete",
                description: "Market research has been added to the analysis.",
            });
        } else {
            setHistory(prev => prev.map(item => item.id === id ? { ...item, isResearching: false } : item));
            toast({
                title: "Market Research Failed",
                description: result.error || "An unknown error occurred.",
                variant: "destructive",
            });
        }
    });
  };

  const downloadCSV = () => {
    if (history.length === 0) {
      toast({
        title: "No data to download",
        description: "Please run an analysis first.",
        variant: "destructive"
      });
      return;
    }
    const header = "Count,Date,Source,Query/URL,Client Details,Socials Missing,Pain Points,Market Research,Feedback\n";
    const rows = history.map((row, index) => {
      const count = history.length - index;
      const date = row.date;
      const source = row.scrapeSource || 'manual';
      const queryOrUrl = `"${row.scrapedUrl || row.scrapeQuery || ''}"`;
      const clientDetails = `"${row.clientData.replace(/"/g, '""')}"`;
      const socialsMissing = row.socialsMissing.join(", ");
      const painPoints = `"${row.painPoints.map(p => `${p.category}: ${p.description}`).join("; ").replace(/"/g, '""')}"`;
      const marketResearch = `"${(row.marketResearch || "").replace(/"/g, '""')}"`;
      const feedback = `"${row.feedback.replace(/"/g, '""')}"`;
      return [count, date, source, queryOrUrl, clientDetails, socialsMissing, painPoints, marketResearch, feedback].join(",");
    }).reverse().join("\n");

    const csvContent = header + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "rsm-insights-analysis.csv");
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
                <CardTitle>Client Data Analysis</CardTitle>
                <CardDescription>
                  Scrape data from various sources based on your Ideal Customer Profile (ICP), or paste it manually to analyze pain points.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-2 items-end">
                    <div>
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

                    <div>
                         <label htmlFor="query-input" className="text-sm font-medium">{currentSourceConfig.label}</label>
                         <Input 
                            id="query-input"
                            placeholder={currentSourceConfig.placeholder}
                            value={scrapeQuery}
                            onChange={(e) => setScrapeQuery(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                    
                    <Button onClick={handleScrapeAndAnalyze} disabled={isPending}>
                      {isScraping ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scraping...
                        </>
                      ) : isAnalyzing ? (
                         <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      )
                      : (
                        "Scrape & Analyze"
                      )}
                    </Button>
                </div>
                <div className="flex items-center gap-4">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">OR</span>
                    <Separator className="flex-1" />
                </div>
                <Textarea
                  placeholder="Paste client data here..."
                  className="min-h-[150px] text-sm"
                  value={scrapedData}
                  onChange={(e) => setScrapedData(e.target.value)}
                  disabled={isPending}
                />
              </CardContent>
              <CardFooter>
                <Button onClick={handleManualAnalysis} disabled={isPending || !scrapedData.trim()}>
                  {isAnalyzing && !isScraping ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Pasted Text"
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Research History</CardTitle>
                  <CardDescription>
                    A log of all your past analyses. Results are saved in your browser session.
                  </CardDescription>
                </div>
                <Button onClick={downloadCSV} variant="outline" size="sm" disabled={history.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead className="w-[100px]">Date</TableHead>
                        <TableHead>Client Details / Source</TableHead>
                        <TableHead>Socials Missing</TableHead>
                        <TableHead>Pain Points</TableHead>
                        <TableHead>Market Research</TableHead>
                        <TableHead className="w-[100px]">Feedback</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isAnalyzing && (
                          <TableRow>
                              <TableCell colSpan={7} className="h-24">
                                  <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                      <Loader2 className="h-6 w-6 animate-spin" />
                                      <span>Analyzing new entry...</span>
                                  </div>
                              </TableCell>
                          </TableRow>
                      )}
                      {history.length > 0 ? (
                        history.map((row, index) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{history.length - index}</TableCell>
                            <TableCell>{row.date}</TableCell>
                            <TableCell className="max-w-xs">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="truncate flex items-center gap-2 cursor-pointer hover:underline">
                                            {row.scrapeSource && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span>{React.createElement(sourceConfig[row.scrapeSource].icon, { className: "h-4 w-4 shrink-0" })}</span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{row.scrapeSource}</TooltipContent>
                                                </Tooltip>
                                            )}
                                            <span className="truncate">{row.scrapedUrl || row.scrapeQuery || row.clientData}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-md bg-card border-border p-4">
                                        {row.scrapeSource && <p className="font-bold mb-2 break-all">{row.scrapeQuery || row.scrapedUrl}</p>}
                                        <p className="text-card-foreground whitespace-pre-wrap break-words">{row.clientData}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {row.socialsMissing.length > 0 ? row.socialsMissing.map(s => <Badge key={s} variant="secondary">{s}</Badge>) : <span className="text-muted-foreground text-xs">All found</span>}
                              </div>
                            </TableCell>
                            <TableCell>
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
                            </TableCell>
                            <TableCell>
                              {row.isResearching ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Researching...</span>
                                </div>
                              ) : row.marketResearch ? (
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="cursor-pointer hover:underline max-w-xs truncate block">{row.marketResearch}</span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-md bg-card border-border p-4">
                                        <p className="text-card-foreground whitespace-pre-wrap break-words">{row.marketResearch}</p>
                                    </TooltipContent>
                                </Tooltip>
                              ) : (
                                <Button variant="outline" size="sm" onClick={() => handleMarketResearch(row.id, row.clientData)}>
                                  <Search className="mr-2 h-4 w-4" />
                                  Research
                                </Button>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{row.feedback}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        !isAnalyzing && (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                            No analysis history yet.
                          </TableCell>
                        </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
