"use server";

import { analyzeClientPainPoints } from "@/ai/flows/analyze-client-pain-points";
import { scrapeWebsite } from "@/ai/flows/scrape-website";
import type { AnalyzeClientPainPointsOutput, ScrapeWebsiteMultiOutput, ScrapeWebsiteInput } from "@/ai/schemas";

type PainPointAnalysisResult = {
  success: boolean;
  data?: AnalyzeClientPainPointsOutput;
  error?: string;
};

export async function performPainPointAnalysis(clientData: string): Promise<PainPointAnalysisResult> {
  if (!clientData) {
    return { success: false, error: "Client data cannot be empty." };
  }

  try {
    const result = await analyzeClientPainPoints({ clientData });
    return { success: true, data: result };
  } catch (error) {
    console.error("AI analysis failed:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during analysis.";
    return { success: false, error: errorMessage };
  }
}

type ScrapeResult = {
    success: boolean;
    data?: ScrapeWebsiteMultiOutput;
    error?: string;
};

export async function performScrape(input: ScrapeWebsiteInput): Promise<ScrapeResult> {
    if (!input.query) {
        return { success: false, error: "Query cannot be empty." };
    }

    try {
        const result = await scrapeWebsite(input);
        if (!result.results || result.results.length === 0) {
             return { success: false, error: "Scraping did not return any results." };
        }
        return { success: true, data: result };
    } catch (error) {
        console.error("Website scraping failed:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during scraping.";
        return { success: false, error: errorMessage };
    }
}
