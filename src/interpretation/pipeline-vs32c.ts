/**
 * VS-32c: AI Interpretation Pipeline with Critic-Generated Questions
 *
 * Pipeline Stages:
 * 1. pending → generating (initial draft)
 * 2. generating → heuristics (quality check)
 * 3. heuristics → critic (gap assessment + question generation)
 * 4. critic → awaiting_answers (if questions) OR completed (if no questions)
 * 5. awaiting_answers → rewriting (after user answers)
 * 6. rewriting → heuristics (loop back for quality check)
 *
 * Circuit Breakers:
 * - MAX_ROUNDS = 2
 * - MAX_QUESTIONS_TOTAL = 5
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  AIInterpretationInput,
  VS32cAIInterpretationInput,
  VS32cPipelineState,
  VS32cPipelineStage,
  VS32cGeneratedQuestion,
  VS32cClarifierAnswer,
  VS32cCriticAssessment,
  OverviewSection,
  StepLog,
  VS32bHeuristicResult,
} from './types';
import { generateOverview, rewriteOverview } from './agents/generator';
import { assessDraft } from './agents/critic';
import { runHeuristics } from './validation/heuristics';
import { LOOP_CONFIG } from './config';

// ============================================================
// PIPELINE STATE MANAGEMENT
// ============================================================

export interface VS32cPipelineResult {
  status: 'completed' | 'awaiting_answers' | 'failed';
  session_id: string;
  run_id: string;
  stage: VS32cPipelineStage;
  // Question fields (for awaiting_answers)
  questions?: VS32cGeneratedQuestion[];
  pending_questions?: VS32cGeneratedQuestion[];  // Alias for frontend compatibility
  // Report fields (for completed)
  sections?: OverviewSection[];
  overview_sections?: OverviewSection[];  // Alias for frontend compatibility
  quality_status?: 'green' | 'yellow' | 'red';
  heuristics_result?: VS32bHeuristicResult;
  // Progress fields
  loop_round?: number;
  rounds_used?: number;
  total_questions_asked?: number;
  // Error field
  error?: string;
  error_message?: string;  // Alias for frontend compatibility
}

/**
 * Get or create pipeline state for a run
 */
async function getOrCreateState(
  supabase: SupabaseClient,
  runId: string
): Promise<VS32cPipelineState> {
  // Check for existing report/state
  const { data: existing } = await supabase
    .from('interpretation_reports')
    .select('*')
    .eq('run_id', runId)
    .single();

  if (existing) {
    return {
      run_id: runId,
      session_id: existing.session_id,
      current_stage: existing.current_stage || 'pending',
      loop_round: existing.loop_round || 0,
      total_questions_asked: existing.clarifier_answers?.length || 0,
      overview_sections: existing.overview_sections || null,
      pending_questions: existing.pending_questions || null,
      clarifier_answers: existing.clarifier_answers || [],
      quality_status: existing.quality_status || 'yellow',
      heuristics_result: existing.heuristics_result || null,
    };
  }

  // Create new session
  const { data: session, error: sessionError } = await supabase
    .from('interpretation_sessions')
    .insert({ run_id: runId, status: 'pending' })
    .select()
    .single();

  if (sessionError) throw new Error(`Failed to create session: ${sessionError.message}`);

  // Create initial report record
  const { error: reportError } = await supabase.from('interpretation_reports').insert({
    session_id: session.id,
    run_id: runId,
    current_stage: 'pending',
    loop_round: 0,
    version: 1,
    status: 'pending',
    report: {}, // Initial empty report (required by NOT NULL constraint)
  });

  if (reportError) throw new Error(`Failed to create report: ${reportError.message}`);

  return {
    run_id: runId,
    session_id: session.id,
    current_stage: 'pending',
    loop_round: 0,
    total_questions_asked: 0,
    overview_sections: null,
    pending_questions: null,
    clarifier_answers: [],
    quality_status: 'yellow',
    heuristics_result: null,
  };
}

/**
 * Update pipeline state in database
 */
