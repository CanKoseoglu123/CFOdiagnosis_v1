// src/components/report/SummaryTable.jsx
// VS-22 v2: Theme as header rows, score bars (not dots)
// VS-32: Replaced color badges with importance dots

import React from 'react';

const THEMES = ['Foundation', 'Future', 'Intelligence'];

// Importance dots visualization (●●●○○)
function ImportanceDots({ level, locked }) {
  return (
    <span className="inline-flex items-center gap-1">
      {locked && <span className="text-xs mr-1">🔒</span>}
      <span className="inline-flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full ${
              i <= level ? 'bg-slate-700' : 'bg-slate-200'
            }`}
          />
        ))}
      </span>
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
                        <ImportanceDots level={obj.importance || 3} locked={obj.locked} />
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
