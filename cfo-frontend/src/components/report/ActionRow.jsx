// src/components/report/ActionRow.jsx
// Dense tabular action row with mobile-safe layout
// VS21: Added importance badge from calibration

import { useState } from 'react';
import { AlertCircle, ChevronRight, Star } from 'lucide-react';
import { ACTION_TYPE_CONFIG, EFFORT_CONFIG, IMPORTANCE_CONFIG } from '../../data/spec';

export default function ActionRow({ action }) {
  const [showDetail, setShowDetail] = useState(false);

  const typeConfig = ACTION_TYPE_CONFIG[action.action_type] || ACTION_TYPE_CONFIG.structural;
  const effortConfig = EFFORT_CONFIG[action.effort] || EFFORT_CONFIG.medium;
  const importanceConfig = action.importance ? IMPORTANCE_CONFIG[action.importance] : null;

  return (
    <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
      {/* Main row */}
      <button
        onClick={() => setShowDetail(!showDetail)}
        className="w-full px-3 py-2 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
      >
        {/* Critical indicator */}
        {action.is_critical && (
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
        )}

        {/* Title - takes remaining space */}
        <span className="flex-1 text-sm text-navy font-medium truncate">
          {action.action_title || action.action_text}
        </span>

        {/* VS21: Importance badge - only show if calibrated (non-default) */}
        {importanceConfig && action.importance !== 3 && (
          <span
            className={`
              px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide
              border rounded-sm flex items-center gap-1
              ${importanceConfig.color}
            `}
            title={importanceConfig.fullLabel}
          >
            <Star className="w-3 h-3" />
            {importanceConfig.label}
          </span>
        )}

        {/* Type badge - always visible */}
        <span className={`
          px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide
          border rounded-sm ${typeConfig.color}
        `}>
          {typeConfig.label}
        </span>

        {/* Score - HIDDEN ON MOBILE */}
        <span className="hidden md:block text-xs text-slate-500 w-10 text-right font-mono">
          {action.score?.toFixed(1) || '-'}
        </span>

        {/* Effort - HIDDEN ON MOBILE */}
        <span className={`hidden md:block text-xs w-8 text-right ${effortConfig.color}`}>
          {effortConfig.label}
        </span>

        {/* Expand indicator */}
        <ChevronRight className={`
          w-3 h-3 text-slate-400 transition-transform duration-200
          ${showDetail ? 'rotate-90' : ''}
        `} />
      </button>

      {/* Expanded details */}
      {showDetail && (
        <div className="px-3 pb-3 pt-0 border-t border-slate-100">
          {/* Recommendation - primary content */}
          {action.recommendation && (
            <div className="p-3 bg-primary/5 border-l-2 border-primary rounded-sm text-sm text-navy mt-2">
              <span className="font-semibold text-primary">Recommendation: </span>
              {action.recommendation}
            </div>
          )}

          {/* Question text */}
          {action.question_text && (
            <div className="p-3 bg-slate-50 rounded-sm text-sm text-slate mt-2">
              <span className="font-medium">Question: </span>
              {action.question_text}
            </div>
          )}

          {/* Impact */}
          {action.impact && (
            <div className="mt-2 text-xs text-slate-500">
              <span className="font-medium">Impact: </span>
              {action.impact}
            </div>
          )}

          {/* Show Score/Effort in expanded view on mobile */}
          <div className="md:hidden flex gap-4 mt-2 text-xs text-slate-500">
            <span>Score: {action.score?.toFixed(1) || '-'}</span>
            <span className={effortConfig.color}>Effort: {effortConfig.label}</span>
          </div>
        </div>
      )}
    </div>
  );
}
