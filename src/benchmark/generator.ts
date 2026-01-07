import { callOpenAI, openai } from "../interpretation/engine/openai-client";

export interface BenchmarkObjectiveGap {
  objective_id: string;
  objective_name: string;
  achieved_level: number;
  target_level: number;
  gap: number;
}

export interface BenchmarkCommentary {
  summary: string;
  objectives: Array<{
    objective_id: string;
    commentary: string;
  }>;
  generated_at: string;
}

interface BenchmarkPromptInput {
  company_name: string;
  persona: string;
  objectives: BenchmarkObjectiveGap[];
}

function buildObjectivePrompt(input: BenchmarkPromptInput): string {
  const objectiveLines = input.objectives
    .map((o) => `- ${o.objective_id}: ${o.objective_name} (achieved L${o.achieved_level}, target L${o.target_level})`)
    .join("\n");

  return `
You are writing benchmark gap commentary for a CFO.

Company: ${input.company_name}
Persona: ${input.persona}

Objectives:
${objectiveLines}

Rules:
- Be specific and practical. No generic advice.
- 1-2 sentences per objective.
- Use "you" voice.
- Do not mention raw scores or percentages.
- Output JSON only.

Return format:
{
  "notes": [
    { "objective_id": "obj_id", "commentary": "..." }
  ]
}
`.trim();
}

export async function generateBenchmarkCommentary(
  companyName: string,
  persona: string,
  objectives: BenchmarkObjectiveGap[]
): Promise<BenchmarkCommentary> {
  const objectivesNeedingCommentary = objectives.filter((o) => o.gap > 0);
  if (objectivesNeedingCommentary.length === 0) {
    return {
      summary: "Targets are met across all objectives. Focus on sustaining execution and preventing regression.",
      objectives: [],
      generated_at: new Date().toISOString(),
    };
  }

  const notes: Array<{ objective_id: string; commentary: string }> = [];
  const chunkSize = 3;

  for (let i = 0; i < objectivesNeedingCommentary.length; i += chunkSize) {
    const chunk = objectivesNeedingCommentary.slice(i, i + chunkSize);
    const prompt = buildObjectivePrompt({
      company_name: companyName,
      persona,
      objectives: chunk,
    });

    const response = await callOpenAI(async () => {
      return openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.4,
        max_tokens: 500,
        messages: [
          { role: "system", content: "Return valid JSON only. No markdown." },
          { role: "user", content: prompt },
        ],
      });
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const cleaned = content.trim().replace(/```json\n?|\n?```/g, "");
    const parsed = JSON.parse(cleaned);
    const chunkNotes = Array.isArray(parsed?.notes) ? parsed.notes : [];
    chunkNotes.forEach((note: any) => {
      if (note?.objective_id && note?.commentary) {
        notes.push({
          objective_id: String(note.objective_id),
          commentary: String(note.commentary),
        });
      }
    });
  }

  const sortedByGap = [...objectivesNeedingCommentary].sort((a, b) => b.gap - a.gap);
  const topGaps = sortedByGap.slice(0, 3).map((o) => o.objective_name);
  const summary = `Largest gaps sit in ${topGaps.join(", ")}. Close these first to align with ${persona} benchmarks.`;

  return {
    summary,
    objectives: notes,
    generated_at: new Date().toISOString(),
  };
}
