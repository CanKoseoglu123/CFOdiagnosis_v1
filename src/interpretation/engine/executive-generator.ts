/**
 * VS-45: Executive Commentary Generator
 *
 * Generates 3-section narrative for Executive Report using OpenAI.
 * No evidence tags, optimistic execution-validation tone.
 */

import {
  ExecutiveCommentaryInput,
  buildExecutiveCommentaryPrompt,
  buildExecutiveSystemPrompt,
} from './executive-prompt';
import { callOpenAI, openai } from './openai-client';

export interface ExecutiveSection {
  id: string;
  title: string;
  content: string;
}

export interface ExecutiveGeneratorResult {
  sections: ExecutiveSection[];
  tokens: number;
}

/**
 * Generate executive commentary using OpenAI
 */
export async function generateExecutiveCommentary(
  input: ExecutiveCommentaryInput
): Promise<ExecutiveGeneratorResult> {
  const systemPrompt = buildExecutiveSystemPrompt();
  const userPrompt = buildExecutiveCommentaryPrompt(input);

  const response = await callOpenAI(async () => {
    return openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 1500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  const sections = parseResponse(content);

  // Validate we got all 3 sections
  const expectedIds = ['current_state', 'actions_committed', 'projected_state'];
  for (const id of expectedIds) {
    if (!sections.find(s => s.id === id)) {
      throw new Error(`Missing required section: ${id}`);
    }
  }

  return {
    sections,
    tokens: response.usage?.total_tokens || 0,
  };
}

/**
 * Parse JSON response into sections
 */
function parseResponse(content: string): ExecutiveSection[] {
  // Strip markdown code blocks if present
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json\n?|\n?```/g, '').trim();
  }

  const parsed = JSON.parse(jsonStr);

  if (!Array.isArray(parsed)) {
    throw new Error('Response is not an array');
  }

  return parsed.map(s => ({
    id: s.id,
    title: s.title,
    content: s.content,
  }));
}
