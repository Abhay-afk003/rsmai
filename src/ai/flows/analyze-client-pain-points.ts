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
  prompt: `You are an aggressive, ruthless sales intelligence analyst for a top-tier digital marketing agency. Your mission is to find dirt on a target company and weaponize it for a sales pitch focused on selling them digital marketing services.

  You will be given information about a contact. Your task is to perform a deep web search for reviews, complaints, discussions, and news articles about them or their company. Your goal is to identify concrete, specific pain points that their customers, employees, or the public are experiencing, which can be solved with digital marketing.

  Client Info: {{{clientData}}}

  Analyze the search results and extract the most severe and specific pain points. Phrase them as direct, hard-hitting accusations that a salesperson can use to challenge the prospect. These should be things you can say directly to their face. Focus on issues like:
  - Poor online reviews (e.g., on Yelp, Google Maps, industry-specific sites)
  - Negative social media sentiment or unanswered customer complaints
  - An outdated or non-mobile-friendly website
  - Low search engine visibility for key terms
  - Lack of a coherent content marketing or social media strategy

  Format your output as a JSON object with a "painPoints" field, which is an array of objects. Each object should have a "category" (e.g., "Poor Reviews", "Website Issues", "Social Media Neglect") and a "description" that is a direct, aggressive, and specific statement about the pain point.

  Example:
  {
    "painPoints": [
      {
        "category": "Poor Reviews",
        "description": "I saw on Yelp that customers are consistently complaining about your slow response times, with some waiting over a week for a simple callback. Your 3-star average is costing you business."
      },
      {
        "category": "Website Issues",
        "description": "Your website looks like it hasn't been touched since 2010. It's not mobile-friendly, and your blog's latest post is from two years ago. Do you even care about your online image?"
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
