"use server";

import { analyzeClientPainPoints } from "@/ai/flows/analyze-client-pain-points";
import { marketResearchAnalysis } from "@/ai/flows/market-research-analysis";
import { scrapeWebsite } from "@/ai/flows/scrape-website";
import type { AnalyzeClientPainPointsOutput, MarketResearchAnalysisOutput, ScrapeWebsiteOutput, ScrapeWebsiteInput } from "@/ai/schemas";

type AnalysisResult = {
  success: boolean;
  data?: AnalyzeClientPainPointsOutput;
  error?: string;
};

export async function performAnalysis(clientData: string): Promise<AnalysisResult> {
  if (!clientData) {
    return { success: false, error: "Client data cannot be empty." };
  }

  try {
    const result = await analyzeClientPainPoints({ clientData });
    return { success: true, data: result };
  } catch (error) {
    console.error("AI analysis failed:", error);
    // Genkit can sometimes throw complex objects. Let's try to get a message.
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during analysis.";
    return { success: false, error: errorMessage };
  }
}

type MarketResearchResult = {
    success: boolean;
    data?: MarketResearchAnalysisOutput;
    error?: string;
};

export async function performMarketResearch(clientData: string): Promise<MarketResearchResult> {
    if (!clientData) {
        return { success: false, error: "Client data cannot be empty." };
    }

    try {
        const result = await marketResearchAnalysis({ clientData });
        return { success: true, data: result };
    } catch (error) {
        console.error("Market research analysis failed:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during market research.";
        return { success: false, error: errorMessage };
    }
}

type ScrapeResult = {
    success: boolean;
    data?: ScrapeWebsiteOutput;
    error?: string;
};

export async function performScrape(input: ScrapeWebsiteInput): Promise<ScrapeResult> {
    if (!input.query) {
        return { success: false, error: "Query cannot be empty." };
    }

    try {
        const result = await scrapeWebsite(input);
        if (result.content.startsWith('Failed to scrape content')) {
             return { success: false, error: result.content };
        }
        return { success: true, data: result };
    } catch (error) {
        console.error("Website scraping failed:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during scraping.";
        return { success: false, error: errorMessage };
    }
}
