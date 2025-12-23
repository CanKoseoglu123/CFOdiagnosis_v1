import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

import { validateRun } from "./validateRun";
import { scoreRun } from "./scoring/scoreRun";
import { SpecRegistry, DEFAULT_SPEC_VERSION } from "./specs/registry";
import { aggregateResults } from "./results/aggregate";
import { toAggregateSpec } from "./specs/toAggregateSpec";
import { buildReport } from "./reports";

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || "https://cfodiagnosisv1.vercel.app",
  credentials: true,
}));
app.use(express.json());

// ------------------------------------------------------------------
// Supabase config
// ------------------------------------------------------------------
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
}

// Global anon client - ONLY for unauthenticated routes (health checks)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// ------------------------------------------------------------------
// Layer 3: Auth middleware - creates authenticated client
// ------------------------------------------------------------------
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      supabase: SupabaseClient;  // Each request gets its own client
    }
  }
}

// Middleware that creates a Supabase client for each request
// If token present: creates authenticated client (RLS will work)
// If no token: creates anon client (RLS will apply anon rules)
async function createSupabaseMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    
    // Create client WITH the user's token - RLS will see auth.uid()
    req.supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    
    // AWAIT the user check - do not proceed until we know who this is
    try {
      const { data: { user } } = await req.supabase.auth.getUser(token);
      if (user) {
        req.userId = user.id;
      }
    } catch (err) {
      console.error("Auth check failed", err);
      // Downgrade to Anon if the token was invalid/expired
      req.supabase = supabaseAnon;
    }
  } else {
    // No token - use anon client
    req.supabase = supabaseAnon;
  }
  
  next();
}

// Apply to all routes
app.use(createSupabaseMiddleware);

// ------------------------------------------------------------------
// Health (uses anon client directly - no auth needed)
// ------------------------------------------------------------------
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ------------------------------------------------------------------
// Spec endpoints (public - no auth needed)
// ------------------------------------------------------------------
app.get("/spec/questions", (_req, res) => {
  const spec = SpecRegistry.getDefault();
  res.json({
    version: spec.version,
    questions: spec.questions,
  });
});

// Full spec endpoint - Single Source of Truth for frontend
app.get("/api/spec", (_req, res) => {
  const spec = SpecRegistry.getWithThemes();
  res.json({
    version: spec.version,
    pillars: spec.pillars,
    questions: spec.questions,
    maturityGates: spec.maturityGates,
    objectives: spec.objectives || [],
    actions: spec.actions || [],
    themes: (spec as any).themes || [],
    initiatives: spec.initiatives || [],  // V2.1 Initiative Engine
  });
});

