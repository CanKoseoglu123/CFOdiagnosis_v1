// src/components/report/MaturityFootprintGrid.jsx
// VS-23: Maturity Footprint Grid - Consulting-grade visual redesign

import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const TILE_WIDTH = 140;
const TILE_HEIGHT = 80;
const MAX_PRACTICES_PER_ROW = 6; // Maximum to ensure grid alignment

// ═══════════════════════════════════════════════════════════════════════════
// PRACTICE TILE - Uniform size, solid color backgrounds
// ═══════════════════════════════════════════════════════════════════════════

function PracticeTile({ practice }) {
  // Color encodes evidence state (solid fills, not borders)
  const stateStyles = {
    proven: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-900',
      accent: 'bg-emerald-500'
    },
    partial: {
      bg: 'bg-amber-100',
      text: 'text-amber-900',
      accent: 'bg-amber-500'
    },
    not_proven: {
      bg: 'bg-slate-100',
      text: 'text-slate-500',
      accent: 'bg-slate-300'
    }
  };

  const style = stateStyles[practice.evidence_state] || stateStyles.not_proven;

  return (
    <div
      className={`relative ${style.bg} rounded flex flex-col items-center justify-center p-2`}
      style={{ width: TILE_WIDTH, height: TILE_HEIGHT }}
    >
      {/* Critical marker - bold left accent bar */}
      {practice.is_critical && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500 rounded-l" />
      )}

      {/* Evidence indicator dot */}
      <div className={`w-2.5 h-2.5 rounded-full ${style.accent} mb-2`} />

      {/* Practice title */}
      <div className={`text-xs font-medium ${style.text} text-center leading-tight px-1`}>
        {practice.title}
      </div>
    </div>
  );
}

// Empty spacer tile for grid alignment
function SpacerTile() {
  return (
    <div
      className="bg-transparent"
      style={{ width: TILE_WIDTH, height: TILE_HEIGHT }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LEVEL ROW - Aligned grid with spacers
// ═══════════════════════════════════════════════════════════════════════════

function LevelRow({ level, name, practices }) {
  const provenCount = practices.filter(p => p.evidence_state === 'proven').length;
  const totalCount = practices.length;

  // Create array with spacers for alignment
  const tiles = [...practices];
  while (tiles.length < MAX_PRACTICES_PER_ROW) {
    tiles.push(null); // Spacer
  }

  return (
    <div className="flex items-center gap-3 py-3">
      {/* Level label - fixed width for alignment */}
      <div className="w-24 flex-shrink-0">
        <div className="text-sm font-bold text-slate-700">L{level}</div>
        <div className="text-xs text-slate-500">{name}</div>
        <div className="text-xs text-slate-400 mt-1">{provenCount}/{totalCount}</div>
      </div>

      {/* Practice tiles - uniform grid */}
      <div className="flex gap-2 flex-wrap">
        {tiles.map((practice, idx) =>
          practice ? (
            <PracticeTile key={practice.id} practice={practice} />
          ) : (
            <SpacerTile key={`spacer-${idx}`} />
          )
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FOCUS NEXT - Large ranked cards with strong contrast
// ═══════════════════════════════════════════════════════════════════════════

function FocusNextCard({ item, rank }) {
  const rankColors = {
    1: 'bg-red-600',
    2: 'bg-orange-500',
    3: 'bg-amber-500'
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
      {/* Rank badge */}
      <div className={`w-10 h-10 ${rankColors[rank] || 'bg-slate-500'} rounded-full flex items-center justify-center flex-shrink-0`}>
        <span className="text-white font-bold text-lg">{rank}</span>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="text-base font-semibold text-slate-800">{item.title}</div>
        <div className="text-sm text-slate-500 mt-0.5">
          Level {item.level} · {item.is_critical ? 'Critical Blocker' : 'High Impact'}
        </div>
      </div>

      {/* Blocker badge */}
      {item.is_critical && (
        <div className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
          BLOCKER
        </div>
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
        <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-200" />
        <span>Proven</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-amber-100 border border-amber-200" />
        <span>Partial</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200" />
        <span>Gap</span>
      </div>
      <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
        <div className="w-1.5 h-4 bg-red-500 rounded" />
        <span>Contains Critical</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function MaturityFootprintGrid({ levels, focusNext, summaryText }) {
  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* DOMINANT INSIGHT HEADLINE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {summaryText && (
        <div className="bg-slate-800 text-white px-6 py-4 rounded-lg">
          <div className="text-lg font-semibold leading-snug">
            {summaryText}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MATURITY GRID */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Capability Footprint
          </h2>
          <div className="text-xs text-slate-400 italic">
            ↑ Strategic leverage increases
          </div>
        </div>

        {/* Grid - L4 at top, L1 at bottom */}
        <div className="px-6 py-4 divide-y divide-slate-100">
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
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50">
          <Legend />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FOCUS NEXT - Visually separated, large ranked cards */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {focusNext && focusNext.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
            Priority Actions
          </h3>
          <div className="space-y-3">
            {focusNext.map((item, idx) => (
              <FocusNextCard key={item.id} item={item} rank={idx + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
