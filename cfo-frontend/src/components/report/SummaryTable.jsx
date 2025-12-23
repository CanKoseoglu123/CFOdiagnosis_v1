// src/components/report/SummaryTable.jsx
// VS-22 v2: Theme as header rows, score bars (not dots)

import React from 'react';

const IMPORTANCE_LABELS = { 1: 'Min', 2: 'Low', 3: 'Med', 4: 'High', 5: 'Crit' };
const THEMES = ['Foundation', 'Future', 'Intelligence'];

function ImportanceBadge({ level, locked }) {
  const colors = {
    5: 'bg-red-100 text-red-700',
    4: 'bg-orange-100 text-orange-700',
    3: 'bg-slate-100 text-slate-600',
    2: 'bg-slate-100 text-slate-500',
    1: 'bg-slate-50 text-slate-400'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${colors[level]}`}>
      {locked && '🔒 '}
      {IMPORTANCE_LABELS[level]}
    </span>
  );
}

function ScoreBar({ score }) {
  // Color based on thresholds
  let barColor = 'bg-red-500';
  if (score >= 80) barColor = 'bg-emerald-500';
  else if (score >= 50) barColor = 'bg-amber-500';

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-medium text-slate-700 w-10">{score}%</span>
    </div>
  );
}

export default function SummaryTable({ objectives }) {
  return (
    <div className="bg-white rounded border border-slate-300">
      <div className="px-4 py-2 border-b border-slate-200 bg-slate-50">
        <h2 className="text-base font-bold text-slate-700 uppercase tracking-wide">
          Summary
        </h2>
      </div>

      <div className="divide-y divide-slate-200">
        {THEMES.map((theme) => {
          const themeObjectives = objectives.filter(o => o.theme === theme);

          if (themeObjectives.length === 0) return null;

          return (
            <div key={theme}>
              {/* Theme Header Row */}
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  {theme}
                </span>
              </div>

              {/* Objective Rows */}
              <table className="w-full">
                <tbody>
                  {themeObjectives.map((obj) => (
                    <tr
                      key={obj.id || obj.objective}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-2 text-sm text-slate-700 w-1/2">
                        {obj.objective}
                      </td>
                      <td className="px-4 py-2 text-center w-24">
                        <ImportanceBadge level={obj.importance || 3} locked={obj.locked} />
                      </td>
                      <td className="px-4 py-2 w-40">
                        <ScoreBar score={obj.score} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
