// src/components/report/MaturityLadder.jsx
// Tabular maturity ladder (Levels 1-4 only, NO Level 0)

import { Check } from 'lucide-react';
import { getLevelName, LEVEL_THRESHOLDS } from '../../data/spec';

const LEVELS = [
  { level: 4, questions: 10 },
  { level: 3, questions: 15 },
  { level: 2, questions: 14 },
  { level: 1, questions: 9 }
];

export default function MaturityLadder({ actualLevel, potentialLevel, capped, levelProgress = {} }) {
  return (
    <div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
      {LEVELS.map((levelDef) => {
        const isCurrent = levelDef.level === actualLevel;
        const isNext = levelDef.level === actualLevel + 1;
        const isPassed = levelDef.level < actualLevel;
        const progress = levelProgress[levelDef.level];
        const levelName = getLevelName(levelDef.level);
        const threshold = LEVEL_THRESHOLDS[levelDef.level];

        return (
          <div
            key={levelDef.level}
            className={`
              flex items-center px-4 py-3 border-b border-slate-200 last:border-b-0
              ${isCurrent ? 'bg-primary/5 border-l-4 border-l-primary' : ''}
              ${isPassed ? 'bg-status-green-bg' : ''}
            `}
          >
            {/* Level number */}
            <div className={`
              w-8 h-8 rounded-sm flex items-center justify-center font-bold mr-4
              ${isCurrent
                ? 'bg-primary text-white'
                : isPassed
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }
            `}>
              {isPassed ? <Check className="w-4 h-4" /> : levelDef.level}
            </div>

            {/* Level info */}
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-navy uppercase tracking-wide">
                  {levelName}
                </span>
                <span className="text-xs text-slate-500">
                  {levelDef.questions} requirements · {threshold}%+
                </span>
              </div>

              {/* Progress for current level */}
              {isCurrent && progress && (
                <div className="text-xs text-primary mt-0.5">
                  {progress.passed}/{progress.total} ({Math.round(progress.passed / progress.total * 100)}%)
                </div>
              )}

              {/* Progress for passed levels */}
              {isPassed && progress && (
                <div className="text-xs text-green-700 mt-0.5">
                  {progress.passed}/{progress.total} (100%)
                </div>
              )}
            </div>

            {/* Status badge */}
            <div>
              {isCurrent && (
                <span className="px-2 py-1 bg-primary text-white text-[10px] font-semibold uppercase tracking-wider rounded-sm">
                  Current
                </span>
              )}
              {isNext && (
                <span className="px-2 py-1 bg-slate-200 text-slate-600 text-[10px] font-semibold uppercase tracking-wider rounded-sm">
                  Next
                </span>
              )}
              {isPassed && (
                <span className="px-2 py-1 bg-green-600 text-white text-[10px] font-semibold uppercase tracking-wider rounded-sm">
                  ✓ Passed
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
