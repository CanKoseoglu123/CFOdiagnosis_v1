// src/components/report/HighValueCard.jsx
// VS-22 v2: Shows "Unlocks Level X" instead of "pts"

import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function HighValueCard({ initiatives, criticalRisks = [] }) {
  // Take top 2 by score
  const topTwo = [...initiatives]
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, 2);

  // Determine label for each initiative
  function getInitiativeLabel(init) {
    // Check if any action in this initiative is a critical blocker
    const criticalActions = (init.actions || []).filter(a => a.is_critical);

    if (criticalActions.length > 0) {
      // Find highest level blocked (L1 criticals → unlocks L2, L2 criticals → unlocks L3)
      const maxLevel = Math.max(...criticalActions.map(a => a.maturity_level || 2));
      return `Unlocks Level ${maxLevel + 1}`;
    }

    return 'High Impact';
  }

  // Count critical actions
  function getCriticalCount(init) {
    return (init.actions || []).filter(a => a.is_critical).length;
  }

  return (
    <div className="bg-white rounded border border-slate-300 h-full">
      <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-500" />
        <h2 className="text-sm font-bold text-slate-700 uppercase">
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
              <div key={init.id} className="border border-slate-200 rounded">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">
                      {init.title}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      label.includes('Unlocks')
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {label}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {criticalCount > 0
                      ? `${criticalCount} critical action${criticalCount > 1 ? 's' : ''} · ${actionCount} total`
                      : `${actionCount} action${actionCount > 1 ? 's' : ''}`
                    }
                  </div>
                </div>
                <div className="px-3 py-2 space-y-1">
                  {(init.actions || []).slice(0, 2).map((action, aIdx) => (
                    <div key={aIdx} className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400">→</span>
                      <span className="text-slate-700 flex-1">{action.title}</span>
                      {action.is_critical && (
                        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
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
