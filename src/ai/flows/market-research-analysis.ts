'use server';
/**
 * @fileOverview Performs market research analysis on client data.
 *
 * - marketResearchAnalysis - A function that handles the market research analysis.
 * - MarketResearchAnalysisInput - The input type for the marketResearchAnalysis function.
 * - MarketResearchAnalysisOutput - The return type for the marketResearchAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MarketResearchAnalysisInputSchema = z.object({
  clientData: z
    .string()
    .describe('The client data to perform market research on.'),
});
export type MarketResearchAnalysisInput = z.infer<typeof MarketResearchAnalysisInputSchema>;

const MarketResearchAnalysisOutputSchema = z.object({
  researchSummary: z
    .string()
    .describe('A summary of the market research findings.'),
});
export type MarketResearchAnalysisOutput = z.infer<typeof MarketResearchAnalysisOutputSchema>;

export async function marketResearchAnalysis(input: MarketResearchAnalysisInput): Promise<MarketResearchAnalysisOutput> {
  return marketResearchAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'marketResearchAnalysisPrompt',
  input: {schema: MarketResearchAnalysisInputSchema},
  output: {schema: MarketResearchAnalysisOutputSchema},
  prompt: `You are a market research analyst. Based on the provided client data, perform a market research analysis.
  Provide a concise summary of your findings.

  Client Data: {{{clientData}}}
  `,
});

const marketResearchAnalysisFlow = ai.defineFlow(
  {
    name: 'marketResearchAnalysisFlow',
    inputSchema: MarketResearchAnalysisInputSchema,
    outputSchema: MarketResearchAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
