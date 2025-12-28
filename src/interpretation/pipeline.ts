/**
 * VS-32: Interpretation Pipeline
 *
 * Orchestrates the iterative refinement loop between Generator and Critic.
 * Handles session state, quality gates, and user question flow.
 *
 * Key VS-32 changes:
 * - Uses OverviewSections instead of legacy DraftReport
 * - Passes pillar config through all agent calls
 * - Evidence ID tracking via clarifier_ namespace
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  InterpretationSession,
  DiagnosticData,
  DraftReport,
  OverviewSections,
  InterpretedReport,
  QuestionAnswer,
  HeuristicResult,
  InterpretationQuestion,
  FinalReportOutput,
  StepLog,
  SessionStatus,
  PillarInterpretationConfig,
} from './types';
import { buildTonalityInstructions, getTonalitySummary } from './tonality';
import { assessHeuristics, countWords } from './validation/quality-assessment';
import { prioritizeGaps } from './questions/prioritizer';
import { Generator, Critic } from './agents';
import { LOOP_CONFIG, FALLBACK_MESSAGE, STEP_ESTIMATES } from './config';
import { getFPAConfig } from './pillars/fpa';

// ============================================================
// SESSION MANAGEMENT
// ============================================================

export async function createSession(
  supabase: SupabaseClient,
  runId: string
): Promise<InterpretationSession> {
  const { data, error } = await supabase
    .from('interpretation_sessions')
    .insert({ run_id: runId, status: 'pending' })
    .select()
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return data;
}

export async function getSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<InterpretationSession | null> {
  const { data, error } = await supabase
    .from('interpretation_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) return null;
  return data;
}

export async function getSessionByRunId(
  supabase: SupabaseClient,
  runId: string
): Promise<InterpretationSession | null> {
  const { data, error } = await supabase
    .from('interpretation_sessions')
    .select('*')
    .eq('run_id', runId)
    .single();

  if (error) return null;
  return data;
}

export async function updateSessionStatus(
  supabase: SupabaseClient,
  sessionId: string,
  status: SessionStatus,
  updates: Partial<InterpretationSession> = {}
): Promise<void> {
  const { error } = await supabase
    .from('interpretation_sessions')
    .update({ status, ...updates })
    .eq('id', sessionId);

  if (error) throw new Error(`Failed to update session: ${error.message}`);
}

// ============================================================
// SAFETY LIMITS - Track tokens and AI calls
// ============================================================

async function checkAndUpdateLimits(
  supabase: SupabaseClient,
  sessionId: string,
  tokensUsed: number
): Promise<{ allowed: boolean; reason?: string }> {
  // Get current session stats
  const { data: session } = await supabase
    .from('interpretation_sessions')
    .select('total_tokens')
    .eq('id', sessionId)
    .single();

  const currentTokens = session?.total_tokens || 0;
  const newTotal = currentTokens + tokensUsed;

  // Check token limit
  if (newTotal > LOOP_CONFIG.maxTokensPerSession) {
    return { allowed: false, reason: `Token limit exceeded (${newTotal}/${LOOP_CONFIG.maxTokensPerSession})` };
  }

  // Count AI calls for this session
  const { count } = await supabase
    .from('interpretation_steps')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .in('agent', ['generator', 'critic']);

  if ((count || 0) >= LOOP_CONFIG.maxAICallsPerSession) {
    return { allowed: false, reason: `AI call limit exceeded (${count}/${LOOP_CONFIG.maxAICallsPerSession})` };
  }

  // Update token count
  await supabase
    .from('interpretation_sessions')
    .update({ total_tokens: newTotal })
    .eq('id', sessionId);

  return { allowed: true };
}

// ============================================================
// STEP LOGGING
// ============================================================

async function saveStep(
  supabase: SupabaseClient,
  log: Partial<StepLog>
): Promise<void> {
  const { error } = await supabase.from('interpretation_steps').insert(log);
  if (error) {
    console.error('Failed to save step:', error);
  }

  // Track token usage if this was an AI call
  if (log.session_id && log.agent !== 'code' && (log.tokens_input || log.tokens_output)) {
    const tokensUsed = (log.tokens_input || 0) + (log.tokens_output || 0);
    const limitCheck = await checkAndUpdateLimits(supabase, log.session_id, tokensUsed);
    if (!limitCheck.allowed) {
      console.warn(`Safety limit reached: ${limitCheck.reason}`);
    }
  }
}

async function saveConversation(
  supabase: SupabaseClient,
  sessionId: string,
  sequence: number,
  agent: 'generator' | 'critic',
  role: string,
  promptSent: string,
  responseReceived: string,
  inputFromPrevious?: unknown,
  outputToNext?: unknown
): Promise<void> {
  const { error } = await supabase.from('interpretation_ai_conversations').insert({
    session_id: sessionId,
    sequence_number: sequence,
    agent,
    role,
    prompt_sent: promptSent,
    response_received: responseReceived,
    input_from_previous: inputFromPrevious,
    output_to_next: outputToNext,
  });
  if (error) {
    console.error('Failed to save conversation:', error);
  }
}

// ============================================================
// QUESTION MANAGEMENT
// ============================================================

async function saveQuestions(
  supabase: SupabaseClient,
  sessionId: string,
  round: number,
  questions: InterpretationQuestion[]
): Promise<void> {
  const rows = questions.map((q, idx) => ({
    session_id: sessionId,
    round_number: round,
    question_id: q.question_id,
    gap_id: q.gap_id,
    objective_id: q.objective_id,
    question_text: q.question,
    question_type: q.type,
    options: q.options,
    priority_score: questions.length - idx, // Higher priority = lower index
  }));

  const { error } = await supabase.from('interpretation_questions').insert(rows);
  if (error) throw new Error(`Failed to save questions: ${error.message}`);
}

export async function getQuestions(
  supabase: SupabaseClient,
  sessionId: string
): Promise<InterpretationQuestion[]> {
  const { data, error } = await supabase
    .from('interpretation_questions')
    .select('*')
    .eq('session_id', sessionId)
    .is('answer', null)
    .order('priority_score', { ascending: false });

  if (error) return [];
  return data.map((q: Record<string, unknown>) => ({
    question_id: q.question_id as string,
    gap_id: q.gap_id as string,
    objective_id: q.objective_id as string,
    question: q.question_text as string,
    type: q.question_type as 'mcq' | 'free_text',
    options: q.options as string[] | null,
    max_length: null,
  }));
}

export async function saveAnswers(
  supabase: SupabaseClient,
  sessionId: string,
  answers: Array<{ question_id: string; answer: string; time_to_answer_ms: number }>
): Promise<QuestionAnswer[]> {
  const results: QuestionAnswer[] = [];

  for (const answer of answers) {
    // Determine confidence based on timing
    let confidence: 'high' | 'low' | 'unknown' = 'unknown';

    // Get question type
    const { data: question } = await supabase
      .from('interpretation_questions')
      .select('question_type, options, question_text')
      .eq('session_id', sessionId)
      .eq('question_id', answer.question_id)
      .single();

    if (question) {
      if (question.question_type === 'free_text') {
        confidence = answer.time_to_answer_ms < 2000 ? 'low' : 'high';
      } else {
        const isComplex = question.options?.length > 3;
        const threshold = isComplex ? 1500 : 800;
        confidence = answer.time_to_answer_ms < threshold ? 'low' : 'high';
      }

      results.push({
        question_id: answer.question_id,
        question: question.question_text,
        answer: answer.answer,
        time_to_answer_ms: answer.time_to_answer_ms,
        confidence,
      });
    }

    // Update question with answer
    await supabase
      .from('interpretation_questions')
      .update({
        answer: answer.answer,
        answered_at: new Date().toISOString(),
        time_to_answer_ms: answer.time_to_answer_ms,
        answer_confidence: confidence,
      })
      .eq('session_id', sessionId)
      .eq('question_id', answer.question_id);
  }

  return results;
}

// ============================================================
// REPORT MANAGEMENT
// ============================================================

async function saveReport(
  supabase: SupabaseClient,
  output: FinalReportOutput
): Promise<void> {
  const { error } = await supabase.from('interpretation_reports').insert({
    session_id: output.session_id,
    run_id: output.run_id,
    report: output.report,
    word_count: output.word_count,
    rounds_used: output.rounds_used,
    questions_answered: output.questions_answered,
    quality_status: output.quality_status,
    quality_compromised: output.quality_compromised,
    heuristic_warnings: output.heuristic_warnings,
  });

  if (error) throw new Error(`Failed to save report: ${error.message}`);
}

export async function getReport(
  supabase: SupabaseClient,
  runId: string
): Promise<FinalReportOutput | null> {
  const { data, error } = await supabase
    .from('interpretation_reports')
    .select('*')
    .eq('run_id', runId)
    .single();

  if (error) return null;
  return {
    session_id: data.session_id,
    run_id: data.run_id,
    report: data.report,
    word_count: data.word_count,
    rounds_used: data.rounds_used,
    questions_answered: data.questions_answered,
    quality_status: data.quality_status,
    quality_compromised: data.quality_compromised,
    heuristic_warnings: data.heuristic_warnings || [],
  };
}

// ============================================================
// MAIN PIPELINE
// ============================================================

export interface PipelineResult {
  status: 'complete' | 'awaiting_user' | 'failed';
  session_id: string;
  questions?: InterpretationQuestion[];
  report?: FinalReportOutput;
  error?: string;
}

/**
 * Run the interpretation pipeline.
 * This is the main entry point for starting interpretation.
 * VS-32: Now loads pillar config for the diagnostic pillar.
 */
