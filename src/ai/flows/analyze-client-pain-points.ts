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
  prompt: `You are an AI assistant specializing in analyzing client data to identify pain points.

  Analyze the following client data and identify the key pain points expressed by the clients.
  Categorize each pain point and provide a detailed description.

  Client Data: {{{clientData}}}

  Format your output as a JSON object with a "painPoints" field which is an array of objects with "category" and "description" fields for each pain point.
  Example:
  {
    "painPoints": [
      {
        "category": "Pricing",
        "description": "Clients are concerned about the high cost of the product."
      },
      {
        "category": "Customer Support",
        "description": "Clients are frustrated with the slow response times from customer support."
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
