// src/components/report/CappedWarning.jsx
// Yellow alert banner when maturity is capped

import { AlertCircle, X, CheckCircle } from 'lucide-react';
import { getQuestionTitle, getLevelName, LEVEL_THRESHOLDS } from '../../data/spec';

export function CappedWarning({ score, actualLevel, potentialLevel, cappedBy }) {
  // Hydrate IDs to titles
  const cappedByTitles = cappedBy?.map(id => getQuestionTitle(id)) || [];

  return (
    <div className="bg-status-yellow-bg border border-status-yellow-border rounded-sm p-4 mt-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-status-yellow-text flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-bold text-navy">Maturity Capped</h4>
          <p className="text-sm text-slate mt-1">
            Score ({score}%) qualifies for{' '}
            <strong className="text-navy">Level {potentialLevel} ({getLevelName(potentialLevel)})</strong>,
            capped at <strong className="text-navy">Level {actualLevel}</strong>:
          </p>

          {/* Blocking items - HUMAN READABLE, NOT IDs */}
          <ul className="mt-2 space-y-1">
            {cappedByTitles.map((title, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-slate">
                <X className="w-3 h-3 text-red-600 flex-shrink-0" />
                <span>{title}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function OnTrackBanner({ actualLevel }) {
  const nextThreshold = LEVEL_THRESHOLDS[actualLevel + 1];

  return (
    <div className="bg-status-green-bg border border-status-green-border rounded-sm p-4 mt-4">
      <div className="flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-status-green-text" />
        <div>
          <span className="text-sm font-bold text-navy">On Track</span>
          <span className="text-sm text-slate ml-2">
            Execution matches maturity.
            {actualLevel < 4 && nextThreshold && (
              <> Reach {nextThreshold}% for Level {actualLevel + 1}.</>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
