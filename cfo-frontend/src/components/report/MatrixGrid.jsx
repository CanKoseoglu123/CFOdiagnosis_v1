// src/components/report/MatrixGrid.jsx
// VS-33: Priority Matrix - 2x3 grid with zone backgrounds
// Updated: Larger titles, zone labels in top-right, more visible zone colors

import React from 'react';
import PracticeCard from './PracticeCard';

const MAX_VISIBLE = 8;

const ROWS = [
  { id: 'strategic', label: 'Strategic Focus', sublabel: 'Importance 4-5' },
  { id: 'operational', label: 'Operational', sublabel: 'Importance 1-3' },
];

// Zone names for each cell position
const ZONE_NAMES = {
  strategic: {
    col1: 'Urgent',
    col2: 'Urgent',
    col3: 'Vision'
  },
  operational: {
    col1: 'Operational',
    col2: 'Operational',
    col3: 'Operational'
  }
};

// More visible zone backgrounds
function getZoneBackground(row, colIndex) {
  if (row === 'strategic') {
    // Top row: Zone A (cols 0-1) red tint, Zone B (col 2) blue tint
    return colIndex < 2 ? 'bg-red-100' : 'bg-blue-100';
  }
  // Bottom row: Zone C slate tint
  return 'bg-slate-100';
}

function MatrixCell({ practices, rowId, colId, colIndex }) {
  const visible = practices.slice(0, MAX_VISIBLE);
  const overflow = practices.length - MAX_VISIBLE;
  const background = getZoneBackground(rowId, colIndex);
  const zoneName = ZONE_NAMES[rowId]?.[colId] || '';

  return (
    <div className={`p-3 border-l border-slate-300 min-h-[120px] ${background} relative`}>
      {/* Zone label in top right */}
      <span className="absolute top-1 right-2 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
        {zoneName}
      </span>

      {/* Practices */}
      <div className="mt-4">
        {practices.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {visible.map(practice => (
              <PracticeCard key={practice.id} practice={practice} />
            ))}
            {overflow > 0 && (
              <span className="text-xs text-slate-500 self-center px-1">
                +{overflow} more
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">No practices</span>
        )}
      </div>
    </div>
  );
}

export default function MatrixGrid({ columns, gridData }) {
  return (
    <div className="border border-slate-300 rounded overflow-hidden">
      {/* Column Headers */}
      <div className="grid grid-cols-[140px_1fr_1fr_1fr] border-b border-slate-300">
        {/* Empty corner */}
        <div className="p-3 bg-slate-200" />
        {columns.map(col => (
          <div
            key={col.id}
            className="p-3 bg-slate-200 border-l border-slate-300 text-center"
          >
            <div className="text-sm font-bold text-slate-700">{col.label}</div>
            <div className="text-xs text-slate-500 mt-0.5">{col.sublabel}</div>
          </div>
        ))}
      </div>

      {/* Rows */}
      {ROWS.map(row => (
        <div
          key={row.id}
          className="grid grid-cols-[140px_1fr_1fr_1fr] border-b border-slate-300 last:border-b-0"
        >
          {/* Row Label */}
          <div className="p-3 bg-slate-200 border-r border-slate-300 flex flex-col justify-center">
            <div className="text-sm font-bold text-slate-700">{row.label}</div>
            <div className="text-xs text-slate-500 mt-0.5">{row.sublabel}</div>
          </div>

          {/* Cells */}
          {columns.map((col, colIndex) => (
            <MatrixCell
              key={col.id}
              practices={gridData[row.id]?.[col.id] || []}
              rowId={row.id}
              colId={col.id}
              colIndex={colIndex}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
