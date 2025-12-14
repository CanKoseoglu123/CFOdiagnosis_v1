import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

import { validateRun } from "./validateRun";
import { scoreRun } from "./scoring/scoreRun";
import { SpecRegistry } from "./specs/registry";
import { aggregateResults } from "./results/aggregate";
import { toAggregateSpec } from "./specs/toAggregateSpec";
import { buildReport } from "./report/buildReport";

const app = express();
app.use(cors());
app.use(express.json());

// ------------------------------------------------------------------
// Supabase client
// ------------------------------------------------------------------
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ------------------------------------------------------------------
// Health
// ------------------------------------------------------------------
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/supabase-health", async (_req, res) => {
  const { error } = await supabase
    .from("diagnostic_runs")
    .select("id")
    .limit(1);

  if (error) {
    return res
      .status(500)
      .json({ status: "supabase-error", error: error.message });
  }

  res.json({ status: "supabase-ok" });
});

// ------------------------------------------------------------------
// VS1 — Create diagnostic run
// ------------------------------------------------------------------
app.post("/diagnostic-runs", async (_req, res) => {
  const { data, error } = await supabase
    .from("diagnostic_runs")
    .insert({
      status: "created",
      spec_version: "v2.6.4",
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});

// ------------------------------------------------------------------
// VS2 — Persist diagnostic input (draft, upsert allowed)
// ------------------------------------------------------------------
app.post("/diagnostic-inputs", async (req, res) => {
  const { run_id, question_id, value } = req.body;

  if (!run_id || !question_id || value === undefined) {
    return res.status(400).json({
      error: "run_id, question_id and value are required",
    });
  }

  const { data, error } = await supabase
    .from("diagnostic_inputs")
    .upsert(
      { run_id, question_id, value },
      { onConflict: "run_id,question_id" }
    )
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});

// ------------------------------------------------------------------
// VS3 — Debug validation endpoint (no state change)
// ------------------------------------------------------------------
app.get("/diagnostic-runs/:id/validate", async (req, res) => {
  const result = await validateRun(supabase, req.params.id);
  res.json(result);
});

// ------------------------------------------------------------------
// VS3 — Complete / commit run (validate + lock)
// ------------------------------------------------------------------
app.post("/diagnostic-runs/:id/complete", async (req, res) => {
  const runId = req.params.id;

  const { data: run, error: runError } = await supabase
    .from("diagnostic_runs")
    .select("id, status")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  if (run.status === "completed") {
    return res.status(409).json({ error: "Run already completed" });
  }

  const result = await validateRun(supabase, runId);

  if (!result.valid) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.errors,
    });
  }

  const { error: updateError } = await supabase
    .from("diagnostic_runs")
    .update({ status: "completed" })
    .eq("id", runId);

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  res.json({ status: "completed" });
});

// ------------------------------------------------------------------
// VS4 — Score run (persist per-question normalized scores)
// POST /diagnostic-runs/:id/score?overwrite=true
// ------------------------------------------------------------------
app.post("/diagnostic-runs/:id/score", async (req, res) => {
  const runId = req.params.id;
  const overwrite = String(req.query.overwrite) === "true";

  // 1) Run must exist and be completed
  const { data: run, error: runError } = await supabase
    .from("diagnostic_runs")
    .select("id, status")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  if (run.status !== "completed") {
    return res.status(409).json({ error: "Run is not completed" });
  }

  // 2) Check existing scores
  const { data: existingScores, error: existingError } = await supabase
    .from("diagnostic_scores")
    .select("id")
    .eq("run_id", runId)
    .limit(1);

  if (existingError) {
    return res.status(500).json({ error: existingError.message });
  }

  const hasScores = (existingScores ?? []).length > 0;

  if (hasScores && !overwrite) {
    return res.status(409).json({ error: "Scores already exist for this run" });
  }

  // 3) Overwrite path
  if (hasScores && overwrite) {
    const { error: delError } = await supabase
      .from("diagnostic_scores")
      .delete()
      .eq("run_id", runId);

    if (delError) {
      return res.status(500).json({ error: delError.message });
    }
  }

  // 4) Calculate scores (pure engine)
  let scores;
  try {
    scores = await scoreRun(supabase, runId);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }

  if (scores.length === 0) {
    return res.status(200).json([]);
  }

  // 5) Persist scores
  const { data: inserted, error: insertError } = await supabase
    .from("diagnostic_scores")
    .insert(
      scores.map((s) => ({
        run_id: runId,
        question_id: s.question_id,
        score: s.score,
      }))
    )
    .select();

  if (insertError) {
    return res.status(500).json({ error: insertError.message });
  }

  res.status(200).json(inserted);
});

