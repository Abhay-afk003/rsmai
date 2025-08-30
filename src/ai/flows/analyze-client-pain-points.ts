'use server';
/**
 * @fileOverview Analyzes scraped client data to identify and categorize pain points using AI.
 *
 * - analyzeClientPainPoints - A function that handles the analysis of client pain points.
 */

import {ai} from '@/ai/genkit';
import { AnalyzeClientPainPointsInput, AnalyzeClientPainPointsInputSchema, AnalyzeClientPainPointsOutput, AnalyzeClientPainPointsOutputSchema } from '@/ai/schemas';

export async function analyzeClientPainPoints(input: AnalyzeClientPainPointsInput): Promise<AnalyzeClientPainPointsOutput> {
  return analyzeClientPainPointsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeClientPainPointsPrompt',
  input: {schema: AnalyzeClientPainPointsInputSchema},
  output: {schema: AnalyzeClientPainPointsOutputSchema},
  prompt: `You are an aggressive, ruthless sales intelligence analyst for a top-tier digital marketing agency. Your mission is to find dirt on a target company and weaponize it for a sales pitch.

  You will be given information about a contact. Your task is to perform a deep web search for reviews, complaints, discussions, and news articles about them or their company. Your goal is to identify concrete, specific pain points that their customers, employees, or the public are experiencing.

  For each pain point, you must explain *why* it's a problem and then propose a *specific digital marketing service* we can pitch to solve it. The tone should be direct and hard-hitting.

  Client Info: {{{clientData}}}

  Analyze the search results and extract the most severe and specific pain points. Focus on issues like:
  - Poor online reviews (e.g., on Yelp, Google Maps, industry-specific sites)
  - Negative social media sentiment or unanswered customer complaints
  - An outdated or non-mobile-friendly website and poor user experience
  - Low search engine visibility (bad SEO) for key terms
  - Lack of a coherent content marketing or social media strategy
  - Ineffective or non-existent paid ad campaigns (PPC)

  Format your output as a JSON object with a "painPoints" field, which is an array of objects. Each object must have a "category", a "description" of the pain point, and a "suggestedService" to pitch.

  Example:
  {
    "painPoints": [
      {
        "category": "Poor Reviews",
        "description": "I saw on Yelp that customers are consistently complaining about your slow response times. Your 3-star average is costing you business because prospects see this and immediately choose a competitor.",
        "suggestedService": "Reputation Management & Customer Engagement Strategy"
      },
      {
        "category": "Website Issues",
        "description": "Your website looks like it hasn't been touched since 2010. It's not mobile-friendly, driving away over 50% of your potential customers who browse on their phones, and your blog is stale. This signals that your business is not active or modern.",
        "suggestedService": "Website Redesign & Content Marketing"
      }
    ]
  }
  `,
});

const analyzeClientPainPointsFlow = ai.defineFlow(
  {
    name: 'analyzeClientPainPointsFlow',
    inputSchema: AnalyzeClientPainPointsInputSchema,
    outputSchema: AnalyzeClientPainPointsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
