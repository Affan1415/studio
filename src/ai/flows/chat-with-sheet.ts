// 'use server'
'use server';

/**
 * @fileOverview A Genkit flow for chatting with Google Sheet data.
 *
 * - chatWithSheet - A function that handles the chat process.
 * - ChatWithSheetInput - The input type for the chatWithSheet function.
 * - ChatWithSheetOutput - The return type for the chatWithSheet function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithSheetInputSchema = z.object({
  question: z.string().describe('The user question about the sheet data.'),
  sheetData: z.string().describe('The Google Sheet data as a string.'),
});
export type ChatWithSheetInput = z.infer<typeof ChatWithSheetInputSchema>;

const ChatWithSheetOutputSchema = z.object({
  response: z.string().describe('The response to the user question.'),
  update: z
    .object({
      range: z.string().describe('The range to update in the sheet.'),
      value: z.string().describe('The new value to set in the range.'),
    })
    .optional()
    .describe('Optional update to write back to the sheet.'),
});
export type ChatWithSheetOutput = z.infer<typeof ChatWithSheetOutputSchema>;

export async function chatWithSheet(input: ChatWithSheetInput): Promise<ChatWithSheetOutput> {
  return chatWithSheetFlow(input);
}

const chatWithSheetPrompt = ai.definePrompt({
  name: 'chatWithSheetPrompt',
  input: {schema: ChatWithSheetInputSchema},
  output: {schema: ChatWithSheetOutputSchema},
  prompt: `You are an intelligent assistant that helps users analyze data in a Google Sheet.

  Here is the data from the Google Sheet:
  {{sheetData}}

  Based on this data, answer the following question from the user:
  User: {{question}}

  If the user asks you to modify a value in the sheet, respond with a JSON payload in the following format.  If the user is not asking you to modify the sheet, omit the JSON Payload.
  {
    "update": {
      "range": "<the range to update>",
      "value": "<the new value>"
    }
  }
  Do not provide any other explanation, or text other than the JSON blob.
  `,
});

const chatWithSheetFlow = ai.defineFlow(
  {
    name: 'chatWithSheetFlow',
    inputSchema: ChatWithSheetInputSchema,
    outputSchema: ChatWithSheetOutputSchema,
  },
  async input => {
    const {output} = await chatWithSheetPrompt(input);
    return output!;
  }
);
