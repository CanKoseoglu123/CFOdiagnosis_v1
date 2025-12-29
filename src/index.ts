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
import {
  runPipeline,
  resumePipeline,
  getSessionByRunId,
  getQuestions,
  getReport,
  DiagnosticData,
  ObjectiveScore,
  Initiative,
  precomputeInput,
  generateOverview,
} from "./interpretation";
import {
  runVS32cPipeline,
  submitAnswersAndContinue,
  getVS32cStatus,
  getVS32cReport,
} from "./interpretation/pipeline-vs32c";
import { AIInterpretationInput, VS32cClarifierAnswer } from "./interpretation/types";
import { deriveCriticalRisks } from "./risks";
import { calculateMaturityV2 } from "./maturity/engine";
import {
  DiagnosticContextV1Schema,
  CompanyContextSchema,
  PillarContextSchema,
  DiagnosticContextV1
} from "./specs/schemas";
import { normalizeContext } from "./utils/contextAdapter";

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
    practices: spec.practices || [],  // v2.9.0: question → practice → objective
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
// VS18 — Get diagnostic run details (includes inputs for resume)
// ------------------------------------------------------------------
app.get("/diagnostic-runs/:id", async (req, res) => {
  const runId = req.params.id;

  // Fetch run details
  const { data: run, error } = await req.supabase
    .from("diagnostic_runs")
    .select("id, status, spec_version, context, setup_completed_at, created_at")
    .eq("id", runId)
    .single();

  if (error || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  // Fetch inputs (answers) for the run - allows frontend to restore progress
  const { data: inputs } = await req.supabase
    .from("diagnostic_inputs")
    .select("question_id, value")
    .eq("run_id", runId);

  // Normalize context to v1 format for backward compatibility
  res.json({
    ...run,
    context: normalizeContext(run.context),
    inputs: inputs || []
  });
});

// ------------------------------------------------------------------
// VS18/VS25 — Complete setup (save context, mark setup complete)
// Accepts either legacy format { company_name, industry } or v1 format { company, pillar }
// ------------------------------------------------------------------
app.post("/diagnostic-runs/:id/setup", async (req, res) => {
  const runId = req.params.id;
  const body = req.body;

  // Detect format: v1 has 'company' object, legacy has 'company_name' string
  const isV1Format = body.company && typeof body.company === 'object';

  let context: DiagnosticContextV1 | { company_name: string; industry: string };

  if (isV1Format) {
    // VS25: Full v1 context validation
    const result = DiagnosticContextV1Schema.safeParse({
      version: 'v1',
      company: body.company,
      pillar: body.pillar
    });

    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.issues.map((i) =>
          `${String(i.path.join('.'))}: ${i.message}`
        )
      });
    }

    context = result.data;
  } else {
    // Legacy format: just company_name and industry
    const { company_name, industry } = body;

    if (!company_name || !industry) {
      return res.status(400).json({
        error: "company_name and industry are required (legacy format), or provide company and pillar objects (v1 format)",
      });
    }

    context = { company_name, industry };
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
      context,
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

  // VS18: Include context in report response (normalized for backward compatibility)
  // VS21: Include calibration in report response
  res.json({
    ...report,
    context: normalizeContext(run.context),
    calibration: run.calibration || null,
  });
});

