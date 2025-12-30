// src/components/report/MatrixGrid.jsx
// VS-33: Priority Matrix - 2x3 grid with zone backgrounds
// Updated: Larger titles, zone labels in top-right, more visible zone colors

import React from 'react';
import PracticeCard from './PracticeCard';

const ROWS = [
  { id: 'strategic', label: 'High', sublabel: '(4-5)' },
  { id: 'operational', label: 'Low-Medium', sublabel: '(1-3)' },
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

// Zone background colors - warm tones that work with navy blue cards
function getZoneBackground(row, colIndex) {
  if (row === 'strategic') {
    // High priority: Urgent (amber-50 toned down) vs Vision (green-50 warm)
    return colIndex < 2 ? 'bg-amber-50' : 'bg-green-50';
  }
  // Low priority: Clean white
  return 'bg-white';
}

function MatrixCell({ practices, rowId, colId, colIndex }) {
  const background = getZoneBackground(rowId, colIndex);
  const zoneName = ZONE_NAMES[rowId]?.[colId] || '';

  return (
    <div className={`p-3 min-h-[120px] ${background} border-l border-slate-300 relative`}>
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
    <div className="rounded overflow-hidden">
      <div className="flex">
        {/* Left Axis Super-Column: PRIORITY LEVEL */}
        <div className="flex flex-col w-[40px]">
          {/* Empty corner (intersection) - no outer borders, only right+bottom */}
          <div className="p-2 bg-white border-r border-b border-slate-300">
            {/* Match height of MATURITY LEVEL row */}
            <span className="text-[11px] invisible">X</span>
          </div>
          {/* Spacer for column headers row */}
          <div className="p-3 bg-white border-r border-b border-slate-300">
            {/* Match height of column headers */}
            <div className="text-sm invisible">X</div>
            <div className="text-xs mt-0.5 invisible">X</div>
          </div>
          {/* PRIORITY LEVEL vertical text - aligned with High row top */}
          <div className="flex-1 bg-slate-200 border-r border-slate-300 flex items-center justify-center">
            <span
              className="text-[11px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap"
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
              }}
            >
              Priority Level
            </span>
          </div>
        </div>

        {/* Main Grid Area */}
        <div className="flex-1 border border-slate-300 border-l-0">
          {/* Top Axis Super-Header: MATURITY LEVEL */}
          <div className="grid grid-cols-[60px_1fr_1fr_1fr] border-b border-slate-300">
            {/* Empty space above row labels */}
            <div className="p-2 bg-white border-r border-slate-300" />
            {/* MATURITY LEVEL spanning 3 columns - darker bg */}
            <div className="col-span-3 p-2 bg-slate-200 text-center">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Maturity Level
              </span>
            </div>
          </div>

          {/* Column Headers - lighter bg */}
          <div className="grid grid-cols-[60px_1fr_1fr_1fr] border-b border-slate-300">
            {/* Empty corner for row labels */}
            <div className="p-3 bg-slate-100 border-r border-slate-300" />
            {columns.map(col => (
              <div
                key={col.id}
                className="p-3 bg-slate-100 border-l border-slate-300 text-center"
              >
                <div className="text-sm font-bold text-slate-700">{col.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{col.sublabel}</div>
              </div>
            ))}
          </div>

          {/* Data Rows */}
          {ROWS.map(row => (
            <div
              key={row.id}
              className="grid grid-cols-[60px_1fr_1fr_1fr] border-b border-slate-300 last:border-b-0"
            >
              {/* Row Label - Vertical text - lighter bg */}
              <div className="bg-slate-100 border-r border-slate-300 flex items-center justify-center">
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
      </div>
    </div>
  );
}
