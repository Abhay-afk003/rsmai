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

export const PainPointSchema = z.object({
  category: z.string().describe('The category of the pain point.'),
  description: z.string().describe('A direct, concise description of the pain point that can be used in a conversation.'),
  suggestedService: z.string().describe('The specific digital marketing service that can be pitched to solve this pain point.')
});
export type PainPoint = z.infer<typeof PainPointSchema>;


export const AnalyzeClientPainPointsOutputSchema = z.object({
  painPoints: z.array(PainPointSchema).describe('The identified pain points categorized by category and description.'),
});
export type AnalyzeClientPainPointsOutput = z.infer<typeof AnalyzeClientPainPointsOutputSchema>;


// Schemas for scrape-website.ts
export const ScrapeWebsiteInputSchema = z.object({
  source: z.enum(["website", "reddit", "news", "instagram", "facebook", "linkedin", "youtube"]).describe("The data source to scrape from."),
  query: z.string().describe("The search query or topic to find contacts for."),
  location: z.string().optional().describe("An optional specific location (city, state, country) to narrow down the search."),
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

// Schemas for craft-outreach-reply.ts
export const CraftOutreachReplyInputSchema = z.object({
    platform: z.enum(['email', 'whatsapp']),
    contact: ScrapedResultSchema,
    painPoints: z.array(PainPointSchema),
});
export type CraftOutreachReplyInput = z.infer<typeof CraftOutreachReplyInputSchema>;

export const CraftOutreachReplyOutputSchema = z.object({
    message: z.string().describe("The generated outreach message, formatted for the specified platform."),
});
export type CraftOutreachReplyOutput = z.infer<typeof CraftOutreachReplyOutputSchema>;
