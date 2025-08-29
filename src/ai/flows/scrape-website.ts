'use server';
/**
 * @fileOverview Scrapes a website to extract its text content.
 *
 * - scrapeWebsite - A function that handles scraping a website.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ScrapeWebsiteInput, ScrapeWebsiteInputSchema, ScrapeWebsiteOutput, ScrapeWebsiteOutputSchema } from '@/ai/schemas';

const scrapeTool = ai.defineTool(
    {
        name: 'extractTextFromWeb',
        description: 'Extracts the text content from a given URL.',
        inputSchema: z.object({
            url: z.string().url(),
        }),
        outputSchema: z.object({
            content: z.string(),
        }),
    },
    async (input) => {
        try {
            const response = await fetch(input.url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            // This is a very basic way to "scrape". 
            // A more robust solution would use a library like Cheerio to parse HTML.
            // For now, we'll strip HTML tags.
            const textContent = html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
            return { content: textContent };
        } catch (error) {
            console.error("Error scraping website:", error);
            // Let the LLM know the scrape failed.
            return { content: `Failed to scrape the website at ${input.url}. Please check the URL and try again.` };
        }
    }
);


const scrapeWebsiteFlow = ai.defineFlow(
  {
    name: 'scrapeWebsiteFlow',
    inputSchema: ScrapeWebsiteInputSchema,
    outputSchema: ScrapeWebsiteOutputSchema,
    tools: [scrapeTool],
  },
  async (input) => {
    const {output} = await scrapeTool(input);
    return output!;
  }
);


export async function scrapeWebsite(input: ScrapeWebsiteInput): Promise<ScrapeWebsiteOutput> {
    return scrapeWebsiteFlow(input);
}
