// src/components/report/StrengthsBar.jsx

import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function StrengthsBar({ objectives }) {
  // Top 3 objectives with score >= 70%, sorted by score desc
  const strengths = objectives
    .filter(obj => obj.score >= 70)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Don't render if no strengths
  if (strengths.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded border border-slate-300">
      <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-emerald-500" />
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
          Strengths
        </h2>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-4">
          {strengths.map((obj) => (
            <div
              key={obj.id || obj.objective}
              className="bg-emerald-50 border border-emerald-200 rounded p-3 text-center"
            >
              <div className="text-sm font-semibold text-emerald-800">
                {obj.objective}
              </div>
              <div className="text-xs text-emerald-600 mt-1">
                {obj.score}% · {obj.theme}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