app.get("/supabase-health", async (_req, res) => {
  const { error } = await supabaseAnon
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
// Now uses req.supabase (authenticated if token provided)
// ------------------------------------------------------------------
app.post("/diagnostic-runs", async (req, res) => {
  const { data, error } = await req.supabase
    .from("diagnostic_runs")
    .insert({
      status: "created",
      spec_version: DEFAULT_SPEC_VERSION,
      owner_id: req.userId || null,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});

// ------------------------------------------------------------------
// VS18 — Get diagnostic run details
// ------------------------------------------------------------------
app.get("/diagnostic-runs/:id", async (req, res) => {
  const runId = req.params.id;

  const { data: run, error } = await req.supabase
    .from("diagnostic_runs")
    .select("id, status, spec_version, context, setup_completed_at, created_at")
    .eq("id", runId)
    .single();

  if (error || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  res.json(run);
});

// ------------------------------------------------------------------
// VS18 — Complete setup (save context, mark setup complete)
// ------------------------------------------------------------------
app.post("/diagnostic-runs/:id/setup", async (req, res) => {
  const runId = req.params.id;
  const { company_name, industry } = req.body;

  if (!company_name || !industry) {
    return res.status(400).json({
      error: "company_name and industry are required",
    });
  }

  // Verify run exists
  const { data: run, error: runError } = await req.supabase
    .from("diagnostic_runs")
    .select("id, setup_completed_at")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  // Update context and mark setup complete
  const { data, error } = await req.supabase
    .from("diagnostic_runs")
    .update({
      context: { company_name, industry },
      setup_completed_at: new Date().toISOString(),
      status: "in_progress",
    })
    .eq("id", runId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// ------------------------------------------------------------------
// VS21 — Save calibration (objective importance)
// ------------------------------------------------------------------
app.post("/diagnostic-runs/:id/calibration", async (req, res) => {
  const runId = req.params.id;
  const { importance_map } = req.body;

  if (!importance_map || typeof importance_map !== "object") {
    return res.status(400).json({
      error: "importance_map is required and must be an object",
    });
  }

  // Verify run exists and is completed
  const { data: run, error: runError } = await req.supabase
    .from("diagnostic_runs")
    .select("id, status, spec_version")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found", details: runError?.message });
  }

  if (run.status !== "completed") {
    return res.status(409).json({ error: "Run must be completed before calibration" });
  }

  // Get the spec and inputs to determine locked objectives (Safety Valve)
  let spec;
  try {
    spec = SpecRegistry.get(run.spec_version);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }

  const { data: inputs, error: inputsError } = await req.supabase
    .from("diagnostic_inputs")
    .select("question_id, value")
    .eq("run_id", runId);

  if (inputsError) {
    return res.status(500).json({ error: inputsError.message });
  }

  // Find failed critical questions
  const inputMap = new Map((inputs || []).map((i: any) => [i.question_id, i.value]));
  const failedCriticals: string[] = [];

  for (const q of spec.questions) {
    if (q.is_critical && inputMap.get(q.id) !== true) {
      failedCriticals.push(q.id);
    }
  }

  // Find objectives that contain failed criticals (Safety Valve)
  const lockedObjectives = new Set<string>();
  for (const criticalId of failedCriticals) {
    const question = spec.questions.find((q: any) => q.id === criticalId);
    if (question?.objective_id) {
      lockedObjectives.add(question.objective_id);
    }
  }

  // Build final importance map with Safety Valve applied
  const finalMap: Record<string, number> = {};

  // Set all objectives to user values or default (3)
  for (const obj of spec.objectives || []) {
    const userValue = importance_map[obj.id];
    if (lockedObjectives.has(obj.id)) {
      finalMap[obj.id] = 5;  // Force to Critical
    } else if (typeof userValue === "number" && userValue >= 1 && userValue <= 5) {
      finalMap[obj.id] = userValue;
    } else {
      finalMap[obj.id] = 3;  // Default to Medium
    }
  }

  const calibrationData = {
    importance_map: finalMap,
    locked: Array.from(lockedObjectives),
  };

  // Save to database
  const { data, error } = await req.supabase
    .from("diagnostic_runs")
    .update({ calibration: calibrationData })
    .eq("id", runId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(calibrationData);
});

// ------------------------------------------------------------------
// VS21 — Get calibration data
// ------------------------------------------------------------------
app.get("/diagnostic-runs/:id/calibration", async (req, res) => {
  const runId = req.params.id;

  // First try with calibration column
  let run: any;
  let runError: any;

  const result = await req.supabase
    .from("diagnostic_runs")
    .select("id, calibration, status, spec_version")
    .eq("id", runId)
    .single();

  run = result.data;
  runError = result.error;

  // If calibration column doesn't exist, try without it
  if (runError && runError.message?.includes("calibration")) {
    const fallbackResult = await req.supabase
      .from("diagnostic_runs")
      .select("id, status, spec_version")
      .eq("id", runId)
      .single();

    run = fallbackResult.data ? { ...fallbackResult.data, calibration: null } : null;
    runError = fallbackResult.error;
  }

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found", details: runError?.message });
  }

  // If no calibration data, return defaults with locked objectives
  if (!run.calibration || Object.keys(run.calibration).length === 0) {
    // Get the spec and inputs to determine locked objectives
    let spec;
    try {
      spec = SpecRegistry.get(run.spec_version);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }

    const { data: inputs } = await req.supabase
      .from("diagnostic_inputs")
      .select("question_id, value")
      .eq("run_id", runId);

    // Find failed critical questions
    const inputMap = new Map((inputs || []).map((i: any) => [i.question_id, i.value]));
    const lockedObjectives = new Set<string>();

    for (const q of spec.questions) {
      if (q.is_critical && inputMap.get(q.id) !== true) {
        const question = spec.questions.find((sq: any) => sq.id === q.id);
        if (question?.objective_id) {
          lockedObjectives.add(question.objective_id);
        }
      }
    }

    // Build default importance map
    const defaultMap: Record<string, number> = {};
    for (const obj of spec.objectives || []) {
      defaultMap[obj.id] = lockedObjectives.has(obj.id) ? 5 : 3;
    }

    return res.json({
      importance_map: defaultMap,
      locked: Array.from(lockedObjectives),
    });
  }

  res.json(run.calibration);
});

// ------------------------------------------------------------------
// VS2 — Persist diagnostic input
// ------------------------------------------------------------------
app.post("/diagnostic-inputs", async (req, res) => {
  const { run_id, question_id, value } = req.body;

  if (!run_id || !question_id || value === undefined) {
    return res.status(400).json({
      error: "run_id, question_id and value are required",
    });
  }

  const { data, error } = await req.supabase
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
// VS3 — Debug validation endpoint
// ------------------------------------------------------------------
app.get("/diagnostic-runs/:id/validate", async (req, res) => {
  const result = await validateRun(req.supabase, req.params.id);
  res.json(result);
});

// ------------------------------------------------------------------
// VS3 — Complete / commit run
// ------------------------------------------------------------------
app.post("/diagnostic-runs/:id/complete", async (req, res) => {
  const runId = req.params.id;

  const { data: run, error: runError } = await req.supabase
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

  const result = await validateRun(req.supabase, runId);

  if (!result.valid) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.errors,
    });
  }

  const { error: updateError } = await req.supabase
    .from("diagnostic_runs")
    .update({ status: "completed" })
    .eq("id", runId);

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  res.json({ status: "completed" });
});

// ------------------------------------------------------------------
// VS4 — Score run
// ------------------------------------------------------------------
app.post("/diagnostic-runs/:id/score", async (req, res) => {
  const runId = req.params.id;
  const overwrite = String(req.query.overwrite) === "true";

  const { data: run, error: runError } = await req.supabase
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

  const { data: existingScores, error: existingError } = await req.supabase
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

  if (hasScores && overwrite) {
    const { error: delError } = await req.supabase
      .from("diagnostic_scores")
      .delete()
      .eq("run_id", runId);

    if (delError) {
      return res.status(500).json({ error: delError.message });
    }
  }

  let scores;
  try {
    scores = await scoreRun(req.supabase, runId);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }

  if (scores.length === 0) {
    return res.status(200).json([]);
  }

  const { data: inserted, error: insertError } = await req.supabase
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
// VS5 — Results
// ------------------------------------------------------------------
app.get("/diagnostic-runs/:id/results", async (req, res) => {
  const runId = req.params.id;

  const { data: run, error: runError } = await req.supabase
    .from("diagnostic_runs")
    .select("id, status, spec_version")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  if (run.status !== "completed") {
    return res.status(409).json({
      error: "Run must be completed before results can be computed",
    });
  }

  let spec;
  try {
    spec = SpecRegistry.get(run.spec_version);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }

  const { data: scores, error: scoresError } = await req.supabase
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

  const aggregateSpec = toAggregateSpec(spec);
  const results = aggregateResults(aggregateSpec, scores);

  res.json(results);
});

// ------------------------------------------------------------------
// VS6 — Finance Report
// ------------------------------------------------------------------
app.get("/diagnostic-runs/:id/report", async (req, res) => {
  const runId = req.params.id;

  const { data: run, error: runError } = await req.supabase
    .from("diagnostic_runs")
    .select("id, status, spec_version, context, calibration")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  if (run.status !== "completed") {
    return res.status(409).json({
      error: "Run must be completed before report can be generated",
    });
  }

  let spec;
  try {
    spec = SpecRegistry.get(run.spec_version);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }

  const { data: scores, error: scoresError } = await req.supabase
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

  const { data: inputs, error: inputsError } = await req.supabase
    .from("diagnostic_inputs")
    .select("question_id, value")
    .eq("run_id", runId);

  if (inputsError) {
    return res.status(500).json({ error: inputsError.message });
  }

  const aggregateSpec = toAggregateSpec(spec);
  const aggregateResult = aggregateResults(aggregateSpec, scores);

  const report = buildReport({
    run_id: runId,
    spec,
    aggregateResult,
    inputs: (inputs ?? []).map((i: { question_id: string; value: unknown }) => ({
      question_id: i.question_id,
      value: i.value,
    })),
    calibration: run.calibration || null,  // VS21: Pass calibration data
  });

  // VS18: Include context in report response
  // VS21: Include calibration in report response
  res.json({
    ...report,
    context: run.context || {},
    calibration: run.calibration || null,
  });
});

// ------------------------------------------------------------------
// Server
// ------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
