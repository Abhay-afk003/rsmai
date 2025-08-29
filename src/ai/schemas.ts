/**
 * @fileOverview This file contains all the Zod schemas and TypeScript types for the AI flows.
 */
import {z} from 'genkit';

// Schemas for analyze-client-pain-points.ts
export const AnalyzeClientPainPointsInputSchema = z.object({
  clientData: z
    .string()
    .describe('The scraped client data to analyze.'),
});
export type AnalyzeClientPainPointsInput = z.infer<typeof AnalyzeClientPainPointsInputSchema>;

export const AnalyzeClientPainPointsOutputSchema = z.object({
  painPoints: z.array(
    z.object({
      category: z.string().describe('The category of the pain point.'),
      description: z.string().describe('A detailed description of the pain point.'),
    })
  ).describe('The identified pain points categorized by category and description.'),
});
export type AnalyzeClientPainPointsOutput = z.infer<typeof AnalyzeClientPainPointsOutputSchema>;


// Schemas for market-research-analysis.ts
export const MarketResearchAnalysisInputSchema = z.object({
  clientData: z
    .string()
    .describe('The client data to perform market research on.'),
});
export type MarketResearchAnalysisInput = z.infer<typeof MarketResearchAnalysisInputSchema>;

export const MarketResearchAnalysisOutputSchema = z.object({
  researchSummary: z
    .string()
    .describe('A summary of the market research findings.'),
});
export type MarketResearchAnalysisOutput = z.infer<typeof MarketResearchAnalysisOutputSchema>;


// Schemas for scrape-website.ts
export const ScrapeWebsiteInputSchema = z.object({
  source: z.enum(["website", "reddit", "news", "social"]).describe("The data source to scrape from."),
  query: z.string().describe("The search query, subreddit, or URL to scrape."),
});
export type ScrapeWebsiteInput = z.infer<typeof ScrapeWebsiteInputSchema>;

export const ScrapedResultSchema = z.object({
  title: z.string().describe("The title of the scraped result."),
  url: z.string().url().describe("The URL of the scraped result."),
  summary: z.string().describe("A brief summary of the result's content."),
});
export type ScrapedResult = z.infer<typeof ScrapedResultSchema>;


export const ScrapeWebsiteMultiOutputSchema = z.object({
    results: z.array(ScrapedResultSchema).describe("An array of scraped results, each with a title, url, and summary."),
});
export type ScrapeWebsiteMultiOutput = z.infer<typeof ScrapeWebsiteMultiOutputSchema>;

export const ScrapeWebsiteOutputSchema = z.object({
  content: z.string().describe('The text content of the website.'),
});
export type ScrapeWebsiteOutput = z.infer<typeof ScrapeWebsiteOutputSchema>;
