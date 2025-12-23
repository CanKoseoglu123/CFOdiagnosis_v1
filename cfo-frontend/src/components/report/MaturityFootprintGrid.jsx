// src/components/report/MaturityFootprintGrid.jsx
// VS-23: Maturity Footprint Grid - Professional Gartner-style design

import React from 'react';
import { ChevronRight } from 'lucide-react';

// Individual practice card - clean left-border treatment
function PracticeCard({ practice }) {
  const styles = {
    proven: {
      border: 'border-l-4 border-l-slate-700 border-y border-r border-slate-200',
      text: 'text-slate-800 font-medium',
      bg: 'bg-white'
    },
    partial: {
      border: 'border-l-2 border-l-slate-400 border-y border-r border-slate-200',
      text: 'text-slate-600',
      bg: 'bg-white'
    },
    not_proven: {
      border: 'border border-slate-200 border-dashed',
      text: 'text-slate-400',
      bg: 'bg-slate-50'
    }
  }[practice.evidence_state] || {
    border: 'border border-slate-200',
    text: 'text-slate-400',
    bg: 'bg-slate-50'
  };

  return (
    <div className={`${styles.border} ${styles.bg} rounded-sm px-3 py-2 min-w-[130px] flex-1`}>
      <div className={`text-xs ${styles.text} text-center leading-tight`}>
        {practice.title}
      </div>
    </div>
  );
}

// Level row with practices
function LevelRow({ level, name, practices, isFirst }) {
  const provenCount = practices.filter(p => p.evidence_state === 'proven').length;
  const totalCount = practices.length;
  const progress = totalCount > 0 ? (provenCount / totalCount) * 100 : 0;

  return (
    <div className={`${!isFirst ? 'border-t border-slate-100 pt-4' : ''} pb-4`}>
      {/* Level Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
            <span className="text-sm font-bold text-slate-600">L{level}</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-700">{name}</div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-3">
          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-600 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 w-12 text-right">
            {provenCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Practice cards */}
      <div className="flex flex-wrap gap-2">
        {practices.map(practice => (
          <PracticeCard key={practice.id} practice={practice} />
        ))}
      </div>
    </div>
  );
}

// Focus Next priority card - minimal design
function FocusNextCard({ practice, rank }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-b-0">
      <div className="w-5 h-5 rounded bg-slate-700 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-slate-700">{practice.title}</span>
        <span className="text-xs text-slate-400 ml-2">L{practice.level}</span>
      </div>
      {practice.is_critical && (
        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          Blocker
        </span>
      )}
      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
    </div>
  );
}

// Main component
export default function MaturityFootprintGrid({ levels, focusNext, summaryText }) {
  return (
    <div className="bg-white rounded border border-slate-300">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200">
        <h2 className="text-base font-bold text-slate-700 uppercase tracking-wide">
          Maturity Footprint
        </h2>
        {summaryText && (
          <p className="text-sm text-slate-500 mt-1">{summaryText}</p>
        )}
      </div>

      {/* Grid - levels in reverse order (L4 at top) */}
      <div className="px-4 py-2">
        {[4, 3, 2, 1].map((levelNum, idx) => {
          const level = levels.find(l => l.level === levelNum);
          if (!level || !level.practices || level.practices.length === 0) return null;
          return (
            <LevelRow
              key={levelNum}
              level={level.level}
              name={level.name}
              practices={level.practices}
              isFirst={idx === 0}
            />
          );
        })}
      </div>

      {/* Legend - subtle */}
      <div className="px-4 py-2 border-t border-slate-100">
        <div className="flex items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-3 border-l-4 border-l-slate-700 border-y border-r border-slate-200 rounded-sm bg-white" />
            <span>Proven</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-3 border-l-2 border-l-slate-400 border-y border-r border-slate-200 rounded-sm bg-white" />
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-3 border border-dashed border-slate-200 rounded-sm bg-slate-50" />
            <span>Gap</span>
          </div>
        </div>
      </div>

      {/* Focus Next */}
      {focusNext && focusNext.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Priority Gaps
          </div>
          <div>
            {focusNext.map((practice, idx) => (
              <FocusNextCard key={practice.id} practice={practice} rank={idx + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
