// src/components/admin/TransparencyTab.jsx
// Admin Calculation Transparency - Hierarchical Score Breakdown
// Shows complete audit trail: Question → Practice → Objective → Overall

import React, { useState, useEffect } from 'react';
import {
  Calculator, ChevronDown, ChevronRight, AlertTriangle, CheckCircle,
  Lock, Target, TrendingUp, FileText, Loader2, Building2, User, Info
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

// Traffic light badge component
function TrafficLightBadge({ status }) {
  const config = {
    green: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Green' },
    yellow: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Yellow' },
    red: { bg: 'bg-red-100', text: 'text-red-700', label: 'Red' },
  }[status] || { bg: 'bg-slate-100', text: 'text-slate-600', label: status };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

// Priority badge
function PriorityBadge({ priority }) {
  const config = {
    P1: { bg: 'bg-red-100', text: 'text-red-700' },
    P2: { bg: 'bg-amber-100', text: 'text-amber-700' },
    P3: { bg: 'bg-blue-100', text: 'text-blue-700' },
  }[priority] || { bg: 'bg-slate-100', text: 'text-slate-600' };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${config.bg} ${config.text}`}>
      {priority}
    </span>
  );
}

// Evidence state badge
function EvidenceStateBadge({ state }) {
  const config = {
    proven: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Proven' },
    partial: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Partial' },
    not_proven: { bg: 'bg-red-100', text: 'text-red-700', label: 'Not Proven' },
  }[state] || { bg: 'bg-slate-100', text: 'text-slate-600', label: state };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

// Answer badge
function AnswerBadge({ answer }) {
  const config = {
    YES: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    NO: { bg: 'bg-red-100', text: 'text-red-700' },
    'N/A': { bg: 'bg-slate-100', text: 'text-slate-500' },
    Unanswered: { bg: 'bg-slate-100', text: 'text-slate-400' },
  }[answer] || { bg: 'bg-slate-100', text: 'text-slate-600' };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${config.bg} ${config.text}`}>
      {answer}
    </span>
  );
}

