import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import UAParser from "ua-parser-js";

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
import executiveInterpretationRoutes from "./interpretation/engine/executive-routes";
import {
  DiagnosticContextV1Schema,
  CompanyContextSchema,
  PillarContextSchema,
  DiagnosticContextV1
} from "./specs/schemas";
import { normalizeContext } from "./utils/contextAdapter";

// VS-27e: Target calculation
import { calculateTargets, getDefaultTargetMatrix, validateTargetMatrix, TargetsResult, getEffectivePersona } from "./utils/targetCalculation";
import { computeAchievedLevels } from "./benchmark/achievedLevels";
import { generateBenchmarkCommentary, BenchmarkObjectiveGap } from "./benchmark/generator";

// VS-27b: Company Profile Classification routes
import companyProfilesRoutes from "./routes/companyProfiles";
import adminRoutes from "./routes/admin";
import { requireAdmin } from "./middleware/adminAuth";

const app = express();

// CORS: Allow production domains, Vercel preview deployments, and local dev
const allowedOrigins = [
  "https://cfo-lens.com",
  "https://www.cfo-lens.com",
  "https://cfodiagnosisv1.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5173", // dev
  "http://localhost:5174", // dev alternate port
];

// Pattern for Vercel preview deployments (git branch previews)
const vercelPreviewPattern = /^https:\/\/cfodiagnosisv1-git-[a-z0-9-]+(-cans-projects-[a-z0-9]+)?\.vercel\.app$/;
const cfoLensPattern = /^https:\/\/(www\.)?cfo-lens\.com$/;

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
    // Allow cfo-lens.com and www.cfo-lens.com
    if (cfoLensPattern.test(origin)) {
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
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
}

// Global anon client - ONLY for unauthenticated routes (health checks)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Service role client - Bypasses RLS, for admin operations only
// This is optional - admin features will be limited without it
const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

if (!supabaseAdmin) {
  console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY not set. Admin features will be limited.");
} else {
  // Validate service role key is a JWT (not old format)
  const isJWT = supabaseServiceRoleKey?.startsWith("eyJ");
  if (!isJWT) {
    console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY must be a JWT (starts with 'eyJ'). Current key format is invalid.");
  }
}

// ------------------------------------------------------------------
// Layer 3: Auth middleware - creates authenticated client
// ------------------------------------------------------------------
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
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
        req.userEmail = user.email || undefined;
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

