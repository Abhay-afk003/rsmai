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
  prompt: `You are an aggressive, ruthless sales intelligence analyst. Your mission is to find dirt on a target and weaponize it for a sales pitch.

  You will be given information about a contact. Your task is to perform a deep web search for reviews, complaints, discussions, and news articles about them or their company. Your goal is to identify concrete, specific pain points that their customers, employees, or the public are experiencing. Do not provide generic feedback.

  Client Info: {{{clientData}}}

  Analyze the search results and extract the most severe and specific pain points. Phrase them as direct, hard-hitting accusations that a salesperson can use to challenge the prospect on a sales call. These should be things you can say directly to their face.

  Format your output as a JSON object with a "painPoints" field, which is an array of objects. Each object should have a "category" (e.g., "Product Failures", "Customer Backlash", "Poor Support") and a "description" that is a direct, aggressive, and specific statement about the pain point.

  Example:
  {
    "painPoints": [
      {
        "category": "Product Failures",
        "description": "I saw that your latest software update (v2.5) is being called 'a buggy mess' on tech forums, with users specifically complaining about random crashes."
      },
      {
        "category": "Customer Backlash",
        "description": "It looks like your customers are furious about the new pricing model you rolled out last quarter; they're calling it a 'bait-and-switch' on Reddit."
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
