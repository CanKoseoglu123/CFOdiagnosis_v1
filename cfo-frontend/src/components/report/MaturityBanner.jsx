// src/components/report/MaturityBanner.jsx

import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const THRESHOLDS = { 2: 50, 3: 80, 4: 95 };

export default function MaturityBanner({
  execution_score,
  potential_level,
  actual_level,
  capped_by = []
}) {
  const isCapped = actual_level < potential_level;

  if (isCapped) {
    // CAPPED STATE
    const blockerCount = capped_by.length;
    const nextLevel = actual_level + 1;

    return (
      <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-semibold text-amber-800">Capped</span>
          <span className="text-amber-700 ml-1">
            Your execution ({execution_score}%) qualifies for Level {potential_level},
            but critical gaps block advancement. Address {blockerCount} blocker{blockerCount > 1 ? 's' : ''} to unlock Level {nextLevel}.
          </span>
        </div>
      </div>
    );
  } else {
    // ON TRACK STATE
    const nextLevel = actual_level + 1;
    const nextThreshold = THRESHOLDS[nextLevel] || 100;

    // Already at Level 4
    if (actual_level >= 4) {
      return (
        <div className="bg-emerald-50 border border-emerald-200 rounded px-3 py-2 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold text-emerald-800">Optimized</span>
            <span className="text-emerald-700 ml-1">
              Congratulations! You've achieved the highest maturity level.
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded px-3 py-2 flex items-start gap-2">
        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-semibold text-emerald-800">On Track</span>
          <span className="text-emerald-700 ml-1">
            Execution matches maturity. Reach {nextThreshold}% for Level {nextLevel}.
          </span>
        </div>
      </div>
    );
  }
}
