// src/components/report/SummaryTable.jsx
// VS-33: Updated to match Executive Report objective table style
// Shows current state only (no forward-looking elements like actions/journey)

import React from 'react';

const THEMES = ['Foundation', 'Future', 'Intelligence'];

// Importance dots visualization (matching Executive Report)
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

// Score bar with color coding (matching Executive Report)
function ScoreBar({ score }) {
  let barColor = 'bg-red-500';
  if (score >= 80) barColor = 'bg-emerald-500';
  else if (score >= 50) barColor = 'bg-amber-500';

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-sm font-semibold ${
        score >= 80 ? 'text-emerald-600' : score < 40 ? 'text-red-600' : 'text-slate-700'
      }`}>
        {score}%
      </span>
    </div>
  );
}

// Level badge (matching Executive Report style)
function LevelBadge({ score }) {
  // Calculate level from score: <40=L1, 40-64=L2, 65-84=L3, 85+=L4
  let level = 1;
  if (score >= 85) level = 4;
  else if (score >= 65) level = 3;
  else if (score >= 40) level = 2;

  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
      level >= 3 ? 'bg-emerald-100 text-emerald-700' :
      level >= 2 ? 'bg-amber-100 text-amber-700' :
      'bg-slate-100 text-slate-600'
    }`}>
      L{level}
    </span>
  );
}

// Status badge (matching Executive Report)
function StatusBadge({ score }) {
  let status = 'opportunity';
  if (score >= 80) status = 'strength';
  else if (score < 40) status = 'critical';

  const styles = {
    strength: 'text-emerald-700',
    opportunity: 'text-amber-700',
    critical: 'text-red-700 font-semibold'
  };
  const labels = {
    strength: 'Strength',
    opportunity: 'Opportunity',
    critical: 'Critical'
  };

  return (
    <span className={`text-xs ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function SummaryTable({ objectives }) {
  return (
    <div className="bg-white rounded border border-slate-300">
      {/* Table with headers */}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-300">
            <th className="text-left px-4 py-2 font-semibold text-slate-700">Objective</th>
            <th className="text-center px-3 py-2 font-semibold text-slate-700 w-20">Importance</th>
            <th className="text-center px-3 py-2 font-semibold text-slate-700 w-32">Score</th>
            <th className="text-center px-3 py-2 font-semibold text-slate-700 w-16">Level</th>
            <th className="text-center px-3 py-2 font-semibold text-slate-700 w-24">Status</th>
          </tr>
        </thead>
        <tbody>
          {THEMES.map((theme) => {
            const themeObjectives = objectives.filter(o => o.theme === theme);

            if (themeObjectives.length === 0) return null;

            return (
              <React.Fragment key={theme}>
                {/* Theme Header Row */}
                <tr className="bg-slate-50">
                  <td colSpan={5} className="px-4 py-1.5 text-xs font-bold text-slate-600 uppercase tracking-wide">
                    {theme}
                  </td>
                </tr>

                {/* Objective Rows */}
                {themeObjectives.map((obj) => (
                  <tr
                    key={obj.id || obj.objective}
                    className={`border-b border-slate-200 last:border-b-0 hover:bg-slate-50 ${
                      obj.score < 40 ? 'border-l-2 border-l-red-500' : ''
                    }`}
                  >
                    <td className="px-4 py-2 text-slate-700">
                      {obj.objective}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <ImportanceDots level={obj.importance || 3} locked={obj.locked} />
                    </td>
                    <td className="px-3 py-2">
                      <ScoreBar score={obj.score} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <LevelBadge score={obj.score} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <StatusBadge score={obj.score} />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
