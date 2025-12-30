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
} from "./interpretation";
import { deriveCriticalRisks } from "./risks";
import { calculateMaturityV2 } from "./maturity/engine";
import interpretationRoutesV32 from "./interpretation/engine/routes";
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
// VS25 — Start interpretation (returns 202, async processing)
// ------------------------------------------------------------------
app.post("/diagnostic-runs/:id/interpret/start", async (req, res) => {
  const runId = req.params.id;

  // Verify run exists and is completed
  const { data: run, error: runError } = await req.supabase
    .from("diagnostic_runs")
    .select("id, status, spec_version, context")
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

  // Check for existing session - prevent duplicate pipelines
  const existingSession = await getSessionByRunId(req.supabase, runId);
  if (existingSession) {
    // VS-36: If restart=true and session is complete, delete it and start fresh
    if (restart === true && existingSession.status === "complete") {
      // Delete existing session data to allow fresh start
      await req.supabase
        .from("interpretation_reports")
        .delete()
        .eq("run_id", runId);
      await req.supabase
        .from("interpretation_steps")
        .delete()
        .eq("session_id", existingSession.id);
      await req.supabase
        .from("interpretation_sessions")
        .delete()
        .eq("id", existingSession.id);
      // Continue to create new session below
    } else {
      // If complete (and not restart), return the report
      if (existingSession.status === "complete") {
        const report = await getReport(req.supabase, runId);
        if (report) {
          return res.json({
            session_id: existingSession.id,
            status: "complete",
            report,
          });
        }
      }
      // If already in progress, return current status (no duplicate)
      if (existingSession.status === "pending" || existingSession.status === "generating" || existingSession.status === "finalizing") {
        return res.status(202).json({
          session_id: existingSession.id,
          status: existingSession.status,
          message: "Interpretation already in progress",
          poll_url: `/diagnostic-runs/${runId}/interpret/status`,
        });
      }
      // If awaiting_user, return questions
      if (existingSession.status === "awaiting_user") {
        const questions = await getQuestions(req.supabase, existingSession.id);
        return res.status(202).json({
          session_id: existingSession.id,
          status: "awaiting_user",
          questions,
        });
      }
      // If failed, allow retry by continuing (will create new session below)
    }
  }

  // Build diagnostic data for interpretation
  let spec;
  try {
    spec = SpecRegistry.get(run.spec_version);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }

  const { data: scores } = await req.supabase
    .from("diagnostic_scores")
    .select("question_id, score")
    .eq("run_id", runId);

  const { data: inputs } = await req.supabase
    .from("diagnostic_inputs")
    .select("question_id, value")
    .eq("run_id", runId);

  const { data: calibration } = await req.supabase
    .from("diagnostic_runs")
    .select("calibration")
    .eq("id", runId)
    .single();

  const aggregateSpec = toAggregateSpec(spec);
  const aggregateResult = aggregateResults(aggregateSpec, scores || []);

  // Calculate maturity level
  const maturityResult = calculateMaturityV2({
    answers: (inputs || []).map((i: any) => ({ question_id: i.question_id, value: i.value })),
    questions: spec.questions.map((q: any) => ({ id: q.id, text: q.text, level: q.level })),
  });

  // Build objective scores
  const objectiveScores: ObjectiveScore[] = (spec.objectives || []).map((obj: any) => {
    const objQuestions = spec.questions.filter((q: any) => q.objective_id === obj.id);
    const objScores = (scores || []).filter((s: any) =>
      objQuestions.some((q: any) => q.id === s.question_id)
    );
    const avgScore = objScores.length > 0
      ? objScores.reduce((sum: number, s: any) => sum + s.score, 0) / objScores.length * 100
      : 0;
    const hasCritical = objQuestions.some((q: any) => {
      if (!q.is_critical) return false;
      const input = (inputs || []).find((i: any) => i.question_id === q.id);
      return input?.value !== true;
    });
    const importance = calibration?.calibration?.importance_map?.[obj.id] || 3;

    return {
      id: obj.id,
      name: obj.name,
      score: Math.round(avgScore),
      has_critical_failure: hasCritical,
      importance,
      level: obj.level,
    };
  });

  // Build initiatives
  const initiatives: Initiative[] = (spec.initiatives || []).map((init: any) => {
    const obj = objectiveScores.find((o) => o.id === init.objective_id);
    let priority: "P1" | "P2" | "P3" = "P3";
    if (obj?.has_critical_failure || (obj?.score || 0) < 50) {
      priority = "P1";
    } else if ((obj?.score || 0) < 80) {
      priority = "P2";
    }
    return {
      id: init.id,
      title: init.title,
      recommendation: init.description || "",
      priority,
      objective_id: init.objective_id,
    };
  });

  // Get critical risks for capping info
  const criticalRisks = deriveCriticalRisks(
    (inputs || []).map((i: any) => ({ question_id: i.question_id, value: i.value })),
    spec
  );

  // Normalize context for backward compatibility
  const normalizedCtx = normalizeContext(run.context);

  const diagnosticData: DiagnosticData = {
    run_id: runId,
    company_name: normalizedCtx.company.name,
    industry: normalizedCtx.company.industry || "Unknown Industry",
    team_size: normalizedCtx.pillar?.team_size || undefined,
    pain_points: normalizedCtx.pillar?.pain_points || undefined,
    systems: normalizedCtx.pillar?.tools?.join(", ") || undefined,
    execution_score: maturityResult.execution_score,
    maturity_level: maturityResult.actual_level,
    level_name: maturityResult.actual_label,
    capped: maturityResult.capped,
    capped_by_titles: criticalRisks.map((r) => r.pillarName),
    objectives: objectiveScores,
    initiatives,
    critical_risks: criticalRisks.map((r) => ({
      id: r.questionId,
      title: r.questionText,
      objective_id: spec.questions.find((q: any) => q.id === r.questionId)?.objective_id || "",
    })),
  };

  // Run pipeline (synchronous for now, can be made async with job queue later)
  try {
    const result = await runPipeline(req.supabase, diagnosticData);

    if (result.status === "awaiting_user") {
      return res.status(202).json({
        session_id: result.session_id,
        status: "awaiting_user",
        questions: result.questions,
        poll_url: `/diagnostic-runs/${runId}/interpret/status`,
      });
    }

    if (result.status === "complete") {
      return res.json({
        session_id: result.session_id,
        status: "complete",
        report: result.report,
      });
    }

    return res.status(500).json({
      session_id: result.session_id,
      status: "failed",
      error: result.error,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ------------------------------------------------------------------
// VS25 — Get interpretation status
// ------------------------------------------------------------------
app.get("/diagnostic-runs/:id/interpret/status", async (req, res) => {
  const runId = req.params.id;

  const session = await getSessionByRunId(req.supabase, runId);
  if (!session) {
    return res.status(404).json({ error: "No interpretation session found" });
  }

  if (session.status === "complete") {
    const report = await getReport(req.supabase, runId);
    return res.json({
      session_id: session.id,
      status: "complete",
      report,
    });
  }

  if (session.status === "awaiting_user") {
    const questions = await getQuestions(req.supabase, session.id);
    return res.json({
      session_id: session.id,
      status: "awaiting_user",
      questions,
    });
  }

  if (session.status === "failed") {
    return res.json({
      session_id: session.id,
      status: "failed",
    });
  }

  // Still processing
  return res.json({
    session_id: session.id,
    status: session.status,
    progress: {
      current_round: session.current_round,
      total_questions_asked: session.total_questions_asked,
    },
  });
});

// ------------------------------------------------------------------
// VS25 — Submit interpretation answers
// ------------------------------------------------------------------
app.post("/diagnostic-runs/:id/interpret/answer", async (req, res) => {
  const runId = req.params.id;
  const { answers } = req.body;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: "answers array is required" });
  }

  const session = await getSessionByRunId(req.supabase, runId);
  if (!session) {
    return res.status(404).json({ error: "No interpretation session found" });
  }

  if (session.status !== "awaiting_user") {
    return res.status(409).json({ error: "Session is not awaiting answers" });
  }

  // Get run context for resuming
  const { data: run } = await req.supabase
    .from("diagnostic_runs")
    .select("id, spec_version, context, calibration")
    .eq("id", runId)
    .single();

  if (!run) {
    return res.status(404).json({ error: "Run not found" });
  }

  // Rebuild diagnostic data (same as start endpoint)
  let spec;
  try {
    spec = SpecRegistry.get(run.spec_version);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }

  const { data: scores } = await req.supabase
    .from("diagnostic_scores")
    .select("question_id, score")
    .eq("run_id", runId);

  const { data: inputs } = await req.supabase
    .from("diagnostic_inputs")
    .select("question_id, value")
    .eq("run_id", runId);

  const aggregateSpec = toAggregateSpec(spec);
  const aggregateResult = aggregateResults(aggregateSpec, scores || []);

  const objectiveScores: ObjectiveScore[] = (spec.objectives || []).map((obj: any) => {
    const objQuestions = spec.questions.filter((q: any) => q.objective_id === obj.id);
    const objScores = (scores || []).filter((s: any) =>
      objQuestions.some((q: any) => q.id === s.question_id)
    );
    const avgScore = objScores.length > 0
      ? objScores.reduce((sum: number, s: any) => sum + s.score, 0) / objScores.length * 100
      : 0;
    const hasCritical = objQuestions.some((q: any) => {
      if (!q.is_critical) return false;
      const input = (inputs || []).find((i: any) => i.question_id === q.id);
      return input?.value !== true;
    });
    const importance = run.calibration?.importance_map?.[obj.id] || 3;

    return {
      id: obj.id,
      name: obj.name,
      score: Math.round(avgScore),
      has_critical_failure: hasCritical,
      importance,
      level: obj.level,
    };
  });

  const initiatives: Initiative[] = (spec.initiatives || []).map((init: any) => {
    const obj = objectiveScores.find((o) => o.id === init.objective_id);
    let priority: "P1" | "P2" | "P3" = "P3";
    if (obj?.has_critical_failure || (obj?.score || 0) < 50) {
      priority = "P1";
    } else if ((obj?.score || 0) < 80) {
      priority = "P2";
    }
    return {
      id: init.id,
      title: init.title,
      recommendation: init.description || "",
      priority,
      objective_id: init.objective_id,
    };
  });

  // Get critical risks for capping info (inputs first, then spec)
  const criticalRisks = deriveCriticalRisks(
    (inputs || []).map((i: any) => ({ question_id: i.question_id, value: i.value })),
    spec
  );

  // Calculate maturity using maturity engine
  const maturityResult = calculateMaturityV2({
    answers: (inputs || []).map((i: any) => ({ question_id: i.question_id, value: i.value })),
    questions: spec.questions.map((q: any) => ({ id: q.id, text: q.text, level: q.level })),
  });

  // Normalize context for backward compatibility
  const normalizedCtx = normalizeContext(run.context);

  const diagnosticData: DiagnosticData = {
    run_id: runId,
    company_name: normalizedCtx.company.name,
    industry: normalizedCtx.company.industry || "Unknown Industry",
    team_size: normalizedCtx.pillar?.team_size || undefined,
    pain_points: normalizedCtx.pillar?.pain_points || undefined,
    systems: normalizedCtx.pillar?.tools?.join(", ") || undefined,
    execution_score: maturityResult.execution_score,
    maturity_level: maturityResult.actual_level,
    level_name: maturityResult.actual_label,
    capped: maturityResult.capped,
    capped_by_titles: criticalRisks.map((r) => r.pillarName),
    objectives: objectiveScores,
    initiatives,
    critical_risks: criticalRisks.map((r) => ({
      id: r.questionId,
      title: r.questionText,
      objective_id: spec.questions.find((q: any) => q.id === r.questionId)?.objective_id || "",
    })),
  };

  try {
    const result = await resumePipeline(req.supabase, session.id, answers, diagnosticData);

    if (result.status === "awaiting_user") {
      return res.status(202).json({
        session_id: result.session_id,
        status: "awaiting_user",
        questions: result.questions,
      });
    }

    if (result.status === "complete") {
      return res.json({
        session_id: result.session_id,
        status: "complete",
        report: result.report,
      });
    }

    return res.status(500).json({
      session_id: result.session_id,
      status: "failed",
      error: result.error,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ------------------------------------------------------------------
// VS25 — Get interpretation report
// ------------------------------------------------------------------
app.get("/diagnostic-runs/:id/interpret/report", async (req, res) => {
  const runId = req.params.id;

  const report = await getReport(req.supabase, runId);
  if (!report) {
    return res.status(404).json({ error: "No interpretation report found" });
  }

  res.json(report);
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
// VS-32: Simplified Interpretation Routes
// ------------------------------------------------------------------
app.use("/diagnostic-runs", interpretationRoutesV32);

// ------------------------------------------------------------------
// Server
// ------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
