// src/components/report/InitiativeCard.jsx
// Collapsible initiative card with nested actions

import { ChevronDown } from 'lucide-react';
import ActionRow from './ActionRow';

export default function InitiativeCard({ initiative, expanded, onToggle, forPrint = false }) {
  const isExpanded = expanded || forPrint;
  const criticalCount = initiative.actions?.filter(a => a.is_critical).length || 0;
  const actionCount = initiative.actions?.length || 0;

  return (
    <div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
      {/* Header - clickable */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-navy uppercase tracking-wide">
              {initiative.initiative_title}
            </h3>

            {/* Critical count badge */}
            {criticalCount > 0 && (
              <span className="px-1.5 py-0.5 bg-red-700 text-white text-[10px] font-semibold uppercase tracking-wider rounded-sm">
                {criticalCount} Critical
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500 mt-1">
            {actionCount} action{actionCount !== 1 ? 's' : ''}
            {initiative.total_score && (
              <span className="ml-2">Score: {initiative.total_score}</span>
            )}
          </div>
        </div>

        <ChevronDown className={`
          w-4 h-4 text-slate-400 transition-transform duration-200
          ${isExpanded ? 'rotate-180' : ''}
        `} />
      </button>

      {/* Body - collapsible, slate background */}
      {isExpanded && initiative.actions && initiative.actions.length > 0 && (
        <div className="bg-slate-50 border-t border-slate-200">
          <div className="p-3 space-y-2">
            {initiative.actions.map((action, idx) => (
              <ActionRow key={action.question_id || idx} action={action} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
