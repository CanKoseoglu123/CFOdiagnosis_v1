// src/components/report/MatrixGrid.jsx
// VS-33: Priority Matrix - 2x3 grid with zone backgrounds
// Updated: Larger titles, zone labels in top-right, more visible zone colors

import React from 'react';
import PracticeCard from './PracticeCard';

const ROWS = [
  { id: 'strategic', label: 'High Priority', sublabel: '(4-5)' },
  { id: 'operational', label: 'Low-Medium Priority', sublabel: '(1-3)' },
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
  const background = getZoneBackground(rowId, colIndex);
  const zoneName = ZONE_NAMES[rowId]?.[colId] || '';

  return (
    <div className={`p-3 border-l border-slate-300 min-h-[120px] ${background} relative`}>
      {/* Zone label in top right */}
      <span className="absolute top-1 right-2 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
        {zoneName}
      </span>

      {/* Practices - show all, auto-expand */}
      <div className="mt-4">
        {practices.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {practices.map(practice => (
              <PracticeCard key={practice.id} practice={practice} />
            ))}
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
      <div className="grid grid-cols-[60px_1fr_1fr_1fr] border-b border-slate-300">
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
          className="grid grid-cols-[60px_1fr_1fr_1fr] border-b border-slate-300 last:border-b-0"
        >
          {/* Row Label - Vertical text, bottom to top */}
          <div className="bg-slate-200 border-r border-slate-300 flex items-center justify-center">
            <div
              className="text-sm font-bold text-slate-700 whitespace-nowrap"
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
              }}
            >
              {row.label} <span className="text-xs font-normal text-slate-500">{row.sublabel}</span>
            </div>
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
