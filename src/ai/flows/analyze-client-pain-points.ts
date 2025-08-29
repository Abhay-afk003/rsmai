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
  prompt: `You are an aggressive sales analyst. Your job is to analyze the provided data and identify critical pain points that a salesperson can bring up in a conversation. Be direct and concise.

  Analyze the following data and extract the key pain points. Phrase them in a way that can be used directly in a sales pitch.

  Client Data: {{{clientData}}}

  Format your output as a JSON object with a "painPoints" field, which is an array of objects. Each object should have a "category" (e.g., "Operations", "Marketing", "Finance") and a "description" that is a direct, hard-hitting statement about the pain point.

  Example:
  {
    "painPoints": [
      {
        "category": "Marketing",
        "description": "Your current marketing strategy seems to be failing to reach your target audience."
      },
      {
        "category": "Customer Support",
        "description": "It looks like your customers are getting frustrated with slow support response times."
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