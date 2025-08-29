'use server';
/**
 * @fileOverview Scrapes websites to extract contact information.
 *
 * - scrapeWebsite - A function that handles scraping a website for contact details.
 */

import {ai} from '@/ai/genkit';
import { ScrapeWebsiteInput, ScrapeWebsiteInputSchema, ScrapeWebsiteMultiOutput, ScrapeWebsiteMultiOutputSchema } from '@/ai/schemas';

const scrapeAndExtractPrompt = ai.definePrompt({
    name: 'scrapeAndExtract',
    input: { schema: ScrapeWebsiteInputSchema },
    output: { schema: ScrapeWebsiteMultiOutputSchema },
    prompt: `You are an expert data scraper specializing in finding contact information. Your task is to perform a search based on the user's query and source, and then extract key contact details for up to 10 relevant individuals or companies.

    1. Construct the appropriate search URL.
        - For Reddit, use: https://www.reddit.com/search/?q=\{query\}
        - For News, use a Google News search: https://www.google.com/search?q=\{query\}&tbm=nws
        - For Social Media, use a Google search for profiles: https://www.google.com/search?q=\{query\} social media profile
        - For Web & Public Data, use a standard Google search: https://www.google.com/search?q=\{query\}

    2. Fetch content from the top search results.

    3. For each distinct and relevant result, parse the content to extract the following information:
        - 'name': The full name of the person or company.
        - 'sourceUrl': The direct URL where the information was found.
        - 'summary': A brief summary of the context or information available about the contact.
        - 'socialMediaLinks': Any associated social media profile URLs (e.g., LinkedIn, Twitter).
        - 'phoneNumbers': Any contact phone numbers found.
        - 'emails': Any contact email addresses found.

    4. If a piece of information (e.g., phone number) is not found, omit the key.

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
    const { output } = await scrapeAndExtractPrompt(input);
    return output || { results: [] };
  }
);


export async function scrapeWebsite(input: ScrapeWebsiteInput): Promise<ScrapeWebsiteMultiOutput> {
    return scrapeWebsiteFlow(input);
}