// ------------------------------------------------------------------
// VS-32c — Start interpretation (Critic + Clarifying Questions pipeline)
// ------------------------------------------------------------------
app.post("/diagnostic-runs/:id/interpret/start", async (req, res) => {
  const runId = req.params.id;

  // Verify run exists and is completed
  const { data: run, error: runError } = await req.supabase
    .from("diagnostic_runs")
    .select("id, status")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  if (run.status !== "completed") {
    return res.status(409).json({ error: "Run must be completed before interpretation" });
  }

  // VS-36: Support restart flag to regenerate insights
  const { restart } = req.body || {};

  // Check for existing VS-32c pipeline state
  const existingStatus = await getVS32cStatus(req.supabase, runId);
  if (existingStatus) {
    const { status, progress, pending_questions } = existingStatus;

    // VS-36: If restart=true, clear existing session and start fresh
    // Supports restarting from completed, failed, or stuck states
    if (restart === true) {
      await req.supabase
        .from("interpretation_reports")
        .delete()
        .eq("run_id", runId);
      await req.supabase
        .from("interpretation_sessions")
        .delete()
        .eq("run_id", runId);
      // Continue to create new session below
    } else {
      // If completed, return the report
      if (status === "completed") {
        const report = await getVS32cReport(req.supabase, runId);
        return res.json({
          session_id: runId,
          status: "completed",
          overview_sections: report?.sections || [],
          quality_status: report?.quality_status || "green",
          rounds_used: report?.rounds_used || 1,
          heuristic_warnings: report?.heuristic_warnings || [],
        });
      }

      // If in progress, return current status
      if (["pending", "generating", "heuristics", "critic", "rewriting"].includes(status)) {
        return res.status(202).json({
          session_id: runId,
          status,
          loop_round: progress?.current_round || 1,
          message: "Interpretation in progress",
          poll_url: `/diagnostic-runs/${runId}/interpret/status`,
        });
      }

      // If awaiting_answers, return pending questions
      if (status === "awaiting_answers" && pending_questions) {
        return res.status(202).json({
          session_id: runId,
          status: "awaiting_answers",
          pending_questions,
          loop_round: progress?.current_round || 1,
        });
      }

      // If failed, allow retry
    }
  }

  // Build VS-32c input using precompute helper
  try {
    const input = await precomputeInput(req.supabase, runId);

    // Run VS-32c pipeline
    const result = await runVS32cPipeline(req.supabase, input);

    // Map result to VS-32c response format
    if (result.status === "awaiting_answers") {
      return res.status(202).json({
        session_id: result.session_id,
        status: "awaiting_answers",
        pending_questions: result.pending_questions || [],
        loop_round: result.loop_round || 1,
        poll_url: `/diagnostic-runs/${runId}/interpret/status`,
      });
    }

    if (result.status === "completed") {
      return res.json({
        session_id: result.session_id,
        status: "completed",
        overview_sections: result.overview_sections || [],
        quality_status: result.quality_status || "green",
        rounds_used: result.loop_round || 1,
        heuristics_result: result.heuristics_result || null,
      });
    }

    return res.status(500).json({
      session_id: result.session_id,
      status: "failed",
      error: result.error_message || "Pipeline failed",
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ------------------------------------------------------------------
// VS-32c — Get interpretation status
// ------------------------------------------------------------------
app.get("/diagnostic-runs/:id/interpret/status", async (req, res) => {
  const runId = req.params.id;

  const pipelineStatus = await getVS32cStatus(req.supabase, runId);
  if (!pipelineStatus) {
    return res.status(404).json({ error: "No interpretation session found" });
  }

  const { status, progress, pending_questions } = pipelineStatus;

  // Completed - include overview sections
  if (status === "completed") {
    const report = await getVS32cReport(req.supabase, runId);
    return res.json({
      session_id: runId,
      status: "completed",
      overview_sections: report?.sections || [],
      quality_status: report?.quality_status || "green",
      rounds_used: report?.rounds_used || 1,
      heuristics_result: report?.heuristics_result || null,
      total_questions_asked: progress?.total_questions_asked || 0,
    });
  }

  // Awaiting user answers - include questions
  if (status === "awaiting_answers") {
    return res.json({
      session_id: runId,
      status: "awaiting_answers",
      pending_questions: pending_questions || [],
      loop_round: progress?.current_round || 1,
      total_questions_asked: progress?.total_questions_asked || 0,
    });
  }

  // Failed state
  if (status === "failed") {
    return res.json({
      session_id: runId,
      status: "failed",
      error_message: "Pipeline failed",
    });
  }

  // Still processing (generating, heuristics, critic, rewriting)
  return res.json({
    session_id: runId,
    status,
    loop_round: progress?.current_round || 1,
    total_questions_asked: progress?.total_questions_asked || 0,
  });
});

// ------------------------------------------------------------------
// VS-32c — Submit interpretation answers (clarifying questions)
// ------------------------------------------------------------------
app.post("/diagnostic-runs/:id/interpret/answer", async (req, res) => {
  const runId = req.params.id;
  const { answers } = req.body;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: "answers array is required" });
  }

  // Check pipeline is awaiting answers
  const pipelineStatus = await getVS32cStatus(req.supabase, runId);
  if (!pipelineStatus) {
    return res.status(404).json({ error: "No interpretation session found" });
  }

  if (pipelineStatus.status !== "awaiting_answers") {
    return res.status(409).json({
      error: "Session is not awaiting answers",
      current_status: pipelineStatus.status,
    });
  }

  try {
    // Build input and submit answers using VS-32c pipeline
    const input = await precomputeInput(req.supabase, runId);
    const result = await submitAnswersAndContinue(req.supabase, runId, answers, input);

    if (result.status === "awaiting_answers") {
      return res.status(202).json({
        session_id: result.session_id,
        status: "awaiting_answers",
        pending_questions: result.pending_questions || [],
        loop_round: result.loop_round || 1,
      });
    }

    if (result.status === "completed") {
      return res.json({
        session_id: result.session_id,
        status: "completed",
        overview_sections: result.overview_sections || [],
        quality_status: result.quality_status || "green",
        heuristics_result: result.heuristics_result,
        loop_round: result.loop_round || 1,
        total_questions_asked: result.total_questions_asked || 0,
      });
    }

    return res.status(500).json({
      session_id: result.session_id,
      status: "failed",
      error: result.error_message || "Pipeline failed",
    });
  } catch (error) {
    console.error("VS-32c answer submission failed:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ------------------------------------------------------------------
// VS-32c — Get interpretation report
// ------------------------------------------------------------------
app.get("/diagnostic-runs/:id/interpret/report", async (req, res) => {
  const runId = req.params.id;

  const report = await getVS32cReport(req.supabase, runId);
  if (!report) {
    return res.status(404).json({ error: "No interpretation report found" });
  }

  // Return VS-32c format
  res.json({
    session_id: runId,
    status: "completed",
    overview_sections: report.sections || [],
    quality_status: report.quality_status || "green",
    heuristics_result: report.heuristics_result,
    rounds_used: report.rounds_used || 1,
    total_questions_asked: report.total_questions_asked || 0,
  });
});

// ------------------------------------------------------------------
// VS25 — Submit interpretation feedback
// ------------------------------------------------------------------
app.post("/diagnostic-runs/:id/interpret/feedback", async (req, res) => {
  const runId = req.params.id;
  const { rating, feedback } = req.body;

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "rating must be a number between 1 and 5" });
  }

  const session = await getSessionByRunId(req.supabase, runId);
  if (!session) {
    return res.status(404).json({ error: "No interpretation session found" });
  }

  const { error } = await req.supabase
    .from("interpretation_sessions")
    .update({
      user_rating: rating,
      user_feedback: feedback || null,
    })
    .eq("id", session.id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
});

// ------------------------------------------------------------------
// VS-32a — Start overview generation (single-call, async)
// ------------------------------------------------------------------
app.post("/diagnostic-runs/:id/overview/start", async (req, res) => {
  const runId = req.params.id;

  // Verify run exists and is completed
  const { data: run, error: runError } = await req.supabase
    .from("diagnostic_runs")
    .select("id, status")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  if (run.status !== "completed") {
    return res.status(409).json({ error: "Run must be completed before overview generation" });
  }

  // Check for existing in-progress generation (prevent race condition)
  const { data: existing } = await req.supabase
    .from("interpretation_reports")
    .select("id, status, overview_sections, version")
    .eq("run_id", runId)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    // If already generating, return status
    if (existing.status === "generating") {
      return res.status(202).json({
        status: "generating",
        report_id: existing.id,
        message: "Generation already in progress",
      });
    }
    // If already completed with overview, return it
    if (existing.status === "completed" && existing.overview_sections) {
      return res.json({
        status: "completed",
        report_id: existing.id,
        overview_sections: existing.overview_sections,
      });
    }
  }

  // Create new report record
  const { data: report, error: insertError } = await req.supabase
    .from("interpretation_reports")
    .insert({
      run_id: runId,
      status: "generating",
      version: (existing?.version || 0) + 1,
    })
    .select()
    .single();

  if (insertError || !report) {
    return res.status(500).json({ error: insertError?.message || "Failed to create report" });
  }

  // Generate async (don't block response)
  const supabaseClient = req.supabase;
  (async () => {
    try {
      const input = await precomputeInput(supabaseClient, runId);
      // VS-32b: Now returns heuristics and attempts
      const { sections, tokensUsed, heuristics, attempts } = await generateOverview(input);

      await supabaseClient
        .from("interpretation_reports")
        .update({
          status: "completed",
          overview_sections: sections,
          model_used: "gpt-4o",
          tokens_used: tokensUsed,
          heuristics_result: heuristics,
          generation_attempts: attempts,
          updated_at: new Date().toISOString(),
        })
        .eq("id", report.id);
    } catch (error: any) {
      console.error("VS-32a generation failed:", error);
      await supabaseClient
        .from("interpretation_reports")
        .update({
          status: "failed",
          error_message: error.message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", report.id);
    }
  })();

  return res.status(202).json({
    status: "generating",
    report_id: report.id,
    poll_url: `/diagnostic-runs/${runId}/overview/status`,
  });
});

// ------------------------------------------------------------------
// VS-32a — Get overview status
// ------------------------------------------------------------------
app.get("/diagnostic-runs/:id/overview/status", async (req, res) => {
  const runId = req.params.id;

  const { data: report, error } = await req.supabase
    .from("interpretation_reports")
    .select("*")
    .eq("run_id", runId)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  if (error || !report) {
    return res.json({ status: "none", report: null });
  }

  return res.json({
    status: report.status,
    report: {
      id: report.id,
      version: report.version,
      overview_sections: report.overview_sections,
      error_message: report.error_message,
      model_used: report.model_used,
      tokens_used: report.tokens_used,
      // VS-32b: Include heuristics results
      heuristics_result: report.heuristics_result,
      generation_attempts: report.generation_attempts,
      created_at: report.created_at,
      updated_at: report.updated_at,
    },
  });
});

// ------------------------------------------------------------------
// VS-32a — Regenerate overview
// ------------------------------------------------------------------
app.post("/diagnostic-runs/:id/overview/regenerate", async (req, res) => {
  const runId = req.params.id;

  // Verify run exists and is completed
  const { data: run, error: runError } = await req.supabase
    .from("diagnostic_runs")
    .select("id, status")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  if (run.status !== "completed") {
    return res.status(409).json({ error: "Run must be completed" });
  }

  // Get current version
  const { data: current } = await req.supabase
    .from("interpretation_reports")
    .select("version")
    .eq("run_id", runId)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const newVersion = (current?.version || 0) + 1;

  // Create new version
  const { data: report, error: insertError } = await req.supabase
    .from("interpretation_reports")
    .insert({
      run_id: runId,
      status: "generating",
      version: newVersion,
    })
    .select()
    .single();

  if (insertError || !report) {
    return res.status(500).json({ error: insertError?.message || "Failed to create report" });
  }

  // Generate async
  const supabaseClient = req.supabase;
  (async () => {
    try {
      const input = await precomputeInput(supabaseClient, runId);
      // VS-32b: Now returns heuristics and attempts
      const { sections, tokensUsed, heuristics, attempts } = await generateOverview(input);

      await supabaseClient
        .from("interpretation_reports")
        .update({
          status: "completed",
          overview_sections: sections,
          model_used: "gpt-4o",
          tokens_used: tokensUsed,
          heuristics_result: heuristics,
          generation_attempts: attempts,
          updated_at: new Date().toISOString(),
        })
        .eq("id", report.id);
    } catch (error: any) {
      console.error("VS-32a regeneration failed:", error);
      await supabaseClient
        .from("interpretation_reports")
        .update({
          status: "failed",
          error_message: error.message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", report.id);
    }
  })();

  return res.status(202).json({
    status: "generating",
    report_id: report.id,
    version: newVersion,
    poll_url: `/diagnostic-runs/${runId}/overview/status`,
  });
});

// ------------------------------------------------------------------
// VS-32c — Start overview generation with Critic loop
// ------------------------------------------------------------------
app.post("/diagnostic-runs/:id/overview/vs32c/start", async (req, res) => {
  const runId = req.params.id;

  // Verify run exists and is completed
  const { data: run, error: runError } = await req.supabase
    .from("diagnostic_runs")
    .select("id, status")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  if (run.status !== "completed") {
    return res.status(409).json({ error: "Run must be completed before overview generation" });
  }

  // Check for existing in-progress generation
  const { data: existing } = await req.supabase
    .from("interpretation_reports")
    .select("id, status, vs32c_stage")
    .eq("run_id", runId)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  if (existing && ["generating", "critic", "awaiting_answers", "rewriting"].includes(existing.status)) {
    const statusResult = await getVS32cStatus(req.supabase, runId);
    return res.status(202).json(statusResult);
  }

  // Start VS-32c pipeline asynchronously
  const supabaseClient = req.supabase;
  (async () => {
    try {
      const input = await precomputeInput(supabaseClient, runId);
      await runVS32cPipeline(supabaseClient, input);
    } catch (error: any) {
      console.error("VS-32c pipeline failed:", error);
    }
  })();

  return res.status(202).json({
    status: "generating",
    message: "VS-32c pipeline started",
    poll_url: `/diagnostic-runs/${runId}/overview/vs32c/status`,
  });
});

// ------------------------------------------------------------------
// VS-32c — Get pipeline status (poll endpoint)
// ------------------------------------------------------------------
app.get("/diagnostic-runs/:id/overview/vs32c/status", async (req, res) => {
  const runId = req.params.id;

  const statusResult = await getVS32cStatus(req.supabase, runId);
  return res.json(statusResult);
});

// ------------------------------------------------------------------
// VS-32c — Submit clarifier answers
// ------------------------------------------------------------------
app.post("/diagnostic-runs/:id/overview/vs32c/answer", async (req, res) => {
  const runId = req.params.id;
  const { answers } = req.body;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: "answers array is required" });
  }

  // Validate answer format
  for (const answer of answers) {
    if (!answer.question_id || typeof answer.answer !== "string") {
      return res.status(400).json({
        error: "Each answer must have question_id and answer string"
      });
    }
  }

  // Get the current interpretation report
  const { data: report, error: reportError } = await req.supabase
    .from("interpretation_reports")
    .select("id, status, vs32c_stage")
    .eq("run_id", runId)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  if (reportError || !report) {
    return res.status(404).json({ error: "No interpretation report found" });
  }

  if (report.status !== "awaiting_answers" && report.vs32c_stage !== "awaiting_answers") {
    return res.status(409).json({
      error: "Pipeline is not awaiting answers",
      current_status: report.status,
      current_stage: report.vs32c_stage
    });
  }

  // Continue pipeline with answers asynchronously
  const supabaseClient = req.supabase;
  (async () => {
    try {
      const input = await precomputeInput(supabaseClient, runId);
      await submitAnswersAndContinue(supabaseClient, runId, answers, input);
    } catch (error: any) {
      console.error("VS-32c answer submission failed:", error);
    }
  })();

  return res.status(202).json({
    status: "rewriting",
    message: "Answers received, continuing pipeline",
    poll_url: `/diagnostic-runs/${runId}/overview/vs32c/status`,
  });
});

// ------------------------------------------------------------------
// VS-32c — Get final report with heuristics
// ------------------------------------------------------------------
app.get("/diagnostic-runs/:id/overview/vs32c/report", async (req, res) => {
  const runId = req.params.id;

  const report = await getVS32cReport(req.supabase, runId);

  if (!report) {
    return res.status(404).json({ error: "No VS-32c report found" });
  }

  return res.json(report);
});

// ------------------------------------------------------------------
// VS28 — Get action plan for a run
// ------------------------------------------------------------------
app.get("/diagnostic-runs/:id/action-plan", async (req, res) => {
  const runId = req.params.id;

  // Verify run exists
  const { data: run, error: runError } = await req.supabase
    .from("diagnostic_runs")
    .select("id")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  // Get all action plan items for this run
  const { data: actions, error } = await req.supabase
    .from("action_plans")
    .select("*")
    .eq("run_id", runId)
    .order("created_at", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(actions || []);
});

// ------------------------------------------------------------------
// VS28 — Upsert action plan item (auto-save on toggle)
// ------------------------------------------------------------------
app.post("/diagnostic-runs/:id/action-plan", async (req, res) => {
  const runId = req.params.id;
  const { question_id, status, timeline, assigned_owner } = req.body;

  if (!question_id) {
    return res.status(400).json({ error: "question_id is required" });
  }

  // Validate status
  const validStatuses = ["planned", "completed"];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: "status must be 'planned' or 'completed'" });
  }

  // Validate timeline
  const validTimelines = ["6m", "12m", "24m", null];
  if (timeline !== undefined && !validTimelines.includes(timeline)) {
    return res.status(400).json({ error: "timeline must be '6m', '12m', '24m', or null" });
  }

  // Verify run exists
  const { data: run, error: runError } = await req.supabase
    .from("diagnostic_runs")
    .select("id")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  // Upsert the action plan item
  const { data, error } = await req.supabase
    .from("action_plans")
    .upsert(
      {
        run_id: runId,
        question_id,
        status: status || "planned",
        timeline: timeline ?? null,
        assigned_owner: assigned_owner ?? null,
      },
      { onConflict: "run_id,question_id" }
    )
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json(data);
});

// ------------------------------------------------------------------
// VS28 — Delete action plan item
// ------------------------------------------------------------------
app.delete("/diagnostic-runs/:id/action-plan/:questionId", async (req, res) => {
  const runId = req.params.id;
  const questionId = req.params.questionId;

  // Delete the action plan item
  const { error } = await req.supabase
    .from("action_plans")
    .delete()
    .eq("run_id", runId)
    .eq("question_id", questionId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(204).send();
});

// ------------------------------------------------------------------
// Server
// ------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
