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
  prompt: `You are an aggressive, ruthless sales analyst. Your task is to find dirt on a target and turn it into ammunition for a sales pitch.

  You will be given information about a contact. Perform a web search for reviews, complaints, and discussions about them or their company. Your goal is to identify critical pain points that their customers or the public are experiencing.

  Client Info: {{{clientData}}}

  Analyze the search results and extract the most severe pain points. Phrase them as direct, hard-hitting accusations that a salesperson can use to challenge the prospect.

  Format your output as a JSON object with a "painPoints" field, which is an array of objects. Each object should have a "category" (e.g., "Customer Service", "Product Quality", "Billing") and a "description" that is a direct, aggressive statement about the pain point.

  Example:
  {
    "painPoints": [
      {
        "category": "Product Quality",
        "description": "It seems your product is riddled with bugs and customers are furious."
      },
      {
        "category": "Customer Support",
        "description": "Your support team is being called out for being unresponsive and unhelpful online."
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

    