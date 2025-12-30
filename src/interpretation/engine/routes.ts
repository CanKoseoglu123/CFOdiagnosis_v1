/**
 * VS-32: Simplified Interpretation API Routes
 *
 * POST /diagnostic-runs/:id/interpret-v32 - Start interpretation
 * GET  /diagnostic-runs/:id/interpret-v32/status - Get status + report
 */

import { Router, Request } from 'express';
import { createClient } from '@supabase/supabase-js';
import { orchestrate } from './orchestrator';
import { computeInputHash } from './precompute';

const router = Router();

// Service client for background operations (bypasses RLS)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!;
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /diagnostic-runs/:id/interpret
 * Start or regenerate interpretation
 */
router.post('/:id/interpret-v32', async (req: Request, res) => {
  const { id: runId } = req.params;
  const userClient = req.supabase; // Authenticated client from middleware

  try {
    // Check for existing in-progress generation (use service client for reports table)
    const { data: existing } = await serviceClient
      .from('interpretation_reports')
      .select('id, status')
      .eq('run_id', runId)
      .eq('status', 'generating')
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        error: 'Generation in progress',
        report_id: existing.id,
      });
    }

    // Get current version
    const { data: latest } = await serviceClient
      .from('interpretation_reports')
      .select('version, input_hash')
      .eq('run_id', runId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Check if regeneration allowed (hash changed) - use service client for consistency
    if (latest) {
      const { data: run } = await serviceClient
        .from('diagnostic_runs')
        .select('*')
        .eq('id', runId)
        .maybeSingle();

      if (!run) {
        return res.status(404).json({ error: 'Run not found' });
      }

      // Fetch inputs separately
      const { data: inputs } = await serviceClient
        .from('diagnostic_inputs')
        .select('question_id, value')
        .eq('run_id', runId);

      run.diagnostic_inputs = inputs || [];

      const currentHash = computeInputHash(run);
      if (currentHash === latest.input_hash) {
        return res.status(400).json({
          error: 'No changes detected. Regeneration requires MCQ or calibration changes.',
          current_version: latest.version,
        });
      }
    }

    const newVersion = (latest?.version || 0) + 1;

    // Create report record (use service client)
    const { data: report, error } = await serviceClient
      .from('interpretation_reports')
      .insert({
        run_id: runId,
        version: newVersion,
        status: 'generating',
        schema_version: 1,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Async generation (don't await)
    generateAsync(runId, report.id);

    return res.status(202).json({
      status: 'generating',
      report_id: report.id,
      version: newVersion,
    });

  } catch (err: any) {
    console.error('Error starting interpretation:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Async generation worker - uses service client (no request context)
 */
async function generateAsync(runId: string, reportId: string) {
  const startTime = Date.now();

  try {
    const result = await orchestrate(runId);

    await serviceClient
      .from('interpretation_reports')
      .update({
        status: 'completed',
        sections: result.sections,
        input_hash: result.input_hash,
        used_fallback: result.used_fallback,
        fallback_reason: result.fallback_reason,
        heuristics_passed: result.heuristics.passed,
        heuristics_violations: result.heuristics.violations,
        generation_attempts: result.attempts,
        model_used: 'gpt-4o',
        tokens_used: result.tokens,
        latency_ms: Date.now() - startTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

  } catch (error: any) {
    console.error('Generation failed:', error);
    await serviceClient
      .from('interpretation_reports')
      .update({
        status: 'failed',
        error_message: error.message,
        latency_ms: Date.now() - startTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);
  }
}

/**
 * GET /diagnostic-runs/:id/interpret-v32/status
 * Get interpretation status and report
 */
router.get('/:id/interpret-v32/status', async (req: Request, res) => {
  const { id: runId } = req.params;

  try {
    // Use service client for reports (no RLS on this table)
    const { data: report } = await serviceClient
      .from('interpretation_reports')
      .select('*')
      .eq('run_id', runId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!report) {
      return res.json({ status: 'none', report: null, can_regenerate: true });
    }

    // Check if regeneration allowed - use service client for consistency
    let can_regenerate = false;
    if (report.status === 'completed' || report.status === 'failed') {
      const { data: run } = await serviceClient
        .from('diagnostic_runs')
        .select('*')
        .eq('id', runId)
        .maybeSingle();

      if (run) {
        // Fetch inputs separately
        const { data: inputs } = await serviceClient
          .from('diagnostic_inputs')
          .select('question_id, value')
          .eq('run_id', runId);

        run.diagnostic_inputs = inputs || [];

        const currentHash = computeInputHash(run);
        can_regenerate = currentHash !== report.input_hash;
      }
    }

    return res.json({
      status: report.status,
      can_regenerate,
      report: {
        id: report.id,
        version: report.version,
        sections: report.sections,
        used_fallback: report.used_fallback,
        error_message: report.error_message,
        created_at: report.created_at,
      },
    });

  } catch (err: any) {
    console.error('Error getting interpretation status:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
