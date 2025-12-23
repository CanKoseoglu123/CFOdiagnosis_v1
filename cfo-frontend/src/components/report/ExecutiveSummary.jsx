// src/components/report/ExecutiveSummary.jsx
// VS-22 v3: Standalone 3-column executive summary

import React from 'react';

export default function ExecutiveSummary({
  execution_score,
  actual_level,
  level_name,
  questions_total,
  questions_answered,
  critical_count,
  failed_critical_count
}) {
  return (
    <div className="bg-white rounded border border-slate-300">
      <div className="px-4 py-2 border-b border-slate-200 bg-slate-50">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
          Executive Summary
        </h2>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Execution Score */}
          <div className="border border-slate-200 rounded p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Execution Score
            </div>
            <div className="text-5xl font-bold text-slate-800 mb-3">
              {execution_score}
            </div>
            {/* Progress bar with threshold markers */}
            <div className="relative">
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    execution_score >= 80 ? 'bg-emerald-500' :
                    execution_score >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${execution_score}%` }}
                />
              </div>
              {/* Threshold markers */}
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0%</span>
                <span className="absolute left-1/2 -translate-x-1/2">|50%</span>
                <span className="absolute left-[80%] -translate-x-1/2">|80%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Maturity Level */}
          <div className="border border-slate-200 rounded p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Maturity Level
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-5xl font-bold text-blue-600">L{actual_level}</span>
              <span className="text-xl text-slate-600">{level_name}</span>
            </div>
            {/* Level indicator */}
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={`h-2 flex-1 rounded ${
                    level <= actual_level ? 'bg-blue-500' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Level {actual_level} of 4
            </div>
          </div>

          {/* Assessment Stats */}
          <div className="border border-slate-200 rounded p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Assessment
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Questions</span>
                <span className="text-sm font-semibold text-slate-800">{questions_total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Answered</span>
                <span className="text-sm font-semibold text-slate-800">{questions_answered}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Critical</span>
                <span className="text-sm font-semibold text-slate-800">{critical_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Failed Critical</span>
                <span className={`text-sm font-semibold ${failed_critical_count > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {failed_critical_count}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