async function updateState(
  supabase: SupabaseClient,
  runId: string,
  updates: Partial<VS32cPipelineState>
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.current_stage) dbUpdates.current_stage = updates.current_stage;
  if (updates.loop_round !== undefined) dbUpdates.loop_round = updates.loop_round;
  if (updates.overview_sections) dbUpdates.overview_sections = updates.overview_sections;
  if (updates.pending_questions !== undefined) dbUpdates.pending_questions = updates.pending_questions;
  if (updates.clarifier_answers) dbUpdates.clarifier_answers = updates.clarifier_answers;
  if (updates.quality_status) dbUpdates.quality_status = updates.quality_status;
  if (updates.heuristics_result !== undefined) dbUpdates.heuristics_result = updates.heuristics_result;

  // Also update status based on stage
  if (updates.current_stage === 'completed') {
    dbUpdates.status = 'completed';
  } else if (updates.current_stage === 'failed') {
    dbUpdates.status = 'failed';
  } else if (updates.current_stage === 'awaiting_answers') {
    dbUpdates.status = 'awaiting_user';
  } else {
    dbUpdates.status = 'processing';
  }

  const { error } = await supabase
    .from('interpretation_reports')
    .update(dbUpdates)
    .eq('run_id', runId);

  if (error) throw new Error(`Failed to update state: ${error.message}`);

  // Also update session status
  const { data: report } = await supabase
    .from('interpretation_reports')
    .select('session_id')
    .eq('run_id', runId)
    .single();

  if (report?.session_id) {
    let sessionStatus: string;
    if (updates.current_stage === 'completed') {
      sessionStatus = 'complete';
    } else if (updates.current_stage === 'failed') {
      sessionStatus = 'failed';
    } else if (updates.current_stage === 'awaiting_answers') {
      sessionStatus = 'awaiting_user';
    } else {
      sessionStatus = 'generating';
    }

    await supabase
      .from('interpretation_sessions')
      .update({ status: sessionStatus })
      .eq('id', report.session_id);
  }
}

/**
 * Save a step log
 */
async function saveStep(supabase: SupabaseClient, log: Partial<StepLog>): Promise<void> {
  const { error } = await supabase.from('interpretation_steps').insert(log);
  if (error) {
    console.error('Failed to save step:', error);
  }
}

// ============================================================
// MAIN PIPELINE FUNCTIONS
// ============================================================

/**
 * Start or resume VS-32c interpretation pipeline
 */
export async function runVS32cPipeline(
  supabase: SupabaseClient,
  input: AIInterpretationInput
): Promise<VS32cPipelineResult> {
  const state = await getOrCreateState(supabase, input.run_id);

  // If already completed, return existing sections
  if (state.current_stage === 'completed' && state.overview_sections) {
    return {
      status: 'completed',
      session_id: state.session_id,
      run_id: input.run_id,
      stage: 'completed',
      sections: state.overview_sections,
      overview_sections: state.overview_sections,
      quality_status: state.quality_status,
      heuristics_result: state.heuristics_result || undefined,
      loop_round: state.loop_round,
      rounds_used: state.loop_round,
      total_questions_asked: state.clarifier_answers?.length || 0,
    };
  }

  // If awaiting answers, return pending questions
  if (state.current_stage === 'awaiting_answers' && state.pending_questions) {
    return {
      status: 'awaiting_answers',
      session_id: state.session_id,
      run_id: input.run_id,
      stage: 'awaiting_answers',
      questions: state.pending_questions,
      pending_questions: state.pending_questions,
      loop_round: state.loop_round,
      total_questions_asked: state.clarifier_answers?.length || 0,
    };
  }

  // If failed, return error
  if (state.current_stage === 'failed') {
    return {
      status: 'failed',
      session_id: state.session_id,
      run_id: input.run_id,
      stage: 'failed',
      error: 'Pipeline previously failed',
      error_message: 'Pipeline previously failed',
    };
  }

  try {
    // Run the pipeline loop
    console.log('[VS-32c] Starting pipeline for run:', input.run_id);
    return await executePipelineLoop(supabase, state, input);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : '';
    console.error('[VS-32c] Pipeline failed:', message);
    console.error('[VS-32c] Stack trace:', stack);
    await updateState(supabase, input.run_id, { current_stage: 'failed' });
    return {
      status: 'failed',
      session_id: state.session_id,
      run_id: input.run_id,
      stage: 'failed',
      error: message,
      error_message: message,
    };
  }
}

/**
 * Submit answers to clarifying questions and continue pipeline
 */
