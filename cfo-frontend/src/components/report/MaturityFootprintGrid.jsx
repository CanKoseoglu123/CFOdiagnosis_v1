// src/components/report/MaturityFootprintGrid.jsx
// VS-23: Truthful maturity footprint grid - NOT a staircase

import React from 'react';

const LEVEL_NAMES = {
  1: 'Foundation',
  2: 'Defined',
  3: 'Managed',
  4: 'Optimized'
};

// Evidence state indicator (colored dot)
function EvidenceIndicator({ state }) {
  switch (state) {
    case 'proven':
      return (
        <div
          className="w-3 h-3 rounded-full bg-emerald-500"
          title="Proven"
        />
      );
    case 'partial':
      return (
        <div
          className="w-3 h-3 rounded-full bg-amber-500"
          title="Partial"
        />
      );
    case 'not_proven':
    default:
      return (
        <div
          className="w-3 h-3 rounded-full border-2 border-slate-300 bg-white"
          title="Not proven"
        />
      );
  }
}

// Individual practice card
function PracticeCard({ practice }) {
  const borderColor = {
    proven: 'border-emerald-300 bg-emerald-50',
    partial: 'border-amber-300 bg-amber-50',
    not_proven: 'border-slate-200 bg-white'
  }[practice.evidence_state] || 'border-slate-200 bg-white';

  return (
    <div className={`border rounded p-3 ${borderColor} min-w-[120px] flex-1`}>
      <div className="text-xs font-medium text-slate-700 text-center mb-2 leading-tight">
        {practice.title}
      </div>
      <div className="flex justify-center">
        <EvidenceIndicator state={practice.evidence_state} />
      </div>
    </div>
  );
}

// Level row with practices
function LevelRow({ level, name, practices }) {
  const provenCount = practices.filter(p => p.evidence_state === 'proven').length;
  const totalCount = practices.length;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-bold text-slate-700">
          L{level} {name.toUpperCase()}
        </div>
        <div className="text-xs text-slate-500">
          {provenCount}/{totalCount} proven
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {practices.map(practice => (
          <PracticeCard key={practice.id} practice={practice} />
        ))}
      </div>
    </div>
  );
}

// Focus Next priority card
function FocusNextCard({ practice, rank }) {
  return (
    <div className="flex items-center gap-3 p-2 border border-slate-200 rounded bg-slate-50">
      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-800">{practice.title}</div>
        <div className="text-xs text-slate-500">
          L{practice.level} · {practice.is_critical ? 'Critical Blocker' : 'High Impact'}
        </div>
      </div>
    </div>
  );
}

// Main component
export default function MaturityFootprintGrid({ levels, focusNext, summaryText }) {
  return (
    <div className="bg-white rounded border border-slate-300">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h2 className="text-base font-bold text-slate-700 uppercase tracking-wide">
          Maturity Footprint
        </h2>
      </div>

      {/* Summary insight */}
      {summaryText && (
        <div className="px-4 py-3 border-b border-slate-200 bg-blue-50">
          <p className="text-sm text-blue-800">{summaryText}</p>
        </div>
      )}

      {/* Grid - levels in reverse order (L4 at top) */}
      <div className="p-4">
        {[4, 3, 2, 1].map(levelNum => {
          const level = levels.find(l => l.level === levelNum);
          if (!level || !level.practices || level.practices.length === 0) return null;
          return (
            <LevelRow
              key={levelNum}
              level={level.level}
              name={level.name}
              practices={level.practices}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center gap-6 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Proven</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-slate-300 bg-white" />
            <span>Not proven</span>
          </div>
        </div>
      </div>

      {/* Focus Next */}
      {focusNext && focusNext.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-200">
          <div className="text-sm font-bold text-slate-700 mb-3">
            FOCUS NEXT
          </div>
          <div className="space-y-2">
            {focusNext.map((practice, idx) => (
              <FocusNextCard key={practice.id} practice={practice} rank={idx + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
