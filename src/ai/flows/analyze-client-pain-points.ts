'use server';
/**
 * @fileOverview Analyzes scraped client data to identify and categorize pain points using AI.
 *
 * - analyzeClientPainPoints - A function that handles the analysis of client pain points.
 * - AnalyzeClientPainPointsInput - The input type for the analyzeClientPainPoints function.
 * - AnalyzeClientPainPointsOutput - The return type for the analyzeClientPainPoints function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeClientPainPointsInputSchema = z.object({
  clientData: z
    .string()
    .describe('The scraped client data to analyze.'),
});
export type AnalyzeClientPainPointsInput = z.infer<typeof AnalyzeClientPainPointsInputSchema>;

const AnalyzeClientPainPointsOutputSchema = z.object({
  painPoints: z.array(
    z.object({
      category: z.string().describe('The category of the pain point.'),
      description: z.string().describe('A detailed description of the pain point.'),
    })
  ).describe('The identified pain points categorized by category and description.'),
});
export type AnalyzeClientPainPointsOutput = z.infer<typeof AnalyzeClientPainPointsOutputSchema>;

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

  Format your output as a JSON array of objects with "category" and "description" fields for each pain point.
  Example:
  [
    {
      "category": "Pricing",
      "description": "Clients are concerned about the high cost of the product."
    },
    {
      "category": "Customer Support",
      "description": "Clients are frustrated with the slow response times from customer support."
    }
  ]
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