export async function runPipeline(
  supabase: SupabaseClient,
  data: DiagnosticData,
  pillarId: string = 'fpa'
): Promise<PipelineResult> {
  // VS-32: Get pillar configuration
  const pillarConfig = getPillarConfig(pillarId);

  // Check for existing session
  let session = await getSessionByRunId(supabase, data.run_id);

  if (!session) {
    session = await createSession(supabase, data.run_id);
  }

  // If already complete, return existing report
  if (session.status === 'complete') {
    const report = await getReport(supabase, data.run_id);
    if (report) {
      return { status: 'complete', session_id: session.id, report };
    }
  }

  // If awaiting user, return pending questions
  if (session.status === 'awaiting_user') {
    const questions = await getQuestions(supabase, session.id);
    return { status: 'awaiting_user', session_id: session.id, questions };
  }

  try {
    await updateSessionStatus(supabase, session.id, 'generating');
    return await executeLoop(supabase, session, data, pillarConfig);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await updateSessionStatus(supabase, session.id, 'failed');
    return { status: 'failed', session_id: session.id, error: message };
  }
}

/**
 * VS-32: Get pillar configuration by ID.
 * Currently only FP&A is implemented.
 */
function getPillarConfig(pillarId: string): PillarInterpretationConfig {
  if (pillarId === 'fpa') {
    return getFPAConfig();
  }
  // Default to FP&A for now
  console.warn(`[Pipeline] Unknown pillar '${pillarId}', defaulting to FP&A`);
  return getFPAConfig();
}

