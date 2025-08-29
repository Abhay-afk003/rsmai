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
        description: 'Extracts the text content from a given URL. This can be a general website, a Reddit URL, or a search results page.',
        inputSchema: z.object({
            url: z.string().url().describe("The URL to scrape. For Reddit, it should point to a subreddit's JSON endpoint (e.g., https://www.reddit.com/r/subreddit/hot.json). For other sources, it should be a Google search URL."),
            source: z.enum(["website", "reddit", "news", "social"]).describe("The type of content being scraped."),
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
            const data = await response.text();

            if (input.source === 'reddit') {
                // For reddit, we just pass the JSON as a string for now.
                 return { content: data };
            }
            
            // For other web content, we strip HTML tags.
            // A more robust solution would use a library like Cheerio to parse HTML.
            const textContent = data.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
            return { content: textContent };

        } catch (error) {
            console.error("Error scraping website:", error);
            // Let the LLM know the scrape failed.
            return { content: `Failed to scrape content for source "${input.source}" from url "${input.url}". Please check your input and try again.` };
        }
    }
);


const scrapeWebsiteFlow = ai.defineFlow(
  {
    name: 'scrapeWebsiteFlow',
    inputSchema: ScrapeWebsiteInputSchema,
    outputSchema: ScrapeWebsiteOutputSchema,
  },
  async (input) => {
    let url;

    if (input.source === 'reddit') {
        url = `https://www.reddit.com/r/${input.query}/hot.json`;
    } else if (input.source === 'news') {
        url = `https://www.google.com/search?q=${encodeURIComponent(input.query)}&tbm=nws`;
    } else { // 'website' and 'social'
        url = `https://www.google.com/search?q=${encodeURIComponent(input.query)}`;
    }

    try {
        new URL(url); // Validate the constructed URL
    } catch {
        return { content: `Invalid URL constructed for scraping: ${url}` };
    }

    const {output} = await scrapeTool({url, source: input.source});
    
    // Ensure we always return a valid object.
    return output || { content: `Scraping failed for source "${input.source}" with query "${input.query}". The tool did not return any content.` };
  }
);


export async function scrapeWebsite(input: ScrapeWebsiteInput): Promise<ScrapeWebsiteOutput> {
    return scrapeWebsiteFlow(input);
}