export async function submitAnswersAndContinue(
  supabase: SupabaseClient,
  runId: string,
  answers: VS32cClarifierAnswer[],
  input: AIInterpretationInput
): Promise<VS32cPipelineResult> {
  const state = await getOrCreateState(supabase, runId);

  if (state.current_stage !== 'awaiting_answers') {
    return {
      status: 'failed',
      session_id: state.session_id,
      run_id: runId,
      stage: state.current_stage,
      error: 'Pipeline not awaiting answers',
      error_message: 'Pipeline not awaiting answers',
    };
  }

  // Add answers to state
  const updatedAnswers = [...state.clarifier_answers, ...answers];
  await updateState(supabase, runId, {
    clarifier_answers: updatedAnswers,
    current_stage: 'rewriting',
    pending_questions: null,
  });

  // Continue pipeline with answers
  const updatedState: VS32cPipelineState = {
    ...state,
    clarifier_answers: updatedAnswers,
    current_stage: 'rewriting',
    pending_questions: null,
  };

  try {
    return await executePipelineLoop(supabase, updatedState, input);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await updateState(supabase, runId, { current_stage: 'failed' });
    return {
      status: 'failed',
      session_id: state.session_id,
      run_id: runId,
      stage: 'failed',
      error: message,
      error_message: message,
    };
  }
}

/**
 * Execute the main pipeline loop
 */
async function executePipelineLoop(
  supabase: SupabaseClient,
  state: VS32cPipelineState,
  input: AIInterpretationInput
): Promise<VS32cPipelineResult> {
  let currentState = { ...state };
  const vs32cInput: VS32cAIInterpretationInput = {
    ...input,
    diagnostic_answers: input.diagnostic_answers || [],
    clarifier_answers: currentState.clarifier_answers,
  };

  // STAGE: GENERATING (initial draft or rewrite)
  if (
    currentState.current_stage === 'pending' ||
    currentState.current_stage === 'generating' ||
    currentState.current_stage === 'rewriting'
  ) {
    await updateState(supabase, input.run_id, { current_stage: 'generating' });

    let sections: OverviewSection[];
    let tokensUsed: number;

    if (currentState.overview_sections && currentState.clarifier_answers.length > 0) {
      // Rewrite with answers
      console.log('[VS-32c] Rewriting with clarifier answers...');
      const rewriteResult = await rewriteOverview(
        vs32cInput,
        currentState.overview_sections,
        [], // No explicit rewrite instructions, use answers
        currentState.session_id,
        currentState.loop_round
      );
      sections = rewriteResult.sections;
      tokensUsed = rewriteResult.tokensUsed;
      await saveStep(supabase, rewriteResult.log);
    } else {
      // Initial generation
      console.log('[VS-32c] Generating initial overview...');
      const genResult = await generateOverview(vs32cInput);
      sections = genResult.sections;
      tokensUsed = genResult.tokensUsed;
    }

    currentState.overview_sections = sections;
    await updateState(supabase, input.run_id, {
      overview_sections: sections,
      current_stage: 'heuristics',
    });
    currentState.current_stage = 'heuristics';
  }

  // STAGE: HEURISTICS
  if (currentState.current_stage === 'heuristics') {
    console.log('[VS-32c] Running heuristics...');
    const heuristics = runHeuristics(currentState.overview_sections!, vs32cInput);

    await updateState(supabase, input.run_id, {
      heuristics_result: heuristics,
      quality_status: heuristics.passed ? 'green' : heuristics.red_count > 0 ? 'red' : 'yellow',
    });

    currentState.heuristics_result = heuristics;
    currentState.quality_status = heuristics.passed ? 'green' : heuristics.red_count > 0 ? 'red' : 'yellow';

    // If green or max rounds reached, complete
    if (heuristics.passed || currentState.loop_round >= LOOP_CONFIG.maxRounds) {
      await updateState(supabase, input.run_id, { current_stage: 'completed' });
      return {
        status: 'completed',
        session_id: currentState.session_id,
        run_id: input.run_id,
        stage: 'completed',
        sections: currentState.overview_sections!,
        overview_sections: currentState.overview_sections!,
        quality_status: currentState.quality_status,
        heuristics_result: currentState.heuristics_result || undefined,
        loop_round: currentState.loop_round,
        rounds_used: currentState.loop_round,
        total_questions_asked: currentState.clarifier_answers?.length || 0,
      };
    }

    // Continue to critic
    currentState.current_stage = 'critic';
    await updateState(supabase, input.run_id, { current_stage: 'critic' });
  }

  // STAGE: CRITIC
  if (currentState.current_stage === 'critic') {
    console.log('[VS-32c] Running critic assessment...');

    const { assessment, tokensUsed, log } = await assessDraft(
      vs32cInput,
      currentState.overview_sections!,
      currentState.session_id,
      currentState.loop_round,
      currentState.total_questions_asked
    );

    await saveStep(supabase, log);

    // If critic generated questions, pause for user
    if (assessment.generated_questions.length > 0) {
      console.log(`[VS-32c] Generated ${assessment.generated_questions.length} questions`);

      await updateState(supabase, input.run_id, {
        pending_questions: assessment.generated_questions,
        current_stage: 'awaiting_answers',
        loop_round: currentState.loop_round + 1,
      });

      return {
        status: 'awaiting_answers',
        session_id: currentState.session_id,
        run_id: input.run_id,
        stage: 'awaiting_answers',
        questions: assessment.generated_questions,
        pending_questions: assessment.generated_questions,
        loop_round: currentState.loop_round + 1,
        total_questions_asked: currentState.clarifier_answers?.length || 0,
      };
    }

    // No questions - apply rewrite instructions if any
    if (assessment.rewrite_instructions.length > 0) {
      console.log('[VS-32c] Applying rewrite instructions...');

      const rewriteResult = await rewriteOverview(
        vs32cInput,
        currentState.overview_sections!,
        assessment.rewrite_instructions,
        currentState.session_id,
        currentState.loop_round
      );

      await saveStep(supabase, rewriteResult.log);

      currentState.overview_sections = rewriteResult.sections;
      currentState.loop_round += 1;

      await updateState(supabase, input.run_id, {
        overview_sections: rewriteResult.sections,
        loop_round: currentState.loop_round,
        current_stage: 'heuristics',
      });

      // Loop back to heuristics
      currentState.current_stage = 'heuristics';
      return executePipelineLoop(supabase, currentState, input);
    }

    // No questions and no rewrite instructions - complete
    await updateState(supabase, input.run_id, { current_stage: 'completed' });
    return {
      status: 'completed',
      session_id: currentState.session_id,
      run_id: input.run_id,
      stage: 'completed',
      sections: currentState.overview_sections!,
      overview_sections: currentState.overview_sections!,
      quality_status: assessment.overall_quality,
      heuristics_result: currentState.heuristics_result || undefined,
      loop_round: currentState.loop_round,
      rounds_used: currentState.loop_round,
      total_questions_asked: currentState.clarifier_answers?.length || 0,
    };
  }

  // Unexpected state
  return {
    status: 'failed',
    session_id: currentState.session_id,
    run_id: input.run_id,
    stage: currentState.current_stage,
    error: `Unexpected pipeline stage: ${currentState.current_stage}`,
    error_message: `Unexpected pipeline stage: ${currentState.current_stage}`,
  };
}

