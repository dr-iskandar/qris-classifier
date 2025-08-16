'use server';

/**
 * @fileOverview This file defines a Genkit flow for classifying the business type based on uploaded images.
 *
 * - classifyBusinessType - A function that handles the business type classification process.
 * - ClassifyBusinessTypeInput - The input type for the classifyBusinessType function.
 * - ClassifyBusinessTypeOutput - The return type for the classifyBusinessType function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyBusinessTypeInputSchema = z.object({
  image1: z
    .string()
    .describe(
      "A photo of the business environment, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    )
    .optional(),
  image2: z
    .string()
    .describe(
      "A photo of the business environment, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    )
    .optional(),
  image3: z
    .string()
    .describe(
      "A photo of the business environment, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    )
    .optional(),
  image4: z
    .string()
    .describe(
      "A photo of the business environment, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    )
    .optional(),
  image5: z
    .string()
    .describe(
      "A photo of the business environment, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    )
    .optional(),
});
export type ClassifyBusinessTypeInput = z.infer<typeof ClassifyBusinessTypeInputSchema>;

const ClassifyBusinessTypeOutputSchema = z.object({
  businessType: z.string().describe('The predicted business type.'),
});
export type ClassifyBusinessTypeOutput = z.infer<typeof ClassifyBusinessTypeOutputSchema>;

export async function classifyBusinessType(input: ClassifyBusinessTypeInput): Promise<ClassifyBusinessTypeOutput> {
  return classifyBusinessTypeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyBusinessTypePrompt',
  input: {schema: ClassifyBusinessTypeInputSchema},
  output: {schema: ClassifyBusinessTypeOutputSchema},
  prompt: `You are an AI assistant that helps classify business environments based on images.

  Analyze the provided images and determine the most likely business type. Respond with a single business type.

  {{media url=image1 contentType="image/jpeg"}}
  `,
});

const classifyBusinessTypeFlow = ai.defineFlow(
  {
    name: 'classifyBusinessTypeFlow',
    inputSchema: ClassifyBusinessTypeInputSchema,
    outputSchema: ClassifyBusinessTypeOutputSchema,
  },
  async input => {
    // Use only the first provided image for now to simplify the prompt
    const firstImage = input.image1 || input.image2 || input.image3 || input.image4 || input.image5;
    
    if (!firstImage) {
      throw new Error('No images provided for classification');
    }
    
    const {output} = await prompt({ image1: firstImage });
    return output!;
  }
);