/**
 * Resume pipeline after user answers questions.
 * VS-32: Updated to use OverviewSections and pass pillar config.
 */
export async function resumePipeline(
  supabase: SupabaseClient,
  sessionId: string,
  answers: Array<{ question_id: string; answer: string; time_to_answer_ms: number }>,
  data: DiagnosticData,
  pillarId: string = 'fpa'
): Promise<PipelineResult> {
  const session = await getSession(supabase, sessionId);
  if (!session) {
    return { status: 'failed', session_id: sessionId, error: 'Session not found' };
  }

  // VS-32: Get pillar configuration
  const pillarConfig = getPillarConfig(pillarId);

  // VS-32: Max rounds circuit breaker - prevent infinite loops
  if (session.current_round >= LOOP_CONFIG.maxRounds) {
    console.warn(`[Pipeline] Max rounds reached (${session.current_round}/${LOOP_CONFIG.maxRounds}), forcing finalization`);
    // Force complete with current draft instead of failing
    const { data: lastStep } = await supabase
      .from('interpretation_steps')
      .select('output')
      .eq('session_id', sessionId)
      .in('step_type', ['generator_draft', 'generator_rewrite'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastStep?.output) {
      return await forceFinalize(supabase, session, data, lastStep.output as OverviewSections, pillarConfig);
    }
    return { status: 'failed', session_id: sessionId, error: 'Max interpretation rounds exceeded' };
  }

  // Save answers
  const processedAnswers = await saveAnswers(supabase, sessionId, answers);

  // Get previous draft
  const { data: lastStep } = await supabase
    .from('interpretation_steps')
    .select('output')
    .eq('session_id', sessionId)
    .in('step_type', ['generator_draft', 'generator_rewrite'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!lastStep?.output) {
    return { status: 'failed', session_id: sessionId, error: 'No previous draft found' };
  }

  // VS-32: Cast to OverviewSections
  const previousDraft = lastStep.output as OverviewSections;

  try {
    await updateSessionStatus(supabase, sessionId, 'generating');

    // VS-32: Rewrite with answers using new function signature
    const { draft, log } = await Generator.rewriteWithAnswers(
      previousDraft,
      processedAnswers,
      session.current_round,
      sessionId,
      pillarConfig
    );
    await saveStep(supabase, log);

    // Update session
    await supabase
      .from('interpretation_sessions')
      .update({
        current_round: session.current_round + 1,
        total_questions_asked: session.total_questions_asked + answers.length,
      })
      .eq('id', sessionId);

    // Continue the loop
    return await executeLoopFromDraft(
      supabase,
      { ...session, current_round: session.current_round + 1 },
      data,
      draft,
      2,
      pillarConfig
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await updateSessionStatus(supabase, sessionId, 'failed');
    return { status: 'failed', session_id: sessionId, error: message };
  }
}

/**
 * Execute the main interpretation loop.
 * VS-32: Now accepts pillar config.
 */
async function executeLoop(
  supabase: SupabaseClient,
  session: InterpretationSession,
  data: DiagnosticData,
  pillarConfig: PillarInterpretationConfig
): Promise<PipelineResult> {
  let sequence = 1;

  // Build tonality instructions
  const tonalityInstructions = buildTonalityInstructions(data.objectives);

  // VS-32: Step 1 - Initial draft with pillar config
  const { draft, log: draftLog } = await Generator.createDraft(
    {
      company_name: data.company_name,
      industry: data.industry,
      team_size: data.team_size,
      pain_points: data.pain_points,
      systems: data.systems,
      execution_score: data.execution_score,
      maturity_level: data.maturity_level,
      level_name: data.level_name,
      capped: data.capped,
      capped_by_titles: data.capped_by_titles,
      objectives: data.objectives,
      top_initiatives: data.initiatives.filter((i) => i.priority === 'P1' || i.priority === 'P2').slice(0, 5),
      tonality_instructions: tonalityInstructions,
      pillar_config: pillarConfig,
    },
    session.id
  );

  // Convert tonality summary numbers to strings for logging
  const tonalitySummary = getTonalitySummary(data.objectives);
  const tonalityInjected: Record<string, string> = {};
  for (const [key, value] of Object.entries(tonalitySummary)) {
    tonalityInjected[key] = String(value);
  }

  await saveStep(supabase, {
    ...draftLog,
    tonality_injected: tonalityInjected,
    context_injected: {
      company_name: data.company_name,
      industry: data.industry,
      objectives_count: data.objectives.length,
      pillar_id: pillarConfig.pillar_id,
    },
  });

  await saveConversation(
    supabase,
    session.id,
    sequence++,
    'generator',
    'draft',
    draftLog.prompt_sent || '',
    draftLog.raw_response || '',
    { tonality_instructions: tonalityInstructions, pillar_id: pillarConfig.pillar_id },
    draft
  );

  return await executeLoopFromDraft(supabase, session, data, draft, sequence, pillarConfig);
}

/**
 * VS-32: Force finalization when max rounds exceeded.
 * Skips critic feedback and directly finalizes the current draft.
 */
async function forceFinalize(
  supabase: SupabaseClient,
  session: InterpretationSession,
  data: DiagnosticData,
  draft: OverviewSections,
  pillarConfig: PillarInterpretationConfig
): Promise<PipelineResult> {
  console.log(`[Pipeline] Force finalizing session ${session.id} due to max rounds`);

  await updateSessionStatus(supabase, session.id, 'finalizing');

  // Skip critic, use empty feedback
  const emptyFeedback = { ready: true, edits: [] };

  // VS-32: Use new finalize signature with pillar config
  const { report, log: finalizeLog } = await Generator.finalize(
    draft,
    emptyFeedback,
    session.id,
    pillarConfig
  );
  await saveStep(supabase, finalizeLog);

  // Create a DraftReport-like object for heuristic assessment
  const draftForAssessment = {
    synthesis: `${draft.executive_summary} ${draft.current_state}`,
    priority_rationale: draft.priority_rationale,
    key_insight: draft.opportunities,
    gaps_marked: draft.gaps_marked || [],
  };

  const finalAssessment = assessHeuristics(draftForAssessment, data);

  const { count: questionsAnswered } = await supabase
    .from('interpretation_questions')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', session.id)
    .not('answer', 'is', null);

  const finalOutput: FinalReportOutput = {
    session_id: session.id,
    run_id: data.run_id,
    report,
    word_count: countWords(draftForAssessment),
    rounds_used: session.current_round + 1,
    questions_answered: questionsAnswered || 0,
    quality_status: finalAssessment.overall,
    quality_compromised: true, // Mark as compromised since we force-finalized
    heuristic_warnings: [
      ...finalAssessment.heuristic_warnings,
      'max_rounds_exceeded: Report finalized early due to loop limit',
    ],
  };

  await saveReport(supabase, finalOutput);
  await updateSessionStatus(supabase, session.id, 'complete', {
    completed_at: new Date().toISOString(),
  });

  return { status: 'complete', session_id: session.id, report: finalOutput };
}

/**
 * Continue loop from a draft (used after initial and rewrites).
 * VS-32: Updated to use OverviewSections and pass pillar config.
 */
async function executeLoopFromDraft(
  supabase: SupabaseClient,
  session: InterpretationSession,
  data: DiagnosticData,
  draft: OverviewSections,
  sequence: number = 2,
  pillarConfig: PillarInterpretationConfig
): Promise<PipelineResult> {
  let currentDraft = draft;
  let round = session.current_round;

  // VS-32: Secondary circuit breaker check
  if (round >= LOOP_CONFIG.maxRounds) {
    console.warn(`[Pipeline] Secondary max rounds check triggered at round ${round}`);
    return await forceFinalize(supabase, session, data, currentDraft, pillarConfig);
  }

  while (round < LOOP_CONFIG.maxRounds) {
    // VS-32: Convert OverviewSections to DraftReport-like for heuristics
    const draftForAssessment = {
      synthesis: `${currentDraft.executive_summary} ${currentDraft.current_state}`,
      priority_rationale: currentDraft.priority_rationale,
      key_insight: currentDraft.opportunities,
      gaps_marked: currentDraft.gaps_marked || [],
    };

    // Step 2: Quality assessment
    const assessment = assessHeuristics(draftForAssessment, data);
    await saveStep(supabase, {
      session_id: session.id,
      step_type: 'quality_check',
      round_number: round,
      agent: 'code',
      output: assessment,
      quality_gate_result: assessment,
    });

    // Traffic Light Protocol
    if (assessment.overall === 'red') {
      await updateSessionStatus(supabase, session.id, 'failed');
      return {
        status: 'failed',
        session_id: session.id,
        error: FALLBACK_MESSAGE,
      };
    }

    // Green: Quality met, skip to finalization
    if (assessment.overall === 'green') {
      break;
    }

    // Yellow: Continue but log
    if (assessment.overall === 'yellow' && assessment.heuristic_warnings.length > 0) {
      console.log('Quality compromised:', assessment.heuristic_warnings);
    }

    // Check question budget
    const remainingBudget = LOOP_CONFIG.maxQuestionsTotal - session.total_questions_asked;
    if (remainingBudget <= 0) {
      break;
    }

    // VS-32: Step 3 - Critic assesses gaps with pillar config
    const { output: gapsOutput, log: assessLog } = await Critic.assessGaps(
      currentDraft,
      data,
      session.id,
      round,
      pillarConfig
    );
    await saveStep(supabase, assessLog);

    await saveConversation(
      supabase,
      session.id,
      sequence++,
      'critic',
      'assess',
      assessLog.prompt_sent || '',
      assessLog.raw_response || '',
      currentDraft,
      gapsOutput
    );

    if (gapsOutput.gaps.length === 0) {
      break;
    }

    // Step 4: Prioritize and generate questions
    const prioritizedGaps = prioritizeGaps(
      gapsOutput.gaps,
      data.objectives,
      data.initiatives
    ).slice(0, remainingBudget);

    if (prioritizedGaps.length === 0) {
      break;
    }

    // VS-32: Generate questions with pillar config and question budget
    // CRITICAL: Pass context so AI knows what's already answered and doesn't ask redundant questions
    const { output: questionsOutput, log: questionsLog } = await Critic.generateQuestions(
      prioritizedGaps,
      session.id,
      round,
      pillarConfig,
      undefined, // previousQuestions - not tracked yet
      remainingBudget,
      data // VS-32 FIX: Pass context to prevent redundant questions
    );
    await saveStep(supabase, questionsLog);

    await saveConversation(
      supabase,
      session.id,
      sequence++,
      'critic',
      'questions',
      questionsLog.prompt_sent || '',
      questionsLog.raw_response || '',
      prioritizedGaps,
      questionsOutput
    );

    if (questionsOutput.questions.length > 0) {
      // Save questions and pause for user
      await saveQuestions(supabase, session.id, round, questionsOutput.questions);
      await updateSessionStatus(supabase, session.id, 'awaiting_user', {
        current_round: round,
      });

      return {
        status: 'awaiting_user',
        session_id: session.id,
        questions: questionsOutput.questions,
      };
    }

    round++;
  }

  // VS-32: Step 5 - Final polish with pillar config
  await updateSessionStatus(supabase, session.id, 'finalizing');

  const { output: finalFeedback, log: finalLog } = await Critic.getFinalFeedback(
    currentDraft,
    session.id,
    pillarConfig
  );
  await saveStep(supabase, finalLog);

  await saveConversation(
    supabase,
    session.id,
    sequence++,
    'critic',
    'feedback',
    finalLog.prompt_sent || '',
    finalLog.raw_response || '',
    currentDraft,
    finalFeedback
  );

  // VS-32: Step 6 - Finalize with pillar config
  const { report, log: finalizeLog } = await Generator.finalize(
    currentDraft,
    finalFeedback,
    session.id,
    pillarConfig
  );
  await saveStep(supabase, finalizeLog);

  await saveConversation(
    supabase,
    session.id,
    sequence++,
    'generator',
    'finalize',
    finalizeLog.prompt_sent || '',
    finalizeLog.raw_response || '',
    { draft: currentDraft, feedback: finalFeedback },
    report
  );

  // VS-32: Get final assessment for quality metadata
  // Convert InterpretedReport to DraftReport-like for heuristics
  const reportForAssessment = {
    synthesis: report.synthesis,
    priority_rationale: report.priority_rationale,
    key_insight: report.key_insight,
    gaps_marked: [],
  };
  const finalAssessment = assessHeuristics(reportForAssessment, data);

  // Get answered questions count
  const { count: questionsAnswered } = await supabase
    .from('interpretation_questions')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', session.id)
    .not('answer', 'is', null);

  // Save final report
  const finalOutput: FinalReportOutput = {
    session_id: session.id,
    run_id: data.run_id,
    report,
    word_count: countWords(reportForAssessment),
    rounds_used: round + 1,
    questions_answered: questionsAnswered || 0,
    quality_status: finalAssessment.overall,
    quality_compromised: finalAssessment.overall === 'yellow',
    heuristic_warnings: finalAssessment.heuristic_warnings,
  };

  await saveReport(supabase, finalOutput);
  await updateSessionStatus(supabase, session.id, 'complete', {
    completed_at: new Date().toISOString(),
  });

  return {
    status: 'complete',
    session_id: session.id,
    report: finalOutput,
  };
}