// ============================================================
// STATUS AND REPORT RETRIEVAL
// ============================================================

/**
 * Get current pipeline status
 */
export async function getVS32cStatus(
  supabase: SupabaseClient,
  runId: string
): Promise<{
  status: VS32cPipelineStage;
  progress: {
    current_round: number;
    total_questions_asked: number;
  };
  pending_questions?: VS32cGeneratedQuestion[];
} | null> {
  const { data } = await supabase
    .from('interpretation_reports')
    .select('current_stage, loop_round, pending_questions, clarifier_answers')
    .eq('run_id', runId)
    .single();

  // Return null if no session exists - this allows the API to start a new pipeline
  if (!data) {
    return null;
  }

  return {
    status: data.current_stage || 'pending',
    progress: {
      current_round: data.loop_round || 0,
      total_questions_asked: data.clarifier_answers?.length || 0,
    },
    pending_questions: data.pending_questions || undefined,
  };
}

/**
 * Get completed VS-32c report
 */
export async function getVS32cReport(
  supabase: SupabaseClient,
  runId: string
): Promise<{
  sections: OverviewSection[];
  quality_status: 'green' | 'yellow' | 'red';
  rounds_used: number;
  heuristic_warnings: string[];
  heuristics_result: VS32bHeuristicResult | null;
  total_questions_asked: number;
} | null> {
  const { data } = await supabase
    .from('interpretation_reports')
    .select('overview_sections, quality_status, loop_round, heuristics_result, clarifier_answers')
    .eq('run_id', runId)
    .single();

  if (!data || !data.overview_sections) {
    return null;
  }

  const warnings: string[] = [];
  if (data.heuristics_result?.violations) {
    data.heuristics_result.violations.forEach((v: { message: string }) => {
      warnings.push(v.message);
    });
  }

  return {
    sections: data.overview_sections,
    quality_status: data.quality_status || 'yellow',
    rounds_used: data.loop_round || 0,
    heuristic_warnings: warnings,
    heuristics_result: data.heuristics_result || null,
    total_questions_asked: data.clarifier_answers?.length || 0,
  };
}
