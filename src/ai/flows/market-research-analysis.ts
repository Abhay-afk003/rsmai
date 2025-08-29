'use server';
/**
 * @fileOverview Performs market research analysis on client data.
 *
 * - marketResearchAnalysis - A function that handles the market research analysis.
 */

import {ai} from '@/ai/genkit';
import { MarketResearchAnalysisInput, MarketResearchAnalysisInputSchema, MarketResearchAnalysisOutput, MarketResearchAnalysisOutputSchema } from '@/ai/schemas';


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
