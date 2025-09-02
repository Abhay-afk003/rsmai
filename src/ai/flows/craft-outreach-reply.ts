'use server';
/**
 * @fileOverview Crafts personalized outreach messages based on client pain points.
 *
 * - craftOutreachReply - A function that generates a sales message.
 */

import {ai} from '@/ai/genkit';
import { CraftOutreachReplyInput, CraftOutreachReplyInputSchema, CraftOutreachReplyOutput, CraftOutreachReplyOutputSchema } from '@/ai/schemas';

const prompt = ai.definePrompt({
    name: 'craftOutreachReplyPrompt',
    input: {schema: CraftOutreachReplyInputSchema},
    output: {schema: CraftOutreachReplyOutputSchema},
    prompt: `You are a world-class sales executive with over 10 years of experience in the digital marketing industry. You have a reputation for closing deals by being direct, insightful, and providing immediate value. Your task is to craft a masterpiece of an outreach message.

    You will be given the contact's information, their business pain points that we have identified, and the platform for the message.

    Contact Information:
    - Name: {{contact.name}}
    - Summary: {{contact.summary}}
    {{#if contact.emails}}- Emails: {{json contact.emails}}{{/if}}
    {{#if contact.phoneNumbers}}- Phone: {{json contact.phoneNumbers}}{{/if}}
    {{#if contact.socialMediaLinks}}- Socials: {{json contact.socialMediaLinks}}{{/if}}

    Identified Pain Points:
    {{#each painPoints}}
    - [{{category}}] {{description}} (Our Plan: {{suggestedService}})
    {{/each}}

    Platform: {{platform}}

    Your Task:
    1.  Based on the platform ({{platform}}), write a concise, powerful, and professional message.
    2.  If the platform is 'email', format it as a professional email with a subject line and body. The subject line must be compelling and create urgency or curiosity.
    3.  If the platform is 'whatsapp', make it a bit more casual but still professional and direct. No subject line needed.
    4.  Directly reference one or two of the most critical pain points. Do NOT be vague. Show them you've done your homework.
    5.  Subtly position our agency as the solution by hinting at the 'suggestedService' without sounding like a generic sales pitch. The goal is to start a conversation, not close the deal in the first message.
    6.  Keep it short and to the point. Busy people don't read long messages.
    7.  End with a clear, low-friction call to action, like asking for a brief 15-minute call.

    Generate the reply in the 'message' field of the output.
    `,
});

const craftOutreachReplyFlow = ai.defineFlow(
  {
    name: 'craftOutreachReplyFlow',
    inputSchema: CraftOutreachReplyInputSchema,
    outputSchema: CraftOutreachReplyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function craftOutreachReply(input: CraftOutreachReplyInput): Promise<CraftOutreachReplyOutput> {
    return craftOutreachReplyFlow(input);
}
