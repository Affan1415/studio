// src/ai/flows/writeback-to-sheet.ts
'use server';

/**
 * @fileOverview A Genkit flow that allows the chatbot to update a Google Sheet based on the conversation.
 *
 * - writebackToSheet - A function that handles the writeback process.
 * - WritebackToSheetInput - The input type for the writebackToSheet function.
 * - WritebackToSheetOutput - The return type for the writebackToSheet function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WritebackToSheetInputSchema = z.object({
  question: z.string().describe('The user question.'),
  sheetData: z.string().describe('The Google Sheet data in JSON format.'),
  spreadsheetId: z.string().describe('The ID of the Google Sheet.'),
  accessToken: z.string().describe('The Google OAuth access token.'),
});
export type WritebackToSheetInput = z.infer<typeof WritebackToSheetInputSchema>;

const WritebackToSheetOutputSchema = z.object({
  response: z.string().describe('The response to the user question.'),
  update: z
    .object({
      range: z.string().describe('The range to update (e.g., "B3").'),
      value: z.string().describe('The new value to write.'),
    })
    .optional()
    .describe('Optional update payload to write back to the sheet.'),
});
export type WritebackToSheetOutput = z.infer<typeof WritebackToSheetOutputSchema>;

export async function writebackToSheet(input: WritebackToSheetInput): Promise<WritebackToSheetOutput> {
  return writebackToSheetFlow(input);
}

const writebackToSheetPrompt = ai.definePrompt({
  name: 'writebackToSheetPrompt',
  input: {schema: WritebackToSheetInputSchema},
  output: {schema: WritebackToSheetOutputSchema},
  prompt: `You are an assistant that can answer questions based on the provided Google Sheet data and optionally update the sheet.

Here is the data from the Google Sheet:
{{{sheetData}}}

User question: {{{question}}}

Respond to the user's question. If the answer requires an update to the Google Sheet, provide an "update" payload in the JSON format:
{
  "range": "<cell to update>",
  "value": "<new value>"
}

Otherwise, the update field should be omitted from the JSON output.

Ensure your response is valid JSON.
`,
});

const writebackToSheetFlow = ai.defineFlow(
  {
    name: 'writebackToSheetFlow',
    inputSchema: WritebackToSheetInputSchema,
    outputSchema: WritebackToSheetOutputSchema,
  },
  async input => {
    const {output} = await writebackToSheetPrompt(input);
    return output!;
  }
);
