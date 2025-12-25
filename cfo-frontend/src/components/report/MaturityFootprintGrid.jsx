// src/components/report/MaturityFootprintGrid.jsx
// VS-23: Maturity Footprint Grid - Enterprise design system compliant
// VS-27: Added Objectives & Practices Overview

import React from 'react';
import { AlertCircle, CheckCircle, Target } from 'lucide-react';
import ObjectivesPracticesOverview from './ObjectivesPracticesOverview';

// ═══════════════════════════════════════════════════════════════════════════
// LEVEL CONFIGURATION (Ladder perspective - higher = more strategic)
// ═══════════════════════════════════════════════════════════════════════════

const LEVEL_CONFIG = {
  4: { name: 'Optimized', headerBg: 'bg-indigo-900', headerText: 'text-white' },
  3: { name: 'Managed', headerBg: 'bg-indigo-700', headerText: 'text-white' },
  2: { name: 'Defined', headerBg: 'bg-indigo-500', headerText: 'text-white' },
  1: { name: 'Emerging', headerBg: 'bg-indigo-400', headerText: 'text-white' }
};

// Evidence state → left border color (design system pattern)
const STATE_BORDER = {
  proven: 'border-l-green-600',
  partial: 'border-l-yellow-500',
  not_proven: 'border-l-slate-300'
};

// ═══════════════════════════════════════════════════════════════════════════
// PRACTICE TILE - Compact, fits in one row
// ═══════════════════════════════════════════════════════════════════════════

function PracticeTile({ practice }) {
  const borderColor = STATE_BORDER[practice.evidence_state] || STATE_BORDER.not_proven;

  return (
    <div
      className={`
        bg-white border border-slate-200 rounded-sm border-l-4 ${borderColor}
        px-2 py-1 min-w-[90px] max-w-[140px] flex-shrink-0
      `}
    >
      <div className="flex items-center gap-1">
        {/* Critical marker */}
        {practice.is_critical && (
          <AlertCircle className="w-3 h-3 text-red-600 flex-shrink-0" />
        )}

        {/* Practice title - truncate if too long */}
        <span className="text-xs text-slate-700 font-medium truncate">
          {practice.title}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LEVEL ROW - Horizontal strip with header + practices
// ═══════════════════════════════════════════════════════════════════════════

function LevelRow({ level, name, practices }) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];
  const provenCount = practices.filter(p => p.evidence_state === 'proven').length;
  const totalCount = practices.length;

  return (
    <div className="flex border-b border-slate-200 last:border-b-0">
      {/* Level header - fixed width, darker for higher levels */}
      <div className={`w-20 flex-shrink-0 ${config.headerBg} ${config.headerText} p-2`}>
        <div className="text-sm font-bold">L{level}</div>
        <div className="text-[10px] opacity-80">{name}</div>
        <div className="text-[10px] opacity-60 mt-0.5">{provenCount}/{totalCount}</div>
      </div>

      {/* Practice tiles - horizontal strip */}
      <div className="flex-1 p-1.5 flex flex-nowrap overflow-x-auto gap-1.5 bg-slate-50">
        {practices.map(practice => (
          <PracticeTile key={practice.id} practice={practice} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FOCUS NEXT - Priority gaps to address
// ═══════════════════════════════════════════════════════════════════════════

function FocusNextRow({ item, rank }) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-white border border-slate-200 rounded-sm">
      {/* Rank */}
      <div className="w-6 h-6 bg-slate-800 text-white rounded-sm flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold">{rank}</span>
      </div>

      {/* Title */}
      <span className="flex-1 text-sm text-navy font-medium">
        {item.title}
      </span>

      {/* Level badge */}
      <span className="text-xs text-slate-500">
        L{item.level}
      </span>

      {/* Critical indicator */}
      {item.is_critical && (
        <span className="px-1.5 py-0.5 bg-red-700 text-white text-[10px] font-semibold uppercase tracking-wider rounded-sm">
          Critical
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGEND
// ═══════════════════════════════════════════════════════════════════════════

function Legend() {
  return (
    <div className="flex items-center gap-6 text-xs text-slate-500">
      <div className="flex items-center gap-2">
        <div className="w-3 h-6 border border-slate-300 border-l-4 border-l-green-600 rounded-sm" />
        <span>Proven</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-6 border border-slate-300 border-l-4 border-l-yellow-500 rounded-sm" />
        <span>Partial</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-6 border border-slate-300 border-l-4 border-l-slate-300 rounded-sm" />
        <span>Gap</span>
      </div>
      <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
        <AlertCircle className="w-3 h-3 text-red-600" />
        <span>Critical</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function MaturityFootprintGrid({ levels, focusNext, summaryText, objectiveScores = {} }) {
  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SUMMARY INSIGHT */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {summaryText && (
        <div className="bg-white border border-slate-300 rounded-sm p-4">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate leading-relaxed">
              {summaryText}
            </p>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* OBJECTIVES & PRACTICES OVERVIEW (VS-27) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <ObjectivesPracticesOverview levels={levels} objectiveScores={objectiveScores} />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MATURITY LADDER GRID */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Capability Footprint
          </h2>
          <div className="text-xs text-slate-400">
            ↑ Strategic leverage
          </div>
        </div>

        {/* Grid - L4 at top (highest strategic value), L1 at bottom */}
        <div>
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
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
          <Legend />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PRIORITY GAPS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {focusNext && focusNext.length > 0 && (
        <div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Priority Gaps
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {focusNext.map((item, idx) => (
              <FocusNextRow key={item.id} item={item} rank={idx + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
