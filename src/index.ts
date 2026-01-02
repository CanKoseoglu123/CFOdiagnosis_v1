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
import { buildMaturityFootprint } from "./maturity/footprint";
import interpretationRoutesV32 from "./interpretation/engine/routes";
import {
  DiagnosticContextV1Schema,
  CompanyContextSchema,
  PillarContextSchema,
  DiagnosticContextV1
} from "./specs/schemas";
import { normalizeContext } from "./utils/contextAdapter";
import { generatePdf } from "./pdfGenerator";

const app = express();

// CORS: Allow production domains and Vercel preview deployments
const allowedOrigins = [
  "https://cfo-lens.com",
  "https://cfodiagnosisv1.vercel.app",
  "http://localhost:5173", // dev
  "http://localhost:5174", // dev alternate port
];

// Pattern for Vercel preview deployments (git branch previews)
const vercelPreviewPattern = /^https:\/\/cfodiagnosisv1-git-[a-z0-9-]+(-cans-projects-[a-z0-9]+)?\.vercel\.app$/;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow Vercel preview deployments
    if (vercelPreviewPattern.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
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
// PDF Test endpoint - Validates DocRaptor Cloud PDF API
// ------------------------------------------------------------------
app.get("/pdf-test", async (_req, res) => {
  const startTime = Date.now();

  try {
    const apiKey = process.env.DOCRAPTOR_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "PDF generation not configured",
        message: "DOCRAPTOR_API_KEY environment variable not set",
      });
    }

    console.log("[PDF-TEST] Starting DocRaptor PDF generation...");

    // Simple test HTML
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 0; color: #1e293b; }
          h1 { color: #1e3a5f; margin-bottom: 24px; }
          .box { background: #f0f4f8; padding: 24px; margin: 24px 0; }
          .stat { display: inline-block; margin-right: 40px; }
          .stat-value { font-size: 32px; font-weight: bold; color: #1e3a5f; }
          .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
          .timestamp { color: #94a3b8; font-size: 11px; margin-top: 40px; }
        </style>
      </head>
      <body>
        <h1>CFO Lens - Executive Report</h1>
        <div class="box">
          <div class="stat">
            <div class="stat-value">78</div>
            <div class="stat-label">Overall Score</div>
          </div>
          <div class="stat">
            <div class="stat-value">L3</div>
            <div class="stat-label">Maturity Level</div>
          </div>
          <div class="stat">
            <div class="stat-value">12</div>
            <div class="stat-label">Actions Planned</div>
          </div>
        </div>
        <p><strong>Status:</strong> DocRaptor Cloud PDF API is working!</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || "development"}</p>
        <p class="timestamp">This PDF was generated using DocRaptor Cloud PDF API to validate the Executive Report export pipeline.</p>
      </body>
      </html>
    `;

    // Call DocRaptor API
    const response = await fetch("https://api.docraptor.com/docs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_credentials: apiKey,
        doc: {
          name: "pdf-test.pdf",
          document_type: "pdf",
          document_content: testHtml,
          test: process.env.DOCRAPTOR_TEST_MODE === "true" || process.env.NODE_ENV !== "production", // Free test mode
          prince_options: {
            media: "print",
            baseurl: "https://cfo-lens.com",
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DocRaptor API error: ${response.status} - ${errorText}`);
    }

    const pdfBuffer = Buffer.from(await response.arrayBuffer());

    const duration = Date.now() - startTime;
    console.log(`[PDF-TEST] Success! Generated ${pdfBuffer.length} bytes in ${duration}ms`);

    // Return PDF with proper headers
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=pdf-test.pdf",
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[PDF-TEST] Failed after ${duration}ms:`, error.message);

    res.status(500).json({
      error: "PDF generation failed",
      message: error.message,
      duration: `${duration}ms`,
    });
  }
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
    .select("id, status, spec_version, context, setup_completed_at, created_at, finalized_at")
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

  // Get the spec for objectives list
  let spec;
  try {
    spec = SpecRegistry.get(run.spec_version);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }

  // Build importance map from user values (no Safety Valve override)
  const finalMap: Record<string, number> = {};

  for (const obj of spec.objectives || []) {
    const userValue = importance_map[obj.id];
    if (typeof userValue === "number" && userValue >= 1 && userValue <= 5) {
      finalMap[obj.id] = userValue;
    } else {
      finalMap[obj.id] = 3;  // Default to Medium
    }
  }

  const calibrationData = {
    importance_map: finalMap,
    locked: [],  // No locked objectives - user has full control
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
    .select("id, status, spec_version, context, calibration, finalized_at")
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

  // VS26: Extract pillar context for pain point boosting
  const normalizedCtx = normalizeContext(run.context);
  const pillarContext = normalizedCtx.pillar ? {
    pain_points: normalizedCtx.pillar.pain_points || undefined,
    tools: normalizedCtx.pillar.tools_with_effectiveness || undefined,
  } : null;

  const report = buildReport({
    run_id: runId,
    spec,
    aggregateResult,
    inputs: (inputs ?? []).map((i: { question_id: string; value: unknown }) => ({
      question_id: i.question_id,
      value: i.value,
    })),
    calibration: run.calibration || null,  // VS21: Pass calibration data
    pillarContext,  // VS26: Pass pillar context for pain point boosting
  });

  // VS18: Include context in report response (normalized for backward compatibility)
  // VS21: Include calibration in report response
  // VS39: Include finalized_at for Executive Report tab lock
  res.json({
    ...report,
    context: normalizedCtx,
    calibration: run.calibration || null,
    finalized_at: run.finalized_at || null,
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
// VS-39 — Finalize action plan (locks selections, enables Executive Report)
// ------------------------------------------------------------------
app.post("/diagnostic-runs/:id/finalize", async (req, res) => {
  const runId = req.params.id;

  // Verify run exists and get current state
  const { data: run, error: runError } = await req.supabase
    .from("diagnostic_runs")
    .select("id, status, finalized_at")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  // Check if already finalized (irreversible)
  if (run.finalized_at) {
    return res.status(409).json({
      error: "Run already finalized",
      finalized_at: run.finalized_at
    });
  }

  // Run must be completed before finalization
  if (run.status !== "completed") {
    return res.status(409).json({ error: "Run must be completed before finalization" });
  }

  // Get current action plan to snapshot
  const { data: actionPlanItems, error: planError } = await req.supabase
    .from("action_plans")
    .select("*")
    .eq("run_id", runId);

  if (planError) {
    return res.status(500).json({ error: planError.message });
  }

  // Create snapshot and set finalized_at
  const now = new Date().toISOString();
  const { data, error } = await req.supabase
    .from("diagnostic_runs")
    .update({
      finalized_at: now,
      action_plan_snapshot: actionPlanItems || []
    })
    .eq("id", runId)
    .select("id, finalized_at, action_plan_snapshot")
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    success: true,
    finalized_at: data.finalized_at,
    action_count: (actionPlanItems || []).length
  });
});

// ------------------------------------------------------------------
// VS-44 — Executive Report: Customizations
// ------------------------------------------------------------------

// GET /diagnostic-runs/:id/report-customizations
app.get("/diagnostic-runs/:id/report-customizations", async (req, res) => {
  const runId = req.params.id;

  const { data: run, error } = await req.supabase
    .from("diagnostic_runs")
    .select("id, report_customizations, finalized_at")
    .eq("id", runId)
    .single();

  if (error || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  // Check if run has actions
  const { count: actionCount } = await req.supabase
    .from("action_plans")
    .select("*", { count: "exact", head: true })
    .eq("run_id", runId);

  res.json({
    customizations: run.report_customizations || null,
    is_finalized: Boolean(run.finalized_at),
    has_actions: (actionCount || 0) > 0
  });
});

// POST /diagnostic-runs/:id/report-customizations
app.post("/diagnostic-runs/:id/report-customizations", async (req, res) => {
  const runId = req.params.id;
  const { customizations } = req.body;

  if (!customizations || typeof customizations !== "object") {
    return res.status(400).json({ error: "Invalid customizations object" });
  }

  // Verify run exists and is not finalized
  const { data: run, error: runError } = await req.supabase
    .from("diagnostic_runs")
    .select("id, finalized_at")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  if (run.finalized_at) {
    return res.status(403).json({
      error: "Cannot modify customizations after finalization"
    });
  }

  // Validate customizations structure
  const validatedCustomizations = {
    slide_titles: customizations.slide_titles || {},
    slide_visibility: customizations.slide_visibility || {},
    key_messages: customizations.key_messages || null,
    action_labels: customizations.action_labels || {}
  };

  // Validate title lengths (max 100 chars)
  for (const [key, title] of Object.entries(validatedCustomizations.slide_titles)) {
    if (typeof title === "string" && title.length > 100) {
      return res.status(400).json({
        error: `Title for ${key} exceeds 100 characters`
      });
    }
  }

  // Update customizations
  const { data, error } = await req.supabase
    .from("diagnostic_runs")
    .update({ report_customizations: validatedCustomizations })
    .eq("id", runId)
    .select("report_customizations")
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    success: true,
    customizations: data.report_customizations
  });
});

// POST /diagnostic-runs/:id/report/generate
app.post("/diagnostic-runs/:id/report/generate", async (req, res) => {
  const runId = req.params.id;
  const startTime = Date.now();

  try {
    // Verify run is finalized
    const { data: run, error: runError } = await req.supabase
      .from("diagnostic_runs")
      .select("id, finalized_at, action_plan_snapshot, report_customizations, context, spec_version")
      .eq("id", runId)
      .single();

    if (runError || !run) {
      return res.status(404).json({ error: "Run not found" });
    }

    if (!run.finalized_at) {
      return res.status(400).json({
        error: "Run must be finalized before generating PDF"
      });
    }

    // Get scores from the latest report
    const { data: scores } = await req.supabase
      .from("diagnostic_scores")
      .select("question_id, score, overall_score, maturity_level")
      .eq("run_id", runId)
      .order("created_at", { ascending: false });

    // Get inputs for objectives and footprint
    const { data: inputs } = await req.supabase
      .from("diagnostic_inputs")
      .select("question_id, value")
      .eq("run_id", runId);

    // Get spec for objectives
    let spec;
    try {
      spec = SpecRegistry.get(run.spec_version || DEFAULT_SPEC_VERSION);
    } catch (err) {
      spec = SpecRegistry.get(DEFAULT_SPEC_VERSION);
    }

    // Calculate objective scores
    const objectiveScores = (spec.objectives || []).map((obj: any) => {
      const objQuestions = spec.questions.filter((q: any) => q.objective_id === obj.id);
      const objScores = (scores || []).filter((s: any) =>
        objQuestions.some((q: any) => q.id === s.question_id)
      );
      const avgScore = objScores.length > 0
        ? objScores.reduce((sum: number, s: any) => sum + s.score, 0) / objScores.length * 100
        : 0;
      return {
        id: obj.id,
        objective_id: obj.id,
        objective_name: obj.name,
        name: obj.name,
        score: Math.round(avgScore),
      };
    });

    // Build maturity footprint
    const footprintAnswers = (inputs || []).map((i: any) => ({
      question_id: i.question_id,
      value: i.value as boolean | string | null,
    }));
    const footprintQuestions = spec.questions.map((q: any) => ({
      id: q.id,
      is_critical: q.is_critical,
    }));
    const maturityFootprint = buildMaturityFootprint(footprintAnswers, footprintQuestions);

    // Derive critical risks
    const criticalRisks = deriveCriticalRisks(inputs || [], spec);

    // Get overall score from first scores row
    const overallScore = scores?.[0]?.overall_score || 0;
    const maturityLevel = scores?.[0]?.maturity_level || 1;

    const timestamp = new Date().toISOString();

    // Generate PDF using DocRaptor
    const pdfBuffer = await generatePdf({
      runId,
      companyName: run.context?.company?.name || "Company",
      industry: run.context?.company?.industry,
      overallScore,
      maturityLevel,
      customizations: run.report_customizations || {},
      actions: run.action_plan_snapshot || [],
      timestamp,
      // Extended report data
      objectives: objectiveScores,
      maturityFootprint: maturityFootprint,
      criticalRisks: criticalRisks.map((r) => ({
        question_id: r.questionId,
        evidence_id: r.questionId,
        title: r.questionText,
        question_text: r.questionText,
        expert_action: r.expert_action,
      })),
    });

    // Store PDF in Supabase Storage
    const pdfPath = `${req.userId}/${runId}/executive_report_${timestamp.replace(/[-:T]/g, "").slice(0, 15)}.pdf`;

    const { error: uploadError } = await req.supabase.storage
      .from("reports")
      .upload(pdfPath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("[PDF] Storage upload failed:", uploadError.message);
      // Continue anyway - we can still serve the PDF directly
    }

    // Update run with PDF path
    const { error: updateError } = await req.supabase
      .from("diagnostic_runs")
      .update({
        report_pdf_path: pdfPath,
        report_generated_at: timestamp,
      })
      .eq("id", runId);

    if (updateError) {
      console.error("[PDF] Failed to update run:", updateError.message);
    }

    const duration = Date.now() - startTime;
    console.log(`[PDF] Generated Executive Report for ${runId.slice(0, 8)} in ${duration}ms`);

    res.json({
      success: true,
      pdf_path: pdfPath,
      generated_at: timestamp,
      size_bytes: pdfBuffer.length,
      duration_ms: duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[PDF] Generation failed after ${duration}ms:`, error.message);

    res.status(500).json({
      success: false,
      error: "PDF generation failed",
      message: error.message,
      retryable: true,
    });
  }
});