// ------------------------------------------------------------------
// VS5 — Results (read-only aggregation)
// ------------------------------------------------------------------
app.get("/diagnostic-runs/:id/results", async (req, res) => {
  const runId = req.params.id;

  // 1) Load run
  const { data: run, error: runError } = await supabase
    .from("diagnostic_runs")
    .select("id, status, spec_version")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  // 2) Must be completed
  if (run.status !== "completed") {
    return res.status(409).json({
      error: "Run must be completed before results can be computed",
    });
  }

  // 3) Resolve SPEC (hard fail if missing)
  let spec;
  try {
    spec = SpecRegistry.get(run.spec_version);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }

  // 4) Load scores
  const { data: scores, error: scoresError } = await supabase
    .from("diagnostic_scores")
    .select("question_id, score")
    .eq("run_id", runId);

  if (scoresError) {
    return res.status(500).json({ error: scoresError.message });
  }

  if (!scores || scores.length === 0) {
    return res.status(409).json({
      error: "No scores exist for this run",
    });
  }

  // 5) Aggregate (pure)
   const aggregateSpec = toAggregateSpec(spec);
   const results = aggregateResults(aggregateSpec, scores);
    


  // 6) Return
  res.json(results);
});

// ------------------------------------------------------------------
// VS6 — Finance Report (full DTO for frontend)
// ------------------------------------------------------------------
app.get("/diagnostic-runs/:id/report", async (req, res) => {
  const runId = req.params.id;

  // 1) Load run
  const { data: run, error: runError } = await supabase
    .from("diagnostic_runs")
    .select("id, status, spec_version")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  // 2) Must be completed
  if (run.status !== "completed") {
    return res.status(409).json({
      error: "Run must be completed before report can be generated",
    });
  }

  // 3) Resolve SPEC (hard fail if missing)
  let spec;
  try {
    spec = SpecRegistry.get(run.spec_version);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }

  // 4) Load scores
  const { data: scores, error: scoresError } = await supabase
    .from("diagnostic_scores")
    .select("question_id, score")
    .eq("run_id", runId);

  if (scoresError) {
    return res.status(500).json({ error: scoresError.message });
  }

  if (!scores || scores.length === 0) {
    return res.status(409).json({
      error: "No scores exist for this run. Call POST /diagnostic-runs/:id/score first.",
    });
  }

  // 5) Load inputs (for critical risk derivation)
  const { data: inputs, error: inputsError } = await supabase
    .from("diagnostic_inputs")
    .select("question_id, value")
    .eq("run_id", runId);

  if (inputsError) {
    return res.status(500).json({ error: inputsError.message });
  }

  // 6) Aggregate scores (VS5)
  const aggregateSpec = toAggregateSpec(spec);
  const aggregateResult = aggregateResults(aggregateSpec, scores);

  // 7) Build report DTO (VS6)
  const report = buildReport({
    run_id: runId,
    spec,
    aggregateResult,
    inputs: (inputs ?? []).map((i) => ({
      question_id: i.question_id,
      value: i.value,
    })),
  });

  // 8) Return
  res.json(report);
});

// ------------------------------------------------------------------
// Server
// ------------------------------------------------------------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
