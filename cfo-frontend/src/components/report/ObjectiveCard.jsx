// src/components/report/ObjectiveCard.jsx
// Traffic light card for objective health

import { CheckCircle, AlertCircle } from 'lucide-react';

const STATUS_STYLES = {
  green: {
    border: 'border-l-4 border-l-green-600',
    icon: CheckCircle,
    iconColor: 'text-green-600',
    barColor: 'bg-green-600'
  },
  yellow: {
    border: 'border-l-4 border-l-yellow-500',
    icon: AlertCircle,
    iconColor: 'text-yellow-600',
    barColor: 'bg-yellow-500'
  },
  red: {
    border: 'border-l-4 border-l-red-600',
    icon: AlertCircle,
    iconColor: 'text-red-600',
    barColor: 'bg-red-600'
  }
};

export default function ObjectiveCard({ objective }) {
  const style = STATUS_STYLES[objective.status] || STATUS_STYLES.yellow;
  const Icon = style.icon;
  const criticalCount = objective.failed_criticals?.length || 0;

  return (
    <div className={`
      bg-white border border-slate-300 rounded-sm overflow-hidden
      ${style.border}
    `}>
      <div className="p-3">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${style.iconColor}`} />
            <h3 className="text-sm font-bold text-navy">{objective.objective_name}</h3>
          </div>
          {objective.overridden && (
            <AlertCircle className="w-3 h-3 text-yellow-500" title={objective.override_reason} />
          )}
        </div>

        {/* Score line */}
        <div className="text-xs text-slate-500 mb-2">
          {objective.score}% ({objective.questions_passed}/{objective.questions_total})
        </div>

        {/* Critical gaps badge */}
        {criticalCount > 0 && (
          <div className="mb-2">
            <span className="px-1.5 py-0.5 bg-red-700 text-white text-[10px] font-semibold uppercase tracking-wider rounded-sm">
              {criticalCount} Critical
            </span>
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${style.barColor}`}
            style={{ width: `${objective.score}%` }}
          />
        </div>
      </div>
    </div>
  );
}