// GET /diagnostic-runs/:id/report/download
app.get("/diagnostic-runs/:id/report/download", async (req, res) => {
  const runId = req.params.id;

  try {
    // Get run with PDF path
    const { data: run, error: runError } = await req.supabase
      .from("diagnostic_runs")
      .select("id, report_pdf_path, finalized_at, context")
      .eq("id", runId)
      .single();

    if (runError || !run) {
      return res.status(404).json({ error: "Run not found" });
    }

    if (!run.finalized_at) {
      return res.status(400).json({ error: "Run is not finalized" });
    }

    if (!run.report_pdf_path) {
      return res.status(404).json({
        error: "PDF not generated yet",
        hint: "Call POST /diagnostic-runs/:id/report/generate first"
      });
    }

    // Download PDF from Supabase Storage
    const { data: pdfData, error: downloadError } = await req.supabase.storage
      .from("reports")
      .download(run.report_pdf_path);

    if (downloadError || !pdfData) {
      console.error("[PDF] Download failed:", downloadError?.message);
      return res.status(404).json({
        error: "PDF file not found in storage",
        hint: "Try regenerating the PDF"
      });
    }

    // Convert Blob to Buffer
    const pdfBuffer = Buffer.from(await pdfData.arrayBuffer());
    const companyName = run.context?.company?.name || "Company";
    const safeName = companyName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
    const filename = `Executive_Report_${safeName}_${runId.slice(0, 8)}.pdf`;

    // Send PDF with proper headers
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error("[PDF] Download error:", error.message);
    res.status(500).json({
      error: "Failed to download PDF",
      message: error.message
    });
  }
});

