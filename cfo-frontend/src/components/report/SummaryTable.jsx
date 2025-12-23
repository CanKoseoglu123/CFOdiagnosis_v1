// src/components/report/SummaryTable.jsx

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

function ScoreBar({ score, status }) {
  const colors = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-red-500'
  };

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[status]}`}
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
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
          Summary
        </h2>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase w-28">
              Theme
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">
              Objective
            </th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase w-24">
              Importance
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase w-40">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {THEMES.map((theme) => {
            const themeObjectives = objectives.filter(o => o.theme === theme);
            return themeObjectives.map((obj, idx) => (
              <tr
                key={obj.id || obj.objective}
                className="border-b border-slate-100 hover:bg-slate-50"
              >
                <td className="px-4 py-2 text-slate-600">
                  {idx === 0 && (
                    <span className="font-semibold text-slate-800">{theme}</span>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-700">
                  {obj.objective}
                </td>
                <td className="px-4 py-2 text-center">
                  <ImportanceBadge level={obj.importance || 3} locked={obj.locked} />
                </td>
                <td className="px-4 py-2">
                  <ScoreBar score={obj.score} status={obj.status} />
                </td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}
