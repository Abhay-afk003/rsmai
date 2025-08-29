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
            url: z.string().url().describe("The URL to scrape. For Reddit, it should point to a subreddit's JSON endpoint (e.g., https://www.reddit.com/r/subreddit/hot.json). For other sources, it can be a direct URL or a search engine results page URL."),
            source: z.enum(["website", "reddit", "news", "social"]).describe("The type of content being scraped."),
            query: z.string().optional().describe("The original search query, if applicable.")
        }),
        outputSchema: z.object({
            content: z.string(),
        }),
    },
    async (input) => {
        try {
            // A more robust solution would use a dedicated search API for news/social.
            // For now, we'll construct a basic search URL for these.
            let urlToFetch = input.url;
            if (input.source === 'news' && input.query) {
                 urlToFetch = `https://www.google.com/search?q=${encodeURIComponent(input.query)}&tbm=nws`;
            } else if (input.source === 'social' && input.query) {
                 urlToFetch = `https://www.google.com/search?q=${encodeURIComponent(input.query)}`; // A generic search for social media content.
            }


            const response = await fetch(urlToFetch);
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
            return { content: `Failed to scrape content for source "${input.source}" with query "${input.query || input.url}". Please check your input and try again.` };
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
    // The tool expects a URL. For non-URL based queries, we need to construct one.
    // For Reddit, we create the .json URL.
    // For others, we'll pass a placeholder and let the tool create a search URL.
    let url = input.query || '';
    if (input.source === 'reddit' && input.query) {
        url = `https://www.reddit.com/r/${input.query}/hot.json`;
    } else if (input.source === 'website' && input.query) {
        // Assume query is a URL for website source
        url = input.query;
    } else {
        // For news and social, we pass a placeholder URL as the tool constructs the real one
        url = 'https://www.google.com';
    }


    try {
        new URL(url); // Validate the constructed or provided URL
    } catch {
        return { content: `Invalid URL or query for scraping: ${url}` };
    }

    const {output} = await scrapeTool({url, source: input.source, query: input.query});
    return output!;
  }
);


export async function scrapeWebsite(input: ScrapeWebsiteInput): Promise<ScrapeWebsiteOutput> {
    return scrapeWebsiteFlow(input);
}
