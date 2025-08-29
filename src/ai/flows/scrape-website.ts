'use server';
/**
 * @fileOverview Scrapes a website to extract its text content.
 *
 * - scrapeWebsite - A function that handles scraping a website.
 */

import {ai} from '@/ai/genkit';
import { ScrapeWebsiteInput, ScrapeWebsiteInputSchema, ScrapeWebsiteMultiOutput, ScrapeWebsiteMultiOutputSchema } from '@/ai/schemas';

const scrapeAndSummarizePrompt = ai.definePrompt({
    name: 'scrapeAndSummarize',
    input: { schema: ScrapeWebsiteInputSchema },
    output: { schema: ScrapeWebsiteMultiOutputSchema },
    prompt: `You are a web scraping and summarization expert. Your task is to perform a search based on the user's query and source, and then provide a list of relevant results with summaries.

    1. Construct the appropriate search URL.
        - For Reddit, use: https://www.reddit.com/r/\{query\}/hot.json
        - For News, use a Google News search: https://www.google.com/search?q=\{query\}&tbm=nws
        - For Social Media, use a Google search: https://www.google.com/search?q=\{query\}
        - For Web & Public Data, use a Google search: https://www.google.com/search?q=\{query\}

    2. Fetch the content from the URL.

    3. Parse the content to identify up to 10 distinct, relevant results.
        - For Reddit, each post is a result.
        - For Google search, each search result is a result.

    4. For each result, extract the following:
        - A concise title.
        - The direct URL to the result.
        - A brief, informative summary of the content.

    5. Format the output as a JSON object that adheres to the ScrapeWebsiteMultiOutputSchema.

    Source: {{{source}}}
    Query: {{{query}}}
    `,
});


const scrapeWebsiteFlow = ai.defineFlow(
  {
    name: 'scrapeWebsiteFlow',
    inputSchema: ScrapeWebsiteInputSchema,
    outputSchema: ScrapeWebsiteMultiOutputSchema,
  },
  async (input) => {
    const { output } = await scrapeAndSummarizePrompt(input);
    return output || { results: [] };
  }
);


export async function scrapeWebsite(input: ScrapeWebsiteInput): Promise<ScrapeWebsiteMultiOutput> {
    return scrapeWebsiteFlow(input);
}
