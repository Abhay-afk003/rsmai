/**
 * @fileOverview This file contains all the Zod schemas and TypeScript types for the AI flows.
 */
import {z} from 'genkit';

// Schemas for analyze-client-pain-points.ts
export const AnalyzeClientPainPointsInputSchema = z.object({
  clientData: z
    .string()
    .describe('The scraped client data to analyze for pain points.'),
});
export type AnalyzeClientPainPointsInput = z.infer<typeof AnalyzeClientPainPointsInputSchema>;

export const AnalyzeClientPainPointsOutputSchema = z.object({
  painPoints: z.array(
    z.object({
      category: z.string().describe('The category of the pain point.'),
      description: z.string().describe('A direct, concise description of the pain point that can be used in a conversation.'),
    })
  ).describe('The identified pain points categorized by category and description.'),
});
export type AnalyzeClientPainPointsOutput = z.infer<typeof AnalyzeClientPainPointsOutputSchema>;


// Schemas for scrape-website.ts
export const ScrapeWebsiteInputSchema = z.object({
  source: z.enum(["website", "reddit", "news", "social"]).describe("The data source to scrape from."),
  query: z.string().describe("The search query or topic to find contacts for."),
});
export type ScrapeWebsiteInput = z.infer<typeof ScrapeWebsiteInputSchema>;

export const ScrapedResultSchema = z.object({
  name: z.string().optional().describe("The full name of the person or company."),
  sourceUrl: z.string().url().describe("The URL where the information was found."),
  summary: z.string().describe("A brief summary of the available information about the contact."),
  socialMediaLinks: z.array(z.string().url()).optional().describe("Associated social media profile URLs."),
  phoneNumbers: z.array(z.string()).optional().describe("Contact phone numbers."),
  emails: z.array(z.string().email()).optional().describe("Contact email addresses."),
});
export type ScrapedResult = z.infer<typeof ScrapedResultSchema>;


export const ScrapeWebsiteMultiOutputSchema = z.object({
    results: z.array(ScrapedResultSchema).describe("An array of scraped contact results."),
});
export type ScrapeWebsiteMultiOutput = z.infer<typeof ScrapeWebsiteMultiOutputSchema>;