
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
  prompt: `You are a senior strategist at a top-tier digital marketing agency. Your job is to analyze intelligence on a potential client and create a clear, actionable plan for your team.

  You will be given information about a contact. Perform a deep web search for reviews, discussions, and articles about them. Your goal is to identify their most critical business pain points that our agency can solve.

  For each pain point, clearly state the problem and then outline the specific digital marketing service we will use to address it. The tone should be internal, strategic, and confident.

  Client Info: {{{clientData}}}

  Analyze the data and structure your findings. Focus on issues we can directly impact, such as:
  - Poor online reputation and negative reviews
  - Subpar website performance and user experience
  - Low search engine visibility (bad SEO)
  - Ineffective social media presence
  - Lack of a content marketing strategy
  - Wasted ad spend or non-existent PPC campaigns

  Frame each finding as a "Pain Point" and a "Plan of Action".

  Example:
  {
    "painPoints": [
      {
        "category": "Reputation",
        "description": "Their Yelp and Google Maps reviews are consistently poor, with customers complaining about slow service. This is directly costing them leads.",
        "suggestedService": "We need to deploy our Reputation Management protocol to mitigate negative feedback and implement a customer engagement strategy to improve public sentiment."
      },
      {
        "category": "Website UX",
        "description": "The website is not mobile-friendly and has an outdated design. Over half their potential audience on mobile is bouncing immediately.",
        "suggestedService": "We will pitch a full Website Redesign focused on mobile-first principles and launch a content marketing initiative to signal that they are an active, modern business."
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
