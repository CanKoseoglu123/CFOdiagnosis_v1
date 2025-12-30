/**
 * VS-32: AI Generator - Single call to generate 5 sections
 *
 * Uses golden examples as reference for expected output format and style.
 * Evidence IDs are embedded inline as [[evidence_id]] tags.
 */

import { InterpretationInput, OverviewSection, Tonality, deriveTonality } from './types';
import { PillarPack } from '../pillars/registry';
import { callOpenAI, openai } from './openai-client';

export async function generateInterpretation(
  input: InterpretationInput,
  pack: PillarPack
): Promise<{ sections: OverviewSection[]; tokens: number }> {

  const tonality = deriveTonality(
    input.overall_score,
    input.critical_failures.length > 0
  );

  const prompt = buildPrompt(input, pack, tonality);

  const response = await callOpenAI(async () => {
    return openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: buildSystemPrompt(pack, tonality) },
        { role: 'user', content: prompt },
      ],
    });
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');

  const sections = parseResponse(content);

  return {
    sections,
    tokens: response.usage?.total_tokens || 0,
  };
}

function buildSystemPrompt(pack: PillarPack, tonality: Tonality): string {
  const toneGuidance: Record<Tonality, string> = {
    celebrate: 'Tone: Confident, forward-looking. Focus on optimization, not fixing. This is a high-performing organization.',
    refine: 'Tone: Balanced, constructive. Clear improvement path without alarm. Good foundation with room to grow.',
    urgent: 'Tone: Direct, priority-focused. Critical gaps demand immediate attention. Be clear about what must change.',
    remediate: 'Tone: Serious but supportive. Break down the workload into manageable steps. Show a clear path forward.',
  };

  return `You are a senior finance transformation consultant writing for a CFO.

OUTPUT: Valid JSON array. No markdown wrapping. No explanation outside JSON.

EVIDENCE RULES:
- Ground every factual claim with [[evidence_id]] immediately after the claim
- Example: "...execution score of 55% [[score_overall]] at Level 2 [[level_2]]..."
- Only use evidence IDs from the provided list
- Each section MUST have at least one [[evidence_id]] tag

LANGUAGE RULES:
- Scores ≥65%: use "solid", "robust", "established", "mature", "advanced"
- Scores <65%: use "emerging", "developing", "foundational", "early-stage"
- Never call a score below 65% "strong" or "solid"
- Forbidden phrases: ${pack.forbidden_phrases.slice(0, 8).join(', ')}

${toneGuidance[tonality]}

Address the organization as "you" or by company name. Write like a consulting partner.`;
}

function buildPrompt(input: InterpretationInput, pack: PillarPack, tonality: Tonality): string {
  return `Generate a ${pack.pillar_name} interpretation for ${input.company_name}.

TONALITY: ${tonality.toUpperCase()}

FACTS (use these evidence IDs):
- Execution Score: ${input.overall_score}% [score_overall]
- Maturity: Level ${input.maturity_level} (${input.maturity_name}) [level_${input.maturity_level}]
- Capped: ${input.is_capped ? 'Yes' : 'No'} [${input.is_capped ? 'cap_active' : 'cap_none'}]

OBJECTIVES:
${input.objectives.map(o =>
    `- ${o.name}: ${o.score}% (importance: ${o.importance}/5)${o.has_critical ? ' [CRITICAL]' : ''} [obj_${o.id}]`
  ).join('\n')}

CRITICAL FAILURES:
${input.critical_failures.length > 0
      ? input.critical_failures.map(c => `- ${c.question_title} in ${c.objective_name} [critical_${c.question_id}]`).join('\n')
      : '- None'}

GATE BLOCKERS:
${input.failed_gates.length > 0
      ? input.failed_gates.map(g => `- Level ${g.level}: ${g.blocking_questions.slice(0, 3).join(', ')} [gate_L${g.level}_blocked]`).join('\n')
      : '- None'}

PRIORITY MISALIGNMENTS (high importance but low score):
${input.priority_misalignments.length > 0
      ? input.priority_misalignments.map(m => `- ${m.objective_name}: importance ${m.importance}/5, score ${m.score}%`).join('\n')
      : '- None'}

AVAILABLE EVIDENCE IDs:
${input.evidence_ids.join(', ')}

GENERATE these 5 sections:
${pack.sections.map(s => `- ${s.id}: "${s.title}" (${s.guidance}) [max ${s.max_words} words]`).join('\n')}

Return ONLY valid JSON:
[
  {"id": "executive_snapshot", "title": "Executive Snapshot", "content": "...[[evidence]]..."},
  {"id": "strengths", "title": "Strengths", "content": "..."},
  {"id": "constraints", "title": "Constraints", "content": "..."},
  {"id": "opportunity_areas", "title": "Opportunity Areas", "content": "..."},
  {"id": "path_forward", "title": "Path Forward", "content": "..."}
]`;
}

function parseResponse(content: string): OverviewSection[] {
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
