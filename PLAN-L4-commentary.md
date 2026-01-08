# Plan: Fix L4 AI Commentary in Practice Level Details

## Problem Statement
When a practice objective achieves L4 (the maximum level), no AI commentary is generated because the code filters out objectives with `gap <= 0`. Users see "No commentary available for this objective." for their highest-performing areas.

## Solution: Option A - Generate Different Commentary for L4 Objectives

Generate personalized AI commentary for L4 objectives using a separate prompt focused on sustaining excellence, rather than gap-closing advice.

---

## Implementation Steps

### Step 1: Create Excellence Prompt Function
**File:** `src/benchmark/generator.ts`

Add a new function `buildExcellencePrompt()` that generates appropriate prompts for L4 objectives:

```typescript
function buildExcellencePrompt(input: BenchmarkPromptInput): string {
  const objectiveLines = input.objectives
    .map((o) => `- ${o.objective_id}: ${o.objective_name} (achieved L${o.achieved_level})`)
    .join("\n");

  return `
You are writing benchmark excellence commentary for a CFO whose team has achieved top-level (L4) performance.

Company: ${input.company_name}
Persona: ${input.persona}

Objectives at L4:
${objectiveLines}

Rules:
- Acknowledge the achievement briefly.
- Provide 1-2 sentences of forward-looking guidance on sustaining excellence or embedding practices.
- Be specific to the objective, not generic.
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
```

### Step 2: Update generateBenchmarkCommentary Function
**File:** `src/benchmark/generator.ts`

Modify the main function to:
1. Split objectives into two groups: those with gaps and those at max level (L4)
2. Generate commentary for gap objectives (existing logic)
3. Generate commentary for L4 objectives (new logic)
4. Merge results

```typescript
export async function generateBenchmarkCommentary(
  companyName: string,
  persona: string,
  objectives: BenchmarkObjectiveGap[]
): Promise<BenchmarkCommentary> {
  // Split objectives into gap vs excellence groups
  const objectivesWithGap = objectives.filter((o) => o.gap > 0);
  const objectivesAtMax = objectives.filter((o) => o.gap <= 0 && o.achieved_level >= 4);

  const notes: Array<{ objective_id: string; commentary: string }> = [];

  // Generate gap commentary (existing logic)
  if (objectivesWithGap.length > 0) {
    // ... existing chunked generation logic for gap objectives
  }

  // Generate excellence commentary for L4 objectives
  if (objectivesAtMax.length > 0) {
    // ... new chunked generation logic using buildExcellencePrompt
  }

  // Build summary (update to handle both cases)
  let summary: string;
  if (objectivesWithGap.length === 0) {
    summary = "Targets are met across all objectives. Focus on sustaining execution and preventing regression.";
  } else {
    const sortedByGap = [...objectivesWithGap].sort((a, b) => b.gap - a.gap);
    const topGaps = sortedByGap.slice(0, 3).map((o) => o.objective_name);
    summary = `Largest gaps sit in ${topGaps.join(", ")}. Close these first to align with ${persona} benchmarks.`;
  }

  return {
    summary,
    objectives: notes,
    generated_at: new Date().toISOString(),
  };
}
```

### Step 3: Extract Shared Chunk Processing Logic
**File:** `src/benchmark/generator.ts`

To avoid code duplication, extract the chunked API call logic into a helper function:

```typescript
async function generateCommentaryForChunks(
  objectives: BenchmarkObjectiveGap[],
  companyName: string,
  persona: string,
  promptBuilder: (input: BenchmarkPromptInput) => string
): Promise<Array<{ objective_id: string; commentary: string }>> {
  const notes: Array<{ objective_id: string; commentary: string }> = [];
  const chunkSize = 3;

  for (let i = 0; i < objectives.length; i += chunkSize) {
    const chunk = objectives.slice(i, i + chunkSize);
    const prompt = promptBuilder({
      company_name: companyName,
      persona,
      objectives: chunk,
    });

    // ... existing OpenAI call and parsing logic
  }

  return notes;
}
```

### Step 4: Handle Edge Cases
Consider these scenarios:
- All objectives at L4 (no gaps) - generate excellence commentary for all
- Mix of gaps and L4 - generate both types
- No objectives at L4 - existing behavior unchanged
- Objectives with `achieved_level < 4` but `gap <= 0` (target met but not at max) - could optionally include these in excellence group

### Step 5: Test the Changes
1. Test with a diagnostic run that has some objectives at L4
2. Verify commentary appears in Practice Level Details section
3. Verify commentary is contextually appropriate (excellence-focused, not gap-focused)
4. Test edge cases (all L4, no L4, mixed)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/benchmark/generator.ts` | Add `buildExcellencePrompt()`, update `generateBenchmarkCommentary()`, extract helper |

## Files Unchanged
- `cfo-frontend/src/components/report/BenchmarkTab.jsx` - Already handles displaying commentary by objective_id
- `src/index.ts` - API endpoint already passes all objectives, no changes needed

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Increased API calls for L4 objectives | Chunking already in place, minimal impact |
| Cache invalidation needed for existing runs | Commentary is regenerated when null/stale, no migration needed |
| Prompt quality for excellence commentary | Clear, specific prompt with same JSON format |

---

## Acceptance Criteria
- [ ] L4 objectives show AI-generated commentary in Practice Level Details
- [ ] Commentary for L4 objectives is excellence-focused (sustaining, embedding practices)
- [ ] Commentary for gap objectives unchanged (closing gaps)
- [ ] Mixed scenarios work correctly
- [ ] No regression in existing functionality