// Run status badge component
function RunStatusBadge({ status, progress }) {
  const config = {
    draft: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Draft' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
    completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' },
    locked: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Finalized' },
  }[status] || { bg: 'bg-slate-100', text: 'text-slate-600', label: status };

  const showProgress = status === 'in_progress' && typeof progress === 'number';

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${config.bg} ${config.text}`}>
      {config.label}{showProgress ? ` (${Math.round(progress)}%)` : ''}
    </span>
  );
}

// Question row component
function QuestionRow({ question }) {
  return (
    <div className="border border-slate-200 rounded p-3 bg-white hover:bg-slate-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-slate-500">{question.question_id}</span>
            {question.is_critical && (
              <span className="px-1.5 py-0.5 text-xs font-medium bg-red-50 text-red-600 rounded">
                Critical
              </span>
            )}
            <span className="text-xs text-slate-400">L{question.maturity_level}</span>
          </div>
          <p className="text-sm text-slate-800 mb-2">{question.question_text}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span>
              <span className="text-slate-500">Answer:</span>{' '}
              <AnswerBadge answer={question.answer} />
            </span>
            <span className="text-slate-500">
              Possible: <span className="font-medium text-slate-700">{question.possible_points}</span> pts
            </span>
            <span className="text-slate-500">
              Achieved: <span className="font-medium text-slate-700">{question.achieved_points}</span> pts
            </span>
            <span className="text-slate-500">
              Weight: <span className="font-medium text-slate-700">{question.percent_of_total.toFixed(1)}%</span>
            </span>
            <span className="text-slate-500">
              Impact: <span className="font-medium text-slate-700">{question.impact}</span>
            </span>
            <span className="text-slate-500">
              Complexity: <span className="font-medium text-slate-700">{question.complexity}</span>
            </span>
          </div>
          {question.blocking_status && (
            <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle className="w-3 h-3" />
              {question.blocking_status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Practice accordion component
function PracticeAccordion({ practice, isExpanded, onToggle }) {
  return (
    <div className="border border-slate-200 rounded overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-800">{practice.practice_title}</span>
              <span className="text-xs text-slate-400">L{practice.maturity_level}</span>
              <EvidenceStateBadge state={practice.evidence_state} />
              {practice.has_critical_failure && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-red-50 text-red-600 rounded">
                  Critical Failure
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {practice.achieved_points}/{practice.possible_points} pts ({practice.score.toFixed(0)}%)
              {' | '}
              {practice.yes_count} YES, {practice.no_count} NO{practice.na_count > 0 ? `, ${practice.na_count} N/A` : ''}
              {' | '}
              Contributes {practice.contribution_to_objective.toFixed(0)}% of objective
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-slate-800">{practice.score.toFixed(0)}%</div>
        </div>
      </button>

      {isExpanded && (
        <div className="p-3 space-y-2 bg-white">
          {practice.questions.map((q) => (
            <QuestionRow key={q.question_id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}

// Objective accordion component
function ObjectiveAccordion({ objective, isExpanded, onToggle, expandedPractices, togglePractice }) {
  return (
    <div className="border border-slate-200 rounded overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">{objective.objective_name}</span>
              <TrafficLightBadge status={objective.traffic_light} />
              {objective.critical_override && (
                <span className="text-xs text-amber-600">(Override)</span>
              )}
            </div>
            <div className="text-sm text-slate-500 mt-0.5">
              {objective.achieved_points}/{objective.possible_points} pts
              {' | '}
              {objective.yes_count} YES, {objective.no_count} NO{objective.na_count > 0 ? `, ${objective.na_count} N/A` : ''}
              {' | '}
              Importance: {objective.importance_level} ({objective.importance_multiplier.toFixed(2)}x)
              {' | '}
              Contributes {objective.contribution_to_overall.toFixed(1)}% of total
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-800">{objective.score.toFixed(0)}%</div>
          <div className="text-xs text-slate-500">{objective.practices.length} practices</div>
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          {objective.practices.map((p) => (
            <PracticeAccordion
              key={p.practice_id}
              practice={p}
              isExpanded={expandedPractices.has(p.practice_id)}
              onToggle={() => togglePractice(p.practice_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Overall score card
function OverallScoreCard({ overall }) {
  const scorePercent = overall.total_possible_points > 0
    ? (overall.total_achieved_points / overall.total_possible_points) * 100
    : 0;

  return (
    <div className="bg-white border border-slate-200 rounded p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-5 h-5 text-slate-600" />
        <h3 className="font-semibold text-slate-800">Overall Score</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-3xl font-bold text-slate-800">{overall.execution_score.toFixed(0)}%</div>
          <div className="text-xs text-slate-500">Execution Score</div>
        </div>
        <div>
          <div className="text-xl font-semibold text-slate-800">
            L{overall.actual_maturity.level} {overall.actual_maturity.label}
          </div>
          <div className="text-xs text-slate-500">Actual Maturity</div>
          {overall.capped && (
            <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
              <Lock className="w-3 h-3" />
              Capped
            </div>
          )}
        </div>
        <div>
          <div className="text-lg text-slate-600">
            L{overall.potential_maturity.level} {overall.potential_maturity.label}
          </div>
          <div className="text-xs text-slate-500">Potential Maturity</div>
        </div>
        <div>
          <div className="text-lg text-slate-600">
            {overall.total_achieved_points} / {overall.total_possible_points}
          </div>
          <div className="text-xs text-slate-500">Points Achieved</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className="absolute top-0 left-0 h-full bg-blue-500 transition-all"
          style={{ width: `${scorePercent}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
        <span>
          <span className="font-medium text-slate-800">{overall.total_questions}</span> total questions
        </span>
        <span>
          <span className="font-medium text-slate-800">{overall.applicable_questions}</span> applicable
        </span>
        <span>
          <span className="font-medium text-emerald-600">{overall.yes_count}</span> YES
        </span>
        <span>
          <span className="font-medium text-red-600">{overall.no_count}</span> NO
        </span>
        {overall.na_count > 0 && (
          <span>
            <span className="font-medium text-slate-500">{overall.na_count}</span> N/A excluded
          </span>
        )}
      </div>

      {overall.cap_reason && (
        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
          {overall.cap_reason}
        </div>
      )}
    </div>
  );
}