// ------------------------------------------------------------------
// Beta Testing: Feedback collection
// ------------------------------------------------------------------
app.post("/feedback", async (req, res) => {
  const { run_id, page, type, message, user_email, user_agent } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Validate type if provided
  const validTypes = ["bug", "confusion", "suggestion", "general"];
  const feedbackType = validTypes.includes(type) ? type : "general";

  const { data, error } = await req.supabase
    .from("feedback")
    .insert({
      run_id: run_id || null,
      user_id: req.userId || null,
      user_email: user_email || null,
      page: page || null,
      type: feedbackType,
      message: message.trim(),
      user_agent: user_agent || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to save feedback:", error);
    // Log to console as fallback
    console.log("FEEDBACK (DB failed):", {
      run_id,
      user_id: req.userId,
      page,
      type: feedbackType,
      message: message.trim(),
    });
    return res.status(500).json({ error: "Failed to save feedback" });
  }

  console.log("Feedback received:", { id: data.id, type: feedbackType, page });
  res.json({ success: true, id: data.id });
});

// ------------------------------------------------------------------
// VS-32: Simplified Interpretation Routes
// ------------------------------------------------------------------
app.use("/diagnostic-runs", interpretationRoutesV32);

// ------------------------------------------------------------------
// Admin Routes - Email whitelist protected
// ------------------------------------------------------------------
const ADMIN_EMAILS = [
  "koseoglucan@gmail.com",
  // Add more admin emails here
];

// Admin auth middleware
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Get user email from Supabase
  const { data: { user } } = await req.supabase.auth.getUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}

