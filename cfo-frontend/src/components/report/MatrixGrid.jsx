// src/components/report/MatrixGrid.jsx
// VS-33: Priority Matrix - 2x3 grid with zone backgrounds

import React from 'react';
import PracticeCard from './PracticeCard';
import { getZoneBackground } from '../../utils/matrixUtils';

const MAX_VISIBLE = 8;

const ROWS = [
  { id: 'strategic', label: 'Strategic Focus', sublabel: 'Importance 4-5' },
  { id: 'operational', label: 'Operational', sublabel: 'Importance 1-3' },
];

function MatrixCell({ practices, background }) {
  const visible = practices.slice(0, MAX_VISIBLE);
  const overflow = practices.length - MAX_VISIBLE;

  return (
    <div className={`p-3 border-l border-slate-200 min-h-[100px] ${background}`}>
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
  );
}

export default function MatrixGrid({ columns, gridData }) {
  return (
    <div className="border border-slate-200 rounded overflow-hidden">
      {/* Column Headers */}
      <div className="grid grid-cols-[120px_1fr_1fr_1fr] border-b border-slate-200">
        {/* Empty corner */}
        <div className="p-2 bg-slate-100" />
        {columns.map(col => (
          <div
            key={col.id}
            className="p-2 bg-slate-100 border-l border-slate-200 text-center"
          >
            <div className="text-xs font-semibold text-slate-700">{col.label}</div>
            <div className="text-[10px] text-slate-500">{col.sublabel}</div>
          </div>
        ))}
      </div>

      {/* Rows */}
      {ROWS.map(row => (
        <div
          key={row.id}
          className="grid grid-cols-[120px_1fr_1fr_1fr] border-b border-slate-200 last:border-b-0"
        >
          {/* Row Label */}
          <div className="p-2 bg-slate-100 border-r border-slate-200 flex flex-col justify-center">
            <div className="text-xs font-semibold text-slate-700">{row.label}</div>
            <div className="text-[10px] text-slate-500">{row.sublabel}</div>
          </div>

          {/* Cells */}
          {columns.map((col, colIndex) => (
            <MatrixCell
              key={col.id}
              practices={gridData[row.id]?.[col.id] || []}
              background={getZoneBackground(row.id, colIndex)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
