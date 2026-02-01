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
import { runExecutiveHeuristics } from './executive-heuristics';
import { generateExecutiveFallback } from './executive-fallback';

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
 * Generate executive commentary using OpenAI with heuristic validation and fallback
 */
export async function generateExecutiveCommentary(
  input: ExecutiveCommentaryInput
): Promise<ExecutiveGeneratorResult> {
  const systemPrompt = buildExecutiveSystemPrompt();
  const userPrompt = buildExecutiveCommentaryPrompt(input);

  try {
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

    // Run heuristic validation
    const heuristics = runExecutiveHeuristics(sections, input);

    if (heuristics.passed) {
      return {
        sections,
        tokens: response.usage?.total_tokens || 0,
      };
    }

    // Log heuristic failures
    console.log('[EXECUTIVE-AI] Heuristics failed, using fallback:',
      heuristics.violations.filter(v => v.severity === 'error'));

    // Fallback to template-based output
    return {
      sections: generateExecutiveFallback(input),
      tokens: response.usage?.total_tokens || 0,
    };
  } catch (error: any) {
    console.error('[EXECUTIVE-AI] Generation failed, using fallback:', error.message);

    // Full fallback on generation failure
    return {
      sections: generateExecutiveFallback(input),
      tokens: 0,
    };
  }
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
