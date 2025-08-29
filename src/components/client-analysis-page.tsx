"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, BrainCircuit } from "lucide-react";
import { performAnalysis } from "@/app/actions";
import type { AnalyzeClientPainPointsOutput } from "@/ai/flows/analyze-client-pain-points";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type AnalysisResult = {
  id: string;
  date: string;
  clientData: string;
  socialsMissing: string[];
  painPoints: AnalyzeClientPainPointsOutput["painPoints"];
  feedback: string;
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

export default function ClientAnalysisPage() {
  const [scrapedData, setScrapedData] = useState("");
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [isPending, startTransition] = useTransition();
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

  const handleAnalysis = () => {
    if (!scrapedData.trim()) {
      toast({
        title: "Input required",
        description: "Please paste some client data to analyze.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
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

  const downloadCSV = () => {
    if (history.length === 0) {
      toast({
        title: "No data to download",
        description: "Please run an analysis first.",
        variant: "destructive"
      });
      return;
    }
    const header = "Count,Date,Client Details,Socials Missing,Pain Points,Feedback\n";
    const rows = history.map((row, index) => {
      const count = history.length - index;
      const date = row.date;
      const clientDetails = `"${row.clientData.replace(/"/g, '""')}"`;
      const socialsMissing = row.socialsMissing.join(", ");
      const painPoints = `"${row.painPoints.map(p => `${p.category}: ${p.description}`).join("; ").replace(/"/g, '""')}"`;
      const feedback = `"${row.feedback.replace(/"/g, '""')}"`;
      return [count, date, clientDetails, socialsMissing, painPoints, feedback].join(",");
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
                  Paste scraped client data (e.g., from forums, social media) below to analyze their pain points.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Paste client data here..."
                  className="min-h-[150px] text-sm"
                  value={scrapedData}
                  onChange={(e) => setScrapedData(e.target.value)}
                  disabled={isPending}
                />
              </CardContent>
              <CardFooter>
                <Button onClick={handleAnalysis} disabled={isPending || !scrapedData.trim()}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Pain Points"
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
                        <TableHead>Client Details</TableHead>
                        <TableHead>Socials Missing</TableHead>
                        <TableHead>Pain Points</TableHead>
                        <TableHead className="w-[100px]">Feedback</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isPending && (
                          <TableRow>
                              <TableCell colSpan={6} className="h-24">
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
                            <TableCell className="max-w-xs truncate">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="cursor-pointer hover:underline">{row.clientData}</span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-md bg-card border-border p-4">
                                        <p className="text-card-foreground">{row.clientData}</p>
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
                                    <TooltipContent className="bg-card border-border p-4">
                                      <p className="text-card-foreground">{p.description}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                               </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{row.feedback}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        !isPending && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
