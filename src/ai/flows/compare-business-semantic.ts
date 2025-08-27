'use server';

/**
 * @fileOverview This file defines a Genkit flow for semantic comparison between AI-classified business type and user-provided business name.
 *
 * - compareBusinessSemantic - A function that uses AI to intelligently compare business types
 * - CompareBusinessSemanticInput - The input type for the comparison function
 * - CompareBusinessSemanticOutput - The return type for the comparison function
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CompareBusinessSemanticInputSchema = z.object({
  aiClassifiedType: z
    .string()
    .describe('The business type classified by AI from the images'),
  userBusinessName: z
    .string()
    .describe('The business name or type provided by the user'),
  imageContext: z
    .string()
    .optional()
    .describe('Additional context about what was seen in the images')
});
export type CompareBusinessSemanticInput = z.infer<typeof CompareBusinessSemanticInputSchema>;

const CompareBusinessSemanticOutputSchema = z.object({
  isMatch: z.boolean().describe('Whether the business types are semantically compatible'),
  matchScore: z.number().min(0).max(1).describe('Confidence score of the match (0-1)'),
  matchReason: z.string().describe('Detailed explanation of why they match or don\'t match'),
  semanticRelationship: z.string().describe('The type of relationship between the business types'),
  recommendations: z.array(z.string()).describe('Suggestions for improving the match or clarification')
});
export type CompareBusinessSemanticOutput = z.infer<typeof CompareBusinessSemanticOutputSchema>;

export async function compareBusinessSemantic(input: CompareBusinessSemanticInput): Promise<CompareBusinessSemanticOutput> {
  return compareBusinessSemanticFlow(input);
}

const prompt = ai.definePrompt({
  name: 'compareBusinessSemanticPrompt',
  input: {schema: CompareBusinessSemanticInputSchema},
  output: {schema: CompareBusinessSemanticOutputSchema},
  prompt: `You are an AI assistant specialized in business type analysis and semantic comparison.

Your task is to intelligently compare two business types:
1. AI-classified type from images: "{{aiClassifiedType}}"
2. User-provided business name: "{{userBusinessName}}"
{{#if imageContext}}3. Image context: "{{imageContext}}"{{/if}}

Analyze these business types considering:
- Semantic similarity and business category overlap
- Industry classification and business activities
- Cultural and regional business naming conventions (especially Indonesian context)
- Potential for the same business to be described differently
- Whether they could realistically refer to the same type of business

Provide a detailed analysis with:
- isMatch: true if they are semantically compatible business types
- matchScore: confidence level (0.0 to 1.0)
- matchReason: detailed explanation of your reasoning
- semanticRelationship: describe the relationship (e.g., "exact match", "subcategory", "related industry", "different business types")
- recommendations: actionable suggestions

Consider Indonesian business naming conventions and be generous with matches that make business sense, even if the exact words differ.`
});

const compareBusinessSemanticFlow = ai.defineFlow(
  {
    name: 'compareBusinessSemanticFlow',
    inputSchema: CompareBusinessSemanticInputSchema,
    outputSchema: CompareBusinessSemanticOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);