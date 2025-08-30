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
    prompt: `You are an expert data scraper specializing in finding contact information for sales outreach. Your task is to perform a targeted search based on the user's query and source, and then extract key contact details for up to 10 relevant individuals or companies.

    1.  Construct the appropriate search URL based on the source:
        - For 'website': Use a Google search: https://www.google.com/search?q={query}
        - For 'reddit': Use Reddit's search: https://www.reddit.com/search/?q={query}
        - For 'news': Use Google News search: https://www.google.com/search?q={query}&tbm=nws
        - For 'instagram': Use a Google search targeting Instagram: https://www.google.com/search?q=site:instagram.com {query}
        - For 'facebook': Use a Google search targeting Facebook: https://www.google.com/search?q=site:facebook.com {query}
        - For 'linkedin': Use a Google search for profiles: https://www.google.com/search?q=site:linkedin.com/in/ {query}
        - For 'youtube': Use a YouTube search: https://www.youtube.com/results?search_query={query}

    2.  Fetch content from the top search results.

    3.  For each distinct and relevant result, aggressively parse the content to extract the following information:
        - 'name': The full name of the person or company.
        - 'sourceUrl': The direct URL where the information was found.
        - 'summary': A brief, hard-hitting summary of the individual or company, focusing on their professional role and context.
        - 'socialMediaLinks': Any and all associated social media profile URLs (LinkedIn, Twitter, etc.).
        - 'phoneNumbers': Any contact phone numbers found, from anywhere in the world.
        - 'emails': Any contact email addresses found. Prioritize professional emails, but also extract personal ones like @gmail.com if available.

    4.  If a piece of information (e.g., phone number) is not found, omit the key. Do not fabricate data.

    5.  Format the output as a JSON object that adheres to the ScrapeWebsiteMultiOutputSchema.

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
