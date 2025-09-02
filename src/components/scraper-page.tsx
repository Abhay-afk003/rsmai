"use client";

import React, { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BrainCircuit, User, Link as LinkIcon, Phone, Mail, Users, Globe, MessageSquare, Newspaper, Instagram, Facebook, Linkedin, Youtube, ArrowRight } from "lucide-react";
import { performScrape } from "@/app/actions";
import type { ScrapeWebsiteInput, ScrapedResult } from "@/ai/schemas";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { AnalysisHistoryItem } from "./market-research-page";

type ScrapeSource = ScrapeWebsiteInput["source"];

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

export default function ScraperPage() {
  const [scrapeQuery, setScrapeQuery] = useState("");
  const [scrapeLocation, setScrapeLocation] = useState("");
  const [scrapeSource, setScrapeSource] = useState<ScrapeSource>("website");
  const [scrapedResults, setScrapedResults] = useState<ScrapedItem[]>([]);
  const [isScraping, startScrapingTransition] = useTransition();
  const [historyCount, setHistoryCount] = useState(0);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedHistory = sessionStorage.getItem("analysisHistory");
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        setHistoryCount(parsedHistory.length);
      }
    } catch (error) {
        console.error("Failed to parse history from sessionStorage", error);
        sessionStorage.removeItem("analysisHistory");
    }
  }, []);

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

  const handleAddToHistory = (result: ScrapedItem) => {
    let currentHistory: AnalysisHistoryItem[] = [];
    try {
        const storedHistory = sessionStorage.getItem("analysisHistory");
        if (storedHistory) {
            currentHistory = JSON.parse(storedHistory);
        }
    } catch (error) {
        console.error("Failed to parse history, starting fresh.", error);
        currentHistory = [];
    }
    
    const newHistoryItem: AnalysisHistoryItem = {
      id: result.id,
      date: new Date().toLocaleDateString(),
      scrapeQuery: scrapeQuery || "N/A",
      scrapeSource: scrapeSource,
      ...(scrapeLocation.trim() && { scrapeLocation: scrapeLocation.trim() }),
      contact: result,
    };

    const updatedHistory = [newHistoryItem, ...currentHistory];

    try {
        sessionStorage.setItem("analysisHistory", JSON.stringify(updatedHistory));
        setHistoryCount(updatedHistory.length);
    } catch (error) {
        toast({ title: "Error", description: "Could not save to research history.", variant: "destructive"});
        return;
    }

    setScrapedResults(prev => prev.filter(r => r.id !== result.id));
    toast({
      title: "Contact Added",
      description: `${result.name || 'Unnamed contact'} has been added to Market Research.`,
    });
    router.push('/market-research');
  };

  const currentSourceConfig = sourceConfig[scrapeSource];
  const isPending = isScraping;

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b shrink-0">
        <BrainCircuit className="h-6 w-6 text-primary" />
        <h1 className="ml-2 text-lg font-semibold">Scraper</h1>
      </header>

      <main className="flex-1 p-4 md:p-8 lg:p-12 space-y-8 overflow-y-auto">
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
            {historyCount > 0 && (
                <div className="flex justify-end">
                    <Button onClick={() => router.push('/market-research')}>
                        Go to Market Research ({historyCount} contacts)
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