// GET /admin/sessions - List all diagnostic runs
app.get("/admin/sessions", requireAdmin, async (req, res) => {
  const { data, error } = await req.supabase
    .from("diagnostic_runs")
    .select(`
      id,
      user_id,
      status,
      spec_version,
      context,
      calibration,
      setup_completed_at,
      finalized_at,
      created_at,
      updated_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Get user emails for each session
  const userIds = [...new Set(data.map(r => r.user_id).filter(Boolean))];
  const { data: users } = await req.supabase.auth.admin.listUsers();

  const userMap = new Map();
  if (users?.users) {
    users.users.forEach(u => userMap.set(u.id, u.email));
  }

  // Enrich sessions with user email
  const enrichedData = data.map(session => ({
    ...session,
    user_email: userMap.get(session.user_id) || "unknown",
    company_name: session.context?.company?.name || null,
    industry: session.context?.company?.industry || null,
  }));

  res.json(enrichedData);
});

// DELETE /admin/sessions/:id - Delete a diagnostic run
app.delete("/admin/sessions/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;

  // Delete related data first (cascade doesn't always work with RLS)
  await req.supabase.from("diagnostic_inputs").delete().eq("run_id", id);
  await req.supabase.from("diagnostic_scores").delete().eq("run_id", id);
  await req.supabase.from("interpretation_sessions").delete().eq("run_id", id);
  await req.supabase.from("interpretation_reports").delete().eq("run_id", id);
  await req.supabase.from("action_plans").delete().eq("run_id", id);

  // Delete the run itself
  const { error } = await req.supabase
    .from("diagnostic_runs")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, deleted: id });
});

// GET /admin/feedback - List all feedback
app.get("/admin/feedback", requireAdmin, async (req, res) => {
  const { data, error } = await req.supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// DELETE /admin/feedback/:id - Delete feedback
app.delete("/admin/feedback/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;

  const { error } = await req.supabase
    .from("feedback")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, deleted: id });
});

// ------------------------------------------------------------------
// Server
// ------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