// Admin-only debug endpoint (protected - does not expose secrets)
// Note: This endpoint is defined before requireAdmin middleware is available,
// so we define a minimal inline check. Full admin routes use requireAdmin below.
app.get("/admin/key-check", async (req, res) => {
  // Inline admin check (requireAdmin not yet defined at this point in file)
  if (!req.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const { data: { user } } = await req.supabase.auth.getUser();
  const adminEmails = (process.env.ADMIN_EMAILS || "koseoglucan@gmail.com").split(',').map(e => e.trim().toLowerCase());
  if (!user?.email || !adminEmails.includes(user.email.toLowerCase())) {
    return res.status(403).json({ error: "Admin access required" });
  }

  // Only expose non-sensitive configuration status (no key contents or previews)
  const isJWT = supabaseServiceRoleKey?.startsWith("eyJ") || false;

  // Check if refs match without exposing actual values
  let refsMatch = false;
  if (isJWT && supabaseServiceRoleKey) {
    try {
      const payload = JSON.parse(Buffer.from(supabaseServiceRoleKey.split(".")[1], "base64").toString());
      const ref = payload.ref || "";
      const urlRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase/)?.[1] || "";
      refsMatch = ref === urlRef && ref !== "";
    } catch (e) {
      // Decode error - refs don't match
    }
  }

  res.json({
    configured: supabaseServiceRoleKey !== undefined && supabaseServiceRoleKey.length > 0,
    isJWT,
    refsMatch,
    adminInitialized: supabaseAdmin !== null
  });
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
      // user_email: req.userEmail || null, // TODO: Enable after migration is applied to production
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
    .select("id, status, spec_version, context, setup_completed_at, created_at, finalized_at, company_profile_id")
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
// VS-27c — Get company profile linked to a diagnostic run
// ------------------------------------------------------------------
app.get("/diagnostic-runs/:id/company-profile", async (req, res) => {
  const runId = req.params.id;

  // Fetch run with company_profile_id
  const { data: run, error: runError } = await req.supabase
    .from("diagnostic_runs")
    .select("id, company_profile_id")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  if (!run.company_profile_id) {
    return res.status(404).json({ error: "No company profile linked to this run" });
  }

  // Fetch the company profile
  const { data: profile, error: profileError } = await req.supabase
    .from("company_profiles")
    .select("*")
    .eq("id", run.company_profile_id)
    .single();

  if (profileError || !profile) {
    return res.status(404).json({ error: "Company profile not found" });
  }

  res.json(profile);
});

// ------------------------------------------------------------------
// VS-27e — Get persona-specific maturity targets for a diagnostic run
// Returns objective targets and derived practice targets
// ------------------------------------------------------------------
app.get("/diagnostic-runs/:id/targets", async (req, res) => {
  const runId = req.params.id;

  // Fetch run with company_profile_id
  const { data: run, error: runError } = await req.supabase
    .from("diagnostic_runs")
    .select("id, company_profile_id")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  if (!run.company_profile_id) {
    return res.status(400).json({
      error: "No company profile linked to this run. Complete company setup first."
    });
  }

  // Fetch the company profile with classification
  const { data: profile, error: profileError } = await req.supabase
    .from("company_profiles")
    .select("id, context, classification")
    .eq("id", run.company_profile_id)
    .single();

  if (profileError || !profile) {
    return res.status(404).json({ error: "Company profile not found" });
  }

  if (!profile.classification || !profile.classification.persona) {
    return res.status(400).json({
      error: "Company profile has no persona classification. Complete company setup first."
    });
  }

  try {
    // Calculate targets based on classification and context
    const targets = calculateTargets(
      profile.classification,
      profile.context || {}
    );

    res.json({
      run_id: runId,
      company_profile_id: run.company_profile_id,
      ...targets
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Target calculation failed";
    res.status(500).json({ error: message });
  }
});

// ------------------------------------------------------------------
// VS-27d — Benchmark data + commentary (cached on diagnostic_runs)
// ------------------------------------------------------------------
app.get("/diagnostic-runs/:id/benchmark", async (req, res) => {
  const runId = req.params.id;
  const refresh = String(req.query.refresh) === "true";

  const { data: run, error: runError } = await req.supabase
    .from("diagnostic_runs")
    .select("id, status, company_profile_id, benchmark_commentary")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  if (run.status !== "completed") {
    return res.status(409).json({ error: "Run must be completed before benchmarking" });
  }

  if (!run.company_profile_id) {
    return res.status(400).json({ error: "No company profile linked to this run" });
  }

  const { data: profile, error: profileError } = await req.supabase
    .from("company_profiles")
    .select("context, classification")
    .eq("id", run.company_profile_id)
    .single();

  if (profileError || !profile) {
    return res.status(404).json({ error: "Company profile not found" });
  }

  if (!profile.classification || !profile.classification.persona) {
    return res.status(400).json({ error: "Company profile has no persona classification" });
  }

  const { data: inputs, error: inputsError } = await req.supabase
    .from("diagnostic_inputs")
    .select("question_id, value")
    .eq("run_id", runId);

  if (inputsError) {
    return res.status(500).json({ error: inputsError.message });
  }

  const spec = SpecRegistry.getDefault();

  let targets: TargetsResult;
  try {
    targets = calculateTargets(profile.classification, profile.context || {});
  } catch (err) {
    const message = err instanceof Error ? err.message : "Target calculation failed";
    return res.status(500).json({ error: message });
  }

  const achieved = computeAchievedLevels(spec, inputs || []);
  const objectiveTargetMap = new Map(
    targets.objectiveTargets.map((t) => [t.objective_id, t.adjustedTarget])
  );

  const objectiveGaps: BenchmarkObjectiveGap[] = (spec.objectives || []).map((objective) => {
    const achievedLevel = achieved.objectiveLevels[objective.id] ?? 0;
    const targetLevel = objectiveTargetMap.get(objective.id) ?? 0;
    return {
      objective_id: objective.id,
      objective_name: objective.name,
      achieved_level: achievedLevel,
      target_level: targetLevel,
      gap: Math.max(0, Number(targetLevel) - achievedLevel),
    };
  });

  let commentary = run.benchmark_commentary;
  if (!commentary || refresh) {
    if (process.env.OPENAI_API_KEY) {
      try {
        const companyName = profile.context?.name || profile.context?.company?.name || "The organization";
        const persona = getEffectivePersona(profile.classification);
        commentary = await generateBenchmarkCommentary(companyName, persona, objectiveGaps);

        await req.supabase
          .from("diagnostic_runs")
          .update({ benchmark_commentary: commentary })
          .eq("id", runId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Benchmark commentary failed";
        return res.status(500).json({ error: message });
      }
    }
  }

  res.json({
    run_id: runId,
    persona: targets.persona,
    targets,
    achieved,
    commentary: commentary || null,
  });
});

// ------------------------------------------------------------------
// VS18/VS25/VS27c — Complete setup (save context, mark setup complete)
// Accepts:
//   - Legacy format: { company_name, industry }
//   - V1 format: { company, pillar }
//   - V2 format (VS-27c): { pillar } - company already linked via company_profile_id
// ------------------------------------------------------------------
app.post("/diagnostic-runs/:id/setup", async (req, res) => {
  const runId = req.params.id;
  const body = req.body;

  // Verify run exists first (needed for V2 format check)
  const { data: run, error: runError } = await req.supabase
    .from("diagnostic_runs")
    .select("id, setup_completed_at, company_profile_id")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return res.status(404).json({ error: "Run not found" });
  }

  // Detect format:
  // - V2: pillar only (no company) + company_profile_id linked
  // - V1: has 'company' object
  // - Legacy: has 'company_name' string
  const isV2Format = body.pillar && !body.company && !body.company_name;
  const isV1Format = body.company && typeof body.company === 'object';

  let context: Record<string, unknown>;

  if (isV2Format) {
    // VS-27c: Pillar-only format (company is in company_profiles)
    if (!run.company_profile_id) {
      return res.status(400).json({
        error: "V2 format requires a linked company profile. Create company profile first via POST /api/company-profiles"
      });
    }

    if (!body.pillar || typeof body.pillar !== 'object') {
      return res.status(400).json({
        error: "pillar object is required for v2 format"
      });
    }

    context = {
      version: 'v2',
      pillar: body.pillar
    };
  } else if (isV1Format) {
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
        error: "company_name and industry are required (legacy format), or provide company and pillar objects (v1 format), or provide pillar only (v2 format with linked company profile)",
      });
    }

    context = { company_name, industry };
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

  // If no calibration data, return neutral defaults (all Medium)
  if (!run.calibration || Object.keys(run.calibration).length === 0) {
    // Get the spec for objective list
    let spec;
    try {
      spec = SpecRegistry.get(run.spec_version);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }

    // Build default importance map
    const defaultMap: Record<string, number> = {};
    for (const obj of spec.objectives || []) {
      defaultMap[obj.id] = 3;
    }

    return res.json({
      importance_map: defaultMap,
      locked: [],
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
    .select("id, status, spec_version, context, calibration, finalized_at, action_plan_snapshot, company_profile_id")
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

  // VS-27f: Fetch classification context for targets (optional)
  let classification: any = null;
  let companyContext: any = null;
  if (run.company_profile_id) {
    const { data: profile } = await req.supabase
      .from("company_profiles")
      .select("context, classification")
      .eq("id", run.company_profile_id)
      .single();

    if (profile?.classification) {
      classification = profile.classification;
      companyContext = profile.context || {};
    }
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
    classification,
    companyContext,
  });

  // VS18: Include context in report response (normalized for backward compatibility)
  // VS21: Include calibration in report response
  // VS39: Include finalized_at for Executive Report tab lock
  // VS45: Include action_plan_snapshot for Executive Report
  res.json({
    ...report,
    context: normalizedCtx,
    calibration: run.calibration || null,
    finalized_at: run.finalized_at || null,
    action_plan_snapshot: run.action_plan_snapshot || null,
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
// Beta Testing: Feedback collection
// ------------------------------------------------------------------
app.post("/feedback", async (req, res) => {
  const { run_id, page, type, message, user_agent } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Validate type if provided
  const validTypes = ["bug", "confusion", "suggestion", "general"];
  const feedbackType = validTypes.includes(type) ? type : "general";

  // Use authenticated user email (server-side) - prevents spoofing
  // Falls back to null for anonymous feedback
  const { data, error } = await req.supabase
    .from("feedback")
    .insert({
      run_id: run_id || null,
      user_id: req.userId || null,
      user_email: req.userEmail || null,
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
// VS-45: Executive Report AI Commentary Routes
// ------------------------------------------------------------------
app.use("/diagnostic-runs", executiveInterpretationRoutes);

// ------------------------------------------------------------------
// VS-27b: Company Profile Classification Routes
// ------------------------------------------------------------------
app.use("/api/company-profiles", companyProfilesRoutes);
app.use("/api/admin", adminRoutes);

// ------------------------------------------------------------------
// Admin Routes - Email whitelist protected (via middleware/adminAuth.ts)
// ------------------------------------------------------------------

// GET /admin/sessions - List all diagnostic runs
app.get("/admin/sessions", requireAdmin, async (req, res) => {
  // Require service role client to bypass RLS and list all users
  if (!supabaseAdmin) {
    const { data, error } = await req.supabase
      .from("diagnostic_runs")
      .select(`
        id,
        owner_id,
        user_email,
        status,
        spec_version,
        context,
        calibration,
        setup_completed_at,
        finalized_at,
        created_at
      `)
      .eq("owner_id", req.userId || "")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const enrichedData = (data || []).map((session: any) => ({
      ...session,
      user_email: session.user_email || req.userEmail || "unknown",
      user_name: null,
      company_name: session.context?.company?.name || session.context?.company_name || null,
      industry: session.context?.company?.industry || session.context?.industry || null,
    }));

    res.setHeader("X-Admin-Debug", "adminClient=missing,fallback=owner_only");
    return res.json(enrichedData);
  }

  // Use admin client to bypass RLS and see all runs
  const { data, error } = await supabaseAdmin
    .from("diagnostic_runs")
    .select(`
      id,
      owner_id,
      user_email,
      status,
      spec_version,
      context,
      calibration,
      setup_completed_at,
      finalized_at,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Get user emails and names using admin client (requires service role)
  // Paginate through all users (default limit is 50)
  const userMap = new Map<string, { email: string; name: string | null }>();
  let page = 1;
  const perPage = 1000; // Max per request
  let totalUsersLoaded = 0;
  let userFetchError: string | null = null;

  try {
    while (true) {
      const { data: usersPage, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage
      });

      if (usersError) {
        userFetchError = `${usersError.message} (status: ${(usersError as any).status}, code: ${(usersError as any).code})`;
        console.error("[Admin] Error fetching users:", JSON.stringify(usersError));
        break;
      }

      if (!usersPage?.users || usersPage.users.length === 0) break;

      usersPage.users.forEach((u: { id: string; email?: string; user_metadata?: { full_name?: string; name?: string } }) => {
        if (u.email) {
          const name = u.user_metadata?.full_name || u.user_metadata?.name || null;
          userMap.set(u.id, { email: u.email, name });
        }
      });

      totalUsersLoaded += usersPage.users.length;
      if (usersPage.users.length < perPage) break; // Last page
      page++;
    }
  } catch (err: any) {
    userFetchError = err?.message || String(err);
    console.error("[Admin] Exception fetching users:", err);
  }

  console.log(`[Admin] Loaded ${totalUsersLoaded} users, mapped ${userMap.size} emails, error=${userFetchError}`);

  // Enrich sessions with user email and name
  // Priority: stored user_email > Auth Admin API lookup > "unknown"
  const enrichedData = (data || []).map((session: any) => {
    const userData = userMap.get(session.owner_id);
    // Use stored email from DB first, then fall back to Auth lookup for older records
    const email = session.user_email || userData?.email || "unknown";
    return {
      ...session,
      user_email: email,
      user_name: userData?.name || null,
      company_name: session.context?.company?.name || session.context?.company_name || null,
      industry: session.context?.company?.industry || session.context?.industry || null,
    };
  });

  // Include debug info in response header
  res.setHeader("X-Admin-Debug", `users=${totalUsersLoaded},mapped=${userMap.size},err=${userFetchError || 'none'}`);
  res.json(enrichedData);
});

// DELETE /admin/sessions/:id - Delete a diagnostic run
app.delete("/admin/sessions/:id", requireAdmin, async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({
      error: "Admin features unavailable. SUPABASE_SERVICE_ROLE_KEY not configured."
    });
  }

  const { id } = req.params;

  // Delete related data first using admin client (bypass RLS)
  await supabaseAdmin.from("diagnostic_inputs").delete().eq("run_id", id);
  await supabaseAdmin.from("diagnostic_scores").delete().eq("run_id", id);
  await supabaseAdmin.from("interpretation_sessions").delete().eq("run_id", id);
  await supabaseAdmin.from("interpretation_reports").delete().eq("run_id", id);
  await supabaseAdmin.from("action_plans").delete().eq("run_id", id);

  // Delete the run itself
  const { error } = await supabaseAdmin
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
  if (!supabaseAdmin) {
    return res.status(503).json({
      error: "Admin features unavailable. SUPABASE_SERVICE_ROLE_KEY not configured."
    });
  }

  const { data, error } = await supabaseAdmin
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data || []);
});

// DELETE /admin/feedback/:id - Delete feedback
app.delete("/admin/feedback/:id", requireAdmin, async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({
      error: "Admin features unavailable. SUPABASE_SERVICE_ROLE_KEY not configured."
    });
  }

  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("feedback")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, deleted: id });
});

// ------------------------------------------------------------------
// Admin Test Runner - Generate test diagnostic runs
// ------------------------------------------------------------------
interface TestScenario {
  id: string;
  name: string;
  description: string;
  generateAnswers: (questions: any[]) => Map<string, boolean>;
  calibrationProfile: Record<string, number>;
}

const L1_CRITICALS_TEST = ["fpa_l1_q01", "fpa_l1_q02", "fpa_l1_q05", "fpa_l1_q09"];
const L2_CRITICALS_TEST = ["fpa_l2_q01", "fpa_l2_q02", "fpa_l2_q06", "fpa_l2_q08"];

const TEST_SCENARIOS: TestScenario[] = [
  {
    id: "perfect",
    name: "Perfect Score (L4 Optimized)",
    description: "All questions answered Yes - shows ideal state report",
    generateAnswers: (questions) => {
      const answers = new Map<string, boolean>();
      questions.forEach((q) => answers.set(q.id, true));
      return answers;
    },
    calibrationProfile: {
      obj_budget_discipline: 5,
      obj_financial_controls: 5,
      obj_performance_monitoring: 5,
      obj_forecasting_agility: 5,
      obj_driver_based_planning: 5,
      obj_scenario_modeling: 5,
      obj_strategic_influence: 5,
      obj_decision_support: 5,
      obj_operational_excellence: 5,
    },
  },
  {
    id: "failing",
    name: "Complete Failure (L1 Blocked)",
    description: "All questions answered No - shows worst-case with critical risks",
    generateAnswers: (questions) => {
      const answers = new Map<string, boolean>();
      questions.forEach((q) => answers.set(q.id, false));
      return answers;
    },
    calibrationProfile: {
      obj_budget_discipline: 5,
      obj_financial_controls: 5,
      obj_performance_monitoring: 3,
      obj_forecasting_agility: 3,
      obj_driver_based_planning: 3,
      obj_scenario_modeling: 3,
      obj_strategic_influence: 3,
      obj_decision_support: 3,
      obj_operational_excellence: 3,
    },
  },
  {
    id: "l2_ceiling",
    name: "L2 Ceiling (Defined)",
    description: "Pass L1 criticals, fail L2 criticals, ~60% score - shows L2 maturity",
    generateAnswers: (questions) => {
      const answers = new Map<string, boolean>();
      questions.forEach((q) => {
        // Pass all L1 criticals
        if (L1_CRITICALS_TEST.includes(q.id)) {
          answers.set(q.id, true);
        }
        // Fail all L2 criticals
        else if (L2_CRITICALS_TEST.includes(q.id)) {
          answers.set(q.id, false);
        }
        // L1 questions: 80% yes
        else if (q.maturity_level === 1) {
          answers.set(q.id, Math.random() < 0.8);
        }
        // L2 questions: 60% yes
        else if (q.maturity_level === 2) {
          answers.set(q.id, Math.random() < 0.6);
        }
        // L3+ questions: 30% yes
        else {
          answers.set(q.id, Math.random() < 0.3);
        }
      });
      return answers;
    },
    calibrationProfile: {
      obj_budget_discipline: 4,
      obj_financial_controls: 4,
      obj_performance_monitoring: 3,
      obj_forecasting_agility: 4,
      obj_driver_based_planning: 3,
      obj_scenario_modeling: 3,
      obj_strategic_influence: 3,
      obj_decision_support: 3,
      obj_operational_excellence: 3,
    },
  },
  {
    id: "l3_ceiling",
    name: "L3 Ceiling (Managed)",
    description: "Pass L1 & L2 criticals, ~85% score - shows L3 maturity",
    generateAnswers: (questions) => {
      const answers = new Map<string, boolean>();
      questions.forEach((q) => {
        // Pass all L1 and L2 criticals
        if (L1_CRITICALS_TEST.includes(q.id) || L2_CRITICALS_TEST.includes(q.id)) {
          answers.set(q.id, true);
        }
        // L1-L2 questions: 95% yes
        else if (q.maturity_level <= 2) {
          answers.set(q.id, Math.random() < 0.95);
        }
        // L3 questions: 75% yes
        else if (q.maturity_level === 3) {
          answers.set(q.id, Math.random() < 0.75);
        }
        // L4 questions: 40% yes
        else {
          answers.set(q.id, Math.random() < 0.4);
        }
      });
      return answers;
    },
    calibrationProfile: {
      obj_budget_discipline: 4,
      obj_financial_controls: 4,
      obj_performance_monitoring: 4,
      obj_forecasting_agility: 4,
      obj_driver_based_planning: 4,
      obj_scenario_modeling: 4,
      obj_strategic_influence: 4,
      obj_decision_support: 4,
      obj_operational_excellence: 3,
    },
  },
  {
    id: "critical_block",
    name: "High Score, Critical Block",
    description: "High scores (80%+) but fail L1 criticals - tests critical gate blocking",
    generateAnswers: (questions) => {
      const answers = new Map<string, boolean>();
      questions.forEach((q) => {
        // Fail L1 criticals specifically
        if (L1_CRITICALS_TEST.includes(q.id)) {
          answers.set(q.id, false);
        }
        // Everything else: 85% yes
        else {
          answers.set(q.id, Math.random() < 0.85);
        }
      });
      return answers;
    },
    calibrationProfile: {
      obj_budget_discipline: 5,
      obj_financial_controls: 5,
      obj_performance_monitoring: 4,
      obj_forecasting_agility: 4,
      obj_driver_based_planning: 4,
      obj_scenario_modeling: 4,
      obj_strategic_influence: 4,
      obj_decision_support: 4,
      obj_operational_excellence: 4,
    },
  },
  {
    id: "realistic",
    name: "Realistic Distribution",
    description: "Randomized realistic mix simulating typical user responses",
    generateAnswers: (questions) => {
      const answers = new Map<string, boolean>();
      questions.forEach((q) => {
        // Realistic distribution based on maturity level
        // L1: Most companies have basics (70%)
        // L2: Many have defined processes (55%)
        // L3: Fewer have managed practices (35%)
        // L4: Few are optimized (15%)
        const prob =
          q.maturity_level === 1
            ? 0.7
            : q.maturity_level === 2
              ? 0.55
              : q.maturity_level === 3
                ? 0.35
                : 0.15;
        answers.set(q.id, Math.random() < prob);
      });
      return answers;
    },
    calibrationProfile: {
      obj_budget_discipline: 4,
      obj_financial_controls: 3,
      obj_performance_monitoring: 3,
      obj_forecasting_agility: 4,
      obj_driver_based_planning: 3,
      obj_scenario_modeling: 2,
      obj_strategic_influence: 3,
      obj_decision_support: 4,
      obj_operational_excellence: 3,
    },
  },
];

// GET /admin/test-scenarios - List available test scenarios
app.get("/admin/test-scenarios", requireAdmin, (req, res) => {
  const scenarios = TEST_SCENARIOS.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
  }));
  res.json(scenarios);
});

// POST /admin/test-run - Create a test diagnostic run with pre-filled data
app.post("/admin/test-run", requireAdmin, async (req, res) => {
  const { scenario_id } = req.body;

  if (!scenario_id) {
    return res.status(400).json({ error: "scenario_id is required" });
  }

  const scenario = TEST_SCENARIOS.find((s) => s.id === scenario_id);
  if (!scenario) {
    return res.status(400).json({
      error: `Invalid scenario_id. Valid options: ${TEST_SCENARIOS.map((s) => s.id).join(", ")}`,
    });
  }

  // Get spec for questions
  let spec;
  try {
    spec = SpecRegistry.get(DEFAULT_SPEC_VERSION);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }

  // Generate answers for this scenario
  const answers = scenario.generateAnswers(spec.questions);

  // 1. Create diagnostic run
  const { data: run, error: runError } = await req.supabase
    .from("diagnostic_runs")
    .insert({
      status: "created",
      spec_version: DEFAULT_SPEC_VERSION,
      owner_id: req.userId || null,
      user_email: req.userEmail || null,
      context: {
        company: {
          name: `Test Company (${scenario.name})`,
          industry: "Technology",
          revenue_range: "$10M - $50M",
          employee_count: "51-200",
        },
        pillar: {
          model_count: 5,
          finance_ftes: 3,
          erp_system: "QuickBooks",
          planning_tool: "Excel",
        },
      },
      calibration: {
        importance_map: scenario.calibrationProfile,
        locked: [],
      },
    })
    .select()
    .single();

  if (runError || !run) {
    return res.status(500).json({ error: runError?.message || "Failed to create run" });
  }

  const runId = run.id;

  // 2. Insert all diagnostic inputs
  const inputs = Array.from(answers.entries()).map(([questionId, value]) => ({
    run_id: runId,
    question_id: questionId,
    value,
  }));

  const { error: inputError } = await req.supabase.from("diagnostic_inputs").insert(inputs);

  if (inputError) {
    // Cleanup run on failure
    await req.supabase.from("diagnostic_runs").delete().eq("id", runId);
    return res.status(500).json({ error: inputError.message });
  }

  // 3. Mark as completed
  const { error: completeError } = await req.supabase
    .from("diagnostic_runs")
    .update({ status: "completed" })
    .eq("id", runId);

  if (completeError) {
    return res.status(500).json({ error: completeError.message });
  }

  // 4. Calculate and store scores (reusing VS4 scoreRun logic)
  try {
    const scores = await scoreRun(req.supabase, runId);

    if (scores.length > 0) {
      const { error: scoreError } = await req.supabase
        .from("diagnostic_scores")
        .insert(
          scores.map((s) => ({
            run_id: runId,
            question_id: s.question_id,
            score: s.score,
          }))
        );

      if (scoreError) {
        console.error("[Test Run] Score storage error:", scoreError);
      }
    }

    res.status(201).json({
      success: true,
      run_id: runId,
      scenario: scenario.name,
      questions_answered: inputs.length,
      report_url: `/report/${runId}`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to calculate scores" });
  }
});

// ------------------------------------------------------------------
// Visitor Tracking - Public endpoint to log page visits
// ------------------------------------------------------------------

// Helper to parse user agent using ua-parser-js for accurate detection
function parseUserAgent(ua: string | undefined): { device_type: string; browser: string; os: string } {
  if (!ua) return { device_type: 'unknown', browser: 'unknown', os: 'unknown' };

  const parser = new UAParser(ua);
  const result = parser.getResult();

  // Device type detection
  let device_type = 'desktop';
  const deviceType = result.device?.type;
  if (deviceType === 'mobile') {
    device_type = 'mobile';
  } else if (deviceType === 'tablet') {
    device_type = 'tablet';
  }

  // Browser and OS from parser
  const browser = result.browser?.name || 'unknown';
  const os = result.os?.name || 'unknown';

  return { device_type, browser, os };
}

// Simple in-memory rate limiter for /track endpoint
const trackRateLimiter = new Map<string, { count: number; resetTime: number }>();
const TRACK_RATE_LIMIT = 60; // requests per window
const TRACK_RATE_WINDOW = 60000; // 1 minute in ms

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = trackRateLimiter.get(ip);

  if (!record || now > record.resetTime) {
    trackRateLimiter.set(ip, { count: 1, resetTime: now + TRACK_RATE_WINDOW });
    return false;
  }

  record.count++;
  if (record.count > TRACK_RATE_LIMIT) {
    return true;
  }

  return false;
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of trackRateLimiter.entries()) {
    if (now > record.resetTime) {
      trackRateLimiter.delete(ip);
    }
  }
}, 60000);

// Validation helpers
const PAGE_PATH_REGEX = /^\/[a-zA-Z0-9/_-]*$/;
const SESSION_ID_REGEX = /^session_[0-9]+_[a-z0-9]+$/;

function validatePagePath(path: string): boolean {
  return path === '/' || PAGE_PATH_REGEX.test(path);
}

function validateSessionId(id: string | undefined): boolean {
  return !id || SESSION_ID_REGEX.test(id);
}

// Async geolocation lookup (non-blocking)
async function lookupGeolocation(
  ip: string,
  visitorId: string,
  client: SupabaseClient
): Promise<void> {
  try {
    const geoRes = await fetch(
      `https://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city,lat,lon,timezone`
    );
    const data = await geoRes.json();

    if (data.status === "success") {
      await client
        .from("visitors")
        .update({
          country: data.country || null,
          country_code: data.countryCode || null,
          region: data.region || null,
          city: data.city || null,
          latitude: data.lat || null,
          longitude: data.lon || null,
          timezone: data.timezone || null,
        })
        .eq("id", visitorId);
    }
  } catch (err) {
    // Geolocation failed silently - visitor record still exists
    console.debug("Geolocation lookup failed:", err);
  }
}

// POST /track - Log a page visit (public endpoint, no auth required)
app.post("/track", async (req, res) => {
  const { page_path, query_string, referrer, referrer_type, session_id } = req.body;

  // Basic validation
  if (!page_path || typeof page_path !== "string") {
    return res.status(400).json({ error: "page_path is required" });
  }

  if (!validatePagePath(page_path)) {
    return res.status(400).json({ error: "Invalid page_path format" });
  }

  if (!validateSessionId(session_id)) {
    return res.status(400).json({ error: "Invalid session_id format" });
  }

  // Validate referrer_type if provided
  if (referrer_type && !["external", "internal"].includes(referrer_type)) {
    return res.status(400).json({ error: "Invalid referrer_type" });
  }

  // Get IP address (handle proxies)
  const forwardedFor = req.headers["x-forwarded-for"];
  const ip = typeof forwardedFor === "string"
    ? forwardedFor.split(",")[0].trim()
    : req.socket.remoteAddress || null;

  // Rate limiting
  if (ip && isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const userAgent = req.headers["user-agent"] as string | undefined;
  const { device_type, browser, os } = parseUserAgent(userAgent);

  // Must use admin client for RLS-protected table
  if (!supabaseAdmin) {
    console.error("Visitor tracking requires SUPABASE_SERVICE_ROLE_KEY");
    return res.status(200).json({ tracked: false });
  }

  // Insert visitor record immediately (without geolocation)
  const { data, error } = await supabaseAdmin
    .from("visitors")
    .insert({
      session_id: session_id || null,
      user_id: req.userId || null,
      page_path,
      query_string: typeof query_string === "string" ? query_string.slice(0, 500) : null,
      referrer: typeof referrer === "string" ? referrer.slice(0, 2000) : null,
      referrer_type: referrer_type || null,
      user_agent: userAgent?.slice(0, 500) || null,
      device_type,
      browser: browser.slice(0, 100),
      os: os.slice(0, 100),
      ip_address: ip,
      // Geolocation fields will be updated async
      country: null,
      country_code: null,
      region: null,
      city: null,
      latitude: null,
      longitude: null,
      timezone: null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to track visitor:", error);
    return res.status(200).json({ tracked: false });
  }

  // Fire-and-forget geolocation lookup (non-blocking)
  if (ip && ip !== "::1" && ip !== "127.0.0.1" && data?.id) {
    lookupGeolocation(ip, data.id, supabaseAdmin).catch(() => {});
  }

  res.json({ tracked: true, id: data.id });
});

// GET /admin/visitors - List all visitor data (admin only)
app.get("/admin/visitors", requireAdmin, async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({
      error: "Admin features unavailable. SUPABASE_SERVICE_ROLE_KEY not configured."
    });
  }

  // Parse query params for filtering/pagination
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
  const offset = parseInt(req.query.offset as string) || 0;
  const country = req.query.country as string | undefined;
  const page_path = req.query.page_path as string | undefined;

  let query = supabaseAdmin
    .from("visitors")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (country) {
    query = query.eq("country", country);
  }
  if (page_path) {
    query = query.eq("page_path", page_path);
  }

  const { data, error, count } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    visitors: data || [],
    total: count || 0,
    limit,
    offset,
  });
});

// GET /admin/visitors/stats - Get visitor statistics (admin only)
// Uses single SQL RPC function for efficient database-level aggregation
app.get("/admin/visitors/stats", requireAdmin, async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({
      error: "Admin features unavailable. SUPABASE_SERVICE_ROLE_KEY not configured."
    });
  }

  try {
    // Single RPC call gets all stats at once (efficient)
    const { data, error } = await supabaseAdmin
      .rpc("get_visitor_all_stats", { top_limit: 10 });

    if (error) {
      console.error("Failed to get visitor stats:", error);
      throw error;
    }

    const stats = data || {
      total: 0,
      today: 0,
      last_7_days: 0,
      top_countries: [],
      top_pages: [],
      devices: {},
    };

    // Transform to expected format
    res.json({
      total: stats.total || 0,
      today: stats.today || 0,
      last_7_days: stats.last_7_days || 0,
      top_countries: (stats.top_countries || []).map((row: { item: string; count: number }) => ({
        country: row.item,
        count: row.count,
      })),
      top_pages: (stats.top_pages || []).map((row: { item: string; count: number }) => ({
        page: row.item,
        count: row.count,
      })),
      devices: stats.devices || {},
    });
  } catch (err) {
    console.error("Failed to get visitor stats:", err);
    return res.status(500).json({ error: "Failed to retrieve visitor statistics" });
  }
});

// ------------------------------------------------------------------
// Server
// ------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
