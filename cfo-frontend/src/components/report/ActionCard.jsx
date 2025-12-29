/**
 * VS-32d: Action Card Component
 *
 * Displays a single proposed action with timeline, rationale, and controls.
 */

import { useState } from 'react';

const TIMELINE_LABELS = {
  '6m': '6 months',
  '12m': '12 months',
  '24m': '24 months',
};

const TIMELINE_COLORS = {
  '6m': 'bg-amber-100 text-amber-800 border-amber-300',
  '12m': 'bg-blue-100 text-blue-800 border-blue-300',
  '24m': 'bg-slate-100 text-slate-600 border-slate-300',
};

export function ActionCard({
  action,
  onTimelineChange,
  onRemove,
  readOnly = false,
}) {
  const [expanded, setExpanded] = useState(false);

  if (!action) return null;

  const {
    question_id,
    action_title,
    action_recommendation,
    timeline,
    rationale,
    priority_rank,
    is_critical,
    is_gate_blocker,
  } = action;

  return (
    <div className="border border-slate-200 bg-white">
      {/* Header */}
      <div className="p-4 flex items-start gap-4">
        {/* Priority rank */}
        <div className="flex-shrink-0 w-8 h-8 bg-slate-100 text-slate-600 text-sm font-semibold flex items-center justify-center">
          {priority_rank}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-medium text-slate-900">{action_title}</h4>
              <p className="text-sm text-slate-500 mt-1">{action_recommendation}</p>
            </div>

            {/* Badges */}
            <div className="flex-shrink-0 flex items-center gap-2">
              {is_critical && (
                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 border border-red-300">
                  Critical
                </span>
              )}
              {is_gate_blocker && (
                <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 border border-purple-300">
                  Gate Blocker
                </span>
              )}
            </div>
          </div>

          {/* Timeline and controls */}
          <div className="mt-3 flex items-center gap-3">
            {readOnly ? (
              <span className={`px-2 py-1 text-xs font-medium border ${TIMELINE_COLORS[timeline]}`}>
                {TIMELINE_LABELS[timeline]}
              </span>
            ) : (
              <select
                value={timeline}
                onChange={(e) => onTimelineChange?.(question_id, e.target.value)}
                className={`px-2 py-1 text-xs font-medium border ${TIMELINE_COLORS[timeline]} cursor-pointer`}
              >
                <option value="6m">6 months</option>
                <option value="12m">12 months</option>
                <option value="24m">24 months</option>
              </select>
            )}

            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              {expanded ? 'Hide rationale' : 'Show rationale'}
            </button>

            {!readOnly && onRemove && (
              <button
                onClick={() => onRemove(question_id)}
                className="text-xs text-red-500 hover:text-red-700 ml-auto"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rationale (expandable) */}
      {expanded && rationale && (
        <div className="px-4 pb-4 pt-0">
          <div className="ml-12 p-3 bg-slate-50 border border-slate-200 space-y-2">
            <div>
              <span className="text-xs font-medium text-slate-500">Why selected:</span>
              <p className="text-sm text-slate-700">{rationale.why_selected}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500">Why this timeline:</span>
              <p className="text-sm text-slate-700">{rationale.why_this_timeline}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500">Expected impact:</span>
              <p className="text-sm text-slate-700">{rationale.expected_impact}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActionCard;