// Blocking analysis card
function BlockingAnalysisCard({ blocking }) {
  return (
    <div className="bg-white border border-slate-200 rounded p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-5 h-5 text-slate-600" />
        <h3 className="font-semibold text-slate-800">Blocking Analysis</h3>
      </div>

      {blocking.current_blockers.length > 0 ? (
        <div className="mb-4">
          <div className="text-sm font-medium text-red-700 mb-2">
            Current Blockers ({blocking.current_blockers.length})
          </div>
          <div className="space-y-2">
            {blocking.current_blockers.map((b) => (
              <div key={b.question_id} className="flex items-start gap-2 p-2 bg-red-50 rounded text-sm">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-mono text-xs text-red-600">{b.question_id}</span>
                  <p className="text-red-700">{b.question_text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-4 p-2 bg-emerald-50 rounded text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          No blockers - all critical gates passed
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* L1 Gate Status */}
        <div className="p-3 bg-slate-50 rounded">
          <div className="text-sm font-medium text-slate-800 mb-2">L1 Gate Status</div>
          <div className="text-xs text-slate-600">
            <span className="font-medium text-emerald-600">{blocking.l1_gate_status.passed}</span> passed,{' '}
            <span className="font-medium text-red-600">{blocking.l1_gate_status.failed}</span> failed{' '}
            of {blocking.l1_gate_status.total_criticals} criticals
          </div>
          {blocking.l1_gate_status.failed > 0 && (
            <div className="mt-2 text-xs text-slate-500">
              Failed: {blocking.l1_gate_status.failed_questions.join(', ')}
            </div>
          )}
        </div>

        {/* L2 Gate Status */}
        <div className="p-3 bg-slate-50 rounded">
          <div className="text-sm font-medium text-slate-800 mb-2">L2 Gate Status</div>
          <div className="text-xs text-slate-600">
            <span className="font-medium text-emerald-600">{blocking.l2_gate_status.passed}</span> passed,{' '}
            <span className="font-medium text-red-600">{blocking.l2_gate_status.failed}</span> failed{' '}
            of {blocking.l2_gate_status.total_criticals} criticals
          </div>
          {blocking.l2_gate_status.failed > 0 && (
            <div className="mt-2 text-xs text-slate-500">
              Failed: {blocking.l2_gate_status.failed_questions.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Unlock requirements */}
      {(blocking.unlock_l2_requires.length > 0 || blocking.unlock_l3_requires.criticals_needed.length > 0) && (
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <div className="text-sm font-medium text-blue-800 mb-2">Unlock Requirements</div>
          {blocking.unlock_l2_requires.length > 0 && (
            <div className="text-xs text-blue-700 mb-1">
              <span className="font-medium">To unlock L2:</span> Answer YES to{' '}
              {blocking.unlock_l2_requires.join(', ')}
            </div>
          )}
          {blocking.unlock_l3_requires.criticals_needed.length > 0 && (
            <div className="text-xs text-blue-700">
              <span className="font-medium">To unlock L3:</span> Reach {blocking.unlock_l3_requires.score_needed}% score
              + pass {blocking.unlock_l3_requires.criticals_needed.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Action impact card
function ActionImpactCard({ actions }) {
  if (!actions || actions.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-800">Action Impact Projection</h3>
        </div>
        <p className="text-sm text-slate-500">No actions selected in the action plan.</p>
      </div>
    );
  }

  const p1Actions = actions.filter((a) => a.priority === 'P1');
  const p2Actions = actions.filter((a) => a.priority === 'P2');
  const p3Actions = actions.filter((a) => a.priority === 'P3');

  return (
    <div className="bg-white border border-slate-200 rounded p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-slate-600" />
        <h3 className="font-semibold text-slate-800">Action Impact Projection</h3>
        <span className="text-sm text-slate-500">({actions.length} selected actions)</span>
      </div>

      <div className="space-y-4">
        {/* P1 Actions */}
        {p1Actions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PriorityBadge priority="P1" />
              <span className="text-sm font-medium text-slate-700">Unlock Actions ({p1Actions.length})</span>
            </div>
            <div className="space-y-2">
              {p1Actions.map((action) => (
                <div key={action.question_id} className="p-3 bg-red-50 rounded border border-red-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-red-600">{action.question_id}</span>
                    <span className="text-xs text-slate-500">Current: {action.current_answer}</span>
                  </div>
                  <p className="text-sm text-slate-800 mb-2">{action.question_text}</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="text-emerald-700">{action.score_impact}</span>
                    {action.maturity_impact && (
                      <span className="text-blue-700">{action.maturity_impact}</span>
                    )}
                    {action.projected_new_level && (
                      <span className="font-medium text-purple-700">{action.projected_new_level}</span>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Score: {action.action_score} = {action.action_formula}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* P2 Actions */}
        {p2Actions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PriorityBadge priority="P2" />
              <span className="text-sm font-medium text-slate-700">Optimize Actions ({p2Actions.length})</span>
            </div>
            <div className="space-y-2">
              {p2Actions.slice(0, 5).map((action) => (
                <div key={action.question_id} className="p-2 bg-amber-50 rounded border border-amber-100 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-amber-600">{action.question_id}</span>
                    <span className="text-xs text-emerald-700">{action.score_impact}</span>
                  </div>
                  <p className="text-slate-700 text-xs mt-1 truncate">{action.question_text}</p>
                </div>
              ))}
              {p2Actions.length > 5 && (
                <div className="text-xs text-slate-500">+ {p2Actions.length - 5} more P2 actions</div>
              )}
            </div>
          </div>
        )}

        {/* P3 Actions */}
        {p3Actions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PriorityBadge priority="P3" />
              <span className="text-sm font-medium text-slate-700">Future Actions ({p3Actions.length})</span>
            </div>
            <div className="text-xs text-slate-500">
              {p3Actions.map((a) => a.question_id).join(', ')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Run selector component - shows ALL runs sorted by status
function RunSelector({ sessions, selectedRunId, onSelect, loading }) {
  // Sort sessions: completed/locked first, then in_progress, then draft
  const statusOrder = { locked: 0, completed: 1, in_progress: 2, draft: 3 };
  const sortedSessions = [...sessions].sort((a, b) => {
    const orderA = statusOrder[a.status] ?? 4;
    const orderB = statusOrder[b.status] ?? 4;
    if (orderA !== orderB) return orderA - orderB;
    // Within same status, sort by date (newest first)
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const getStatusLabel = (status) => {
    const labels = {
      draft: '[Draft]',
      in_progress: '[In Progress]',
      completed: '[Completed]',
      locked: '[Finalized]',
    };
    return labels[status] || `[${status}]`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded p-4 mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Select Diagnostic Run
      </label>
      <select
        value={selectedRunId}
        onChange={(e) => onSelect(e.target.value)}
        disabled={loading}
        className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">-- Select a run --</option>
        {sortedSessions.map((session) => (
          <option key={session.id} value={session.id}>
            {session.company_name || 'Unnamed'} - {new Date(session.created_at).toLocaleDateString()}{' '}
            {getStatusLabel(session.status)}
          </option>
        ))}
      </select>
      {sortedSessions.length === 0 && (
        <p className="text-xs text-slate-500 mt-2">No diagnostic runs available.</p>
      )}
    </div>
  );
}

// Setup context only view - for runs with 0 answers
function SetupContextOnlyView({ transparency }) {
  const { context, persona, data_availability, status, assessment_progress_pct } = transparency;

  return (
    <div className="space-y-4">
      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-medium text-amber-800">No Assessment Answers Yet</div>
          <p className="text-sm text-amber-700 mt-1">
            This run has not completed any diagnostic questions. Only setup context is available.
          </p>
        </div>
      </div>

      {/* Run Status Card */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-800">Run Status</h3>
          <RunStatusBadge status={status} progress={assessment_progress_pct} />
        </div>

        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Questions Answered:</span>{' '}
            <span className="font-medium text-slate-800">
              {data_availability.answered_count} / {data_availability.total_questions}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Calibration:</span>{' '}
            <span className="font-medium text-slate-800">
              {data_availability.has_calibration ? 'Completed' : 'Not Started'}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Status:</span>{' '}
            <span className="font-medium text-slate-800 capitalize">{status?.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Company Context Card */}
      {context?.company && (
        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-800">Company Context</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            {context.company.name && (
              <div>
                <span className="text-slate-500">Company Name:</span>{' '}
                <span className="font-medium text-slate-800">{context.company.name}</span>
              </div>
            )}
            {context.company.industry && (
              <div>
                <span className="text-slate-500">Industry:</span>{' '}
                <span className="font-medium text-slate-800">{context.company.industry}</span>
              </div>
            )}
            {context.company.revenue_range && (
              <div>
                <span className="text-slate-500">Revenue Range:</span>{' '}
                <span className="font-medium text-slate-800">{context.company.revenue_range}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Persona Card */}
      {persona && (
        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-800">Persona Classification</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Persona Type:</span>{' '}
              <span className="font-medium text-slate-800 capitalize">{persona.type?.replace(/_/g, ' ')}</span>
            </div>
            <div>
              <span className="text-slate-500">Confidence:</span>{' '}
              <span className="font-medium text-slate-800">{Math.round(persona.confidence * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty context message */}
      {!context?.company && !persona && (
        <div className="bg-slate-50 border border-slate-200 rounded p-4 text-center">
          <p className="text-slate-500">No setup context available for this run.</p>
        </div>
      )}
    </div>
  );
}

// Partial data warning card - for incomplete runs with some answers
function PartialDataCard({ dataAvailability, status, progress }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-blue-800">Partial Assessment Data</span>
            <RunStatusBadge status={status} progress={progress} />
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              Questions answered: <strong>{dataAvailability.answered_count}</strong> / {dataAvailability.total_questions}
            </p>
            <p>
              Calibration: <strong>{dataAvailability.has_calibration ? 'Completed' : 'Not Completed'}</strong>
            </p>
            {!dataAvailability.has_calibration && (
              <p className="text-blue-600">
                (Default importance multiplier of 1.0x is used for all objectives)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main TransparencyTab component
export default function TransparencyTab({ sessions, getToken }) {
  const [selectedRunId, setSelectedRunId] = useState('');
  const [transparency, setTransparency] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Accordion state
  const [expandedObjectives, setExpandedObjectives] = useState(new Set());
  const [expandedPractices, setExpandedPractices] = useState(new Set());

  // Fetch transparency data when run is selected
  useEffect(() => {
    if (!selectedRunId) {
      setTransparency(null);
      return;
    }

    async function fetchTransparency() {
      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/admin/runs/${selectedRunId}/transparency`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to fetch transparency data');
        }

        const data = await res.json();
        setTransparency(data);

        // Auto-expand first objective
        if (data.objectives?.length > 0) {
          setExpandedObjectives(new Set([data.objectives[0].objective_id]));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTransparency();
  }, [selectedRunId, getToken]);

  const toggleObjective = (id) => {
    setExpandedObjectives((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const togglePractice = (id) => {
    setExpandedPractices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (!transparency) return;
    setExpandedObjectives(new Set(transparency.objectives.map((o) => o.objective_id)));
    const allPractices = new Set();
    for (const obj of transparency.objectives) {
      for (const prac of obj.practices) {
        allPractices.add(prac.practice_id);
      }
    }
    setExpandedPractices(allPractices);
  };

  const collapseAll = () => {
    setExpandedObjectives(new Set());
    setExpandedPractices(new Set());
  };

  return (
    <div className="space-y-4">
      <RunSelector
        sessions={sessions}
        selectedRunId={selectedRunId}
        onSelect={setSelectedRunId}
        loading={loading}
      />

      {loading && (
        <div className="bg-white border border-slate-200 rounded p-8 text-center">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
          <p className="text-slate-500">Loading transparency data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {!loading && transparency && (
        <>
          {/* Header with status badge */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-800">{transparency.company_name}</h2>
                <RunStatusBadge status={transparency.status} progress={transparency.assessment_progress_pct} />
              </div>
              <div className="text-sm text-slate-500">
                Spec {transparency.spec_version} | Generated {new Date(transparency.generated_at).toLocaleString()}
              </div>
            </div>
            {/* Only show expand/collapse buttons if there's data to expand */}
            {transparency.data_availability?.answered_count > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={expandAll}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded hover:bg-slate-50"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded hover:bg-slate-50"
                >
                  Collapse All
                </button>
              </div>
            )}
          </div>

          {/* View for runs with NO answers - show context only */}
          {transparency.data_availability?.answered_count === 0 && (
            <SetupContextOnlyView transparency={transparency} />
          )}

          {/* View for runs WITH some answers */}
          {transparency.data_availability?.answered_count > 0 && (
            <>
              {/* Show partial data warning for incomplete runs */}
              {!transparency.data_availability?.is_complete && (
                <PartialDataCard
                  dataAvailability={transparency.data_availability}
                  status={transparency.status}
                  progress={transparency.assessment_progress_pct}
                />
              )}

              {/* Overall Score */}
              <OverallScoreCard overall={transparency.overall} />

              {/* Blocking Analysis */}
              <BlockingAnalysisCard blocking={transparency.blocking} />

              {/* Hierarchy View */}
              <div className="bg-white border border-slate-200 rounded p-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-slate-600" />
                  <h3 className="font-semibold text-slate-800">Hierarchy View</h3>
                  <span className="text-sm text-slate-500">
                    ({transparency.objectives.length} objectives)
                  </span>
                </div>

                <div className="space-y-3">
                  {transparency.objectives.map((objective) => (
                    <ObjectiveAccordion
                      key={objective.objective_id}
                      objective={objective}
                      isExpanded={expandedObjectives.has(objective.objective_id)}
                      onToggle={() => toggleObjective(objective.objective_id)}
                      expandedPractices={expandedPractices}
                      togglePractice={togglePractice}
                    />
                  ))}
                </div>
              </div>

              {/* Action Impact */}
              <ActionImpactCard actions={transparency.action_impact} />
            </>
          )}
        </>
      )}

      {!loading && !transparency && selectedRunId === '' && (
        <div className="bg-white border border-slate-200 rounded p-8 text-center">
          <Calculator className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">Select a diagnostic run to view calculation transparency.</p>
        </div>
      )}
    </div>
  );
}
