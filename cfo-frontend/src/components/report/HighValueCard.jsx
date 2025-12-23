// src/components/report/HighValueCard.jsx
// VS-22 v3: Bolder initiative titles with better visual hierarchy

import React from 'react';
import { TrendingUp, Zap } from 'lucide-react';

export default function HighValueCard({ initiatives }) {
  // Take top 2 by score
  const topTwo = [...initiatives]
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, 2);

  function getInitiativeLabel(init) {
    const criticalActions = (init.actions || []).filter(a => a.is_critical);
    if (criticalActions.length > 0) {
      const maxLevel = Math.max(...criticalActions.map(a => a.maturity_level || 2));
      return { text: `Unlocks Level ${maxLevel + 1}`, type: 'unlock' };
    }
    return { text: 'High Impact', type: 'impact' };
  }

  function getCriticalCount(init) {
    return (init.actions || []).filter(a => a.is_critical).length;
  }

  return (
    <div className="bg-white rounded border border-slate-300 h-full">
      <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-500" />
        <h2 className="text-base font-bold text-slate-700 uppercase">
          High Value Opportunities
        </h2>
      </div>

      <div className="p-3 space-y-3">
        {topTwo.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <p className="text-sm font-medium">No opportunities identified</p>
          </div>
        ) : (
          topTwo.map((init) => {
            const label = getInitiativeLabel(init);
            const criticalCount = getCriticalCount(init);
            const actionCount = (init.actions || []).length;

            return (
              <div key={init.id} className="border border-emerald-200 rounded overflow-hidden">
                {/* Initiative Header - BOLD */}
                <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {/* INITIATIVE TITLE - Prominent */}
                      <h3 className="text-base font-bold text-slate-800">
                        {init.title}
                      </h3>
                      <div className="text-xs text-slate-500 mt-1">
                        {criticalCount > 0
                          ? `${criticalCount} critical · ${actionCount} total actions`
                          : `${actionCount} actions`
                        }
                      </div>
                    </div>
                    {/* Unlock/Impact Badge */}
                    <span className={`text-xs px-2 py-1 rounded font-bold whitespace-nowrap ${
                      label.type === 'unlock'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {label.text}
                    </span>
                  </div>
                </div>

                {/* Actions - Clear hierarchy */}
                <div className="px-4 py-3 space-y-2">
                  {(init.actions || []).slice(0, 3).map((action, aIdx) => (
                    <div key={aIdx} className="flex items-center gap-2">
                      <Zap className={`w-4 h-4 flex-shrink-0 ${
                        action.is_critical ? 'text-red-500' : 'text-slate-400'
                      }`} />
                      <span className={`text-sm flex-1 ${
                        action.is_critical ? 'font-semibold text-slate-800' : 'text-slate-600'
                      }`}>
                        {action.title}
                      </span>
                      {action.is_critical && (
                        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">
                          Critical
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
