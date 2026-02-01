/**
 * VS-45: Executive Commentary API Routes
 *
 * POST /diagnostic-runs/:id/interpret-executive        - Start generation
 * GET  /diagnostic-runs/:id/interpret-executive/status - Get status + sections
 *
 * Auto-triggers on first view (post-finalization).
 * No regeneration - commentary is generated once and cached.
 */

import { Router, Request } from 'express';
import { precomputeExecutiveData } from './executive-precompute';
import { generateExecutiveCommentary } from './executive-generator';
import { getServiceClient } from '../../lib/supabase';

const router = Router();

// Schema version for executive commentary (distinct from overview interpretation)
const EXECUTIVE_SCHEMA_VERSION = 2;

/**
 * POST /diagnostic-runs/:id/interpret-executive
 * Start executive commentary generation
 */
router.post('/:id/interpret-executive', async (req: Request, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const { id: runId } = req.params;

  try {
    // Check run exists, is owned by the caller, and is finalized
    const { data: run, error: runError } = await getServiceClient()
      .from('diagnostic_runs')
      .select('id, owner_id, finalized_at, action_plan_snapshot')
      .eq('id', runId)
      .maybeSingle();

    if (runError || !run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    if (run.owner_id !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!run.finalized_at) {
      return res.status(400).json({
        error: 'Executive commentary requires finalization. Please finalize your action plan first.',
      });
    }

    // Check for existing executive report
    const { data: existing } = await getServiceClient()
      .from('interpretation_reports')
      .select('id, status, sections')
      .eq('run_id', runId)
      .eq('schema_version', EXECUTIVE_SCHEMA_VERSION)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    // If already completed, return existing
    if (existing?.status === 'completed' && existing.sections) {
      return res.json({
        status: 'completed',
        sections: existing.sections,
        cached: true,
      });
    }

    // If already generating, return status
    if (existing?.status === 'generating') {
      return res.status(409).json({
        status: 'generating',
        report_id: existing.id,
      });
    }

    // Create new report record
    const newVersion = 1; // Executive reports don't have versions (no regeneration)
    const { data: report, error: insertError } = await getServiceClient()
      .from('interpretation_reports')
      .insert({
        run_id: runId,
        version: newVersion,
        status: 'generating',
        schema_version: EXECUTIVE_SCHEMA_VERSION,
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    // Async generation (don't await)
    generateAsync(runId, report.id);

    return res.status(202).json({
      status: 'generating',
      report_id: report.id,
    });

  } catch (err: any) {
    console.error('[EXECUTIVE-AI] Error starting generation:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Async generation worker
 */
async function generateAsync(runId: string, reportId: string): Promise<void> {
  const startTime = Date.now();

  try {
    // Precompute data
    const input = await precomputeExecutiveData(runId);

    // Generate commentary
    const result = await generateExecutiveCommentary(input);

    // Save success
    await getServiceClient()
      .from('interpretation_reports')
      .update({
        status: 'completed',
        sections: result.sections,
        model_used: 'gpt-4o',
        tokens_used: result.tokens,
        latency_ms: Date.now() - startTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

  } catch (error: any) {
    // Log for admin escalation
    console.error('[EXECUTIVE-AI-FAILURE]', {
      runId,
      reportId,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    // Save failure
    await getServiceClient()
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
 * GET /diagnostic-runs/:id/interpret-executive/status
 * Get executive commentary status and sections
 */
router.get('/:id/interpret-executive/status', async (req: Request, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const { id: runId } = req.params;

  try {
    // Check run exists and is owned by the caller
    const { data: run } = await getServiceClient()
      .from('diagnostic_runs')
      .select('owner_id, finalized_at')
      .eq('id', runId)
      .maybeSingle();

    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    if (run.owner_id !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!run.finalized_at) {
      return res.json({
        status: 'not_finalized',
        sections: null,
        message: 'Executive commentary requires finalization.',
      });
    }

    // Get latest executive report
    const { data: report } = await getServiceClient()
      .from('interpretation_reports')
      .select('*')
      .eq('run_id', runId)
      .eq('schema_version', EXECUTIVE_SCHEMA_VERSION)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!report) {
      return res.json({
        status: 'none',
        sections: null,
      });
    }

    return res.json({
      status: report.status,
      sections: report.sections,
      error_message: report.error_message,
    });

  } catch (err: any) {
    console.error('[EXECUTIVE-AI] Error getting status:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
