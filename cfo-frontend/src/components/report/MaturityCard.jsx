// src/components/report/MaturityCard.jsx
// Executive summary maturity level display

import { getLevelName } from '../../data/spec';

export default function MaturityCard({ actualLevel, potentialLevel, capped }) {
  const levelName = getLevelName(actualLevel);

  return (
    <div className="bg-white border border-slate-300 rounded-sm p-4">
      {/* Header */}
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
        MATURITY LEVEL
      </div>

      {/* Level display */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-4xl font-bold text-primary">L{actualLevel}</span>
        <span className="text-lg font-semibold text-navy">{levelName}</span>
      </div>

      <div className="text-xs text-slate-500 mb-3">
        Level {actualLevel} of 4
        {capped && (
          <span className="text-yellow-600 ml-2">(Potential: L{potentialLevel})</span>
        )}
      </div>

      {/* Level indicator bars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(level => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-sm ${
              level <= actualLevel ? 'bg-primary' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
