// src/components/report/CriticalRisksCard.jsx
// VS-22 v3: Shows gap titles (expert_action.title), not question text

import React, { useState } from 'react';
import { AlertTriangle, XCircle, ChevronDown, ChevronUp, CheckCircle, Unlock } from 'lucide-react';

export default function CriticalRisksCard({ risks }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  return (
    <div className="bg-white rounded border border-slate-300 h-full">
      <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <h2 className="text-sm font-bold text-slate-700 uppercase">
          Critical Risks
        </h2>
        {risks.length > 0 && (
          <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
            {risks.length}
          </span>
        )}
      </div>

      <div className="p-3">
        {risks.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-sm font-medium">No critical risks</p>
            <p className="text-xs text-slate-400 mt-1">All critical items passed</p>
          </div>
        ) : (
          <div className="space-y-2">
            {risks.map((risk, idx) => (
              <div key={risk.id} className="border border-red-200 rounded bg-red-50 overflow-hidden">
                <button
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  className="w-full px-3 py-3 flex items-start gap-3 text-left hover:bg-red-100 transition-colors"
                >
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {/* GAP TITLE - Bold, actionable */}
                    <div className="text-sm font-bold text-red-800">
                      {risk.title}
                    </div>
                    {/* Unlock badge inline */}
                    <div className="flex items-center gap-2 mt-1">
                      <Unlock className="w-3 h-3 text-red-600" />
                      <span className="text-xs font-semibold text-red-600">
                        {risk.unlocks}
                      </span>
                    </div>
                  </div>
                  {expandedIdx === idx
                    ? <ChevronUp className="w-4 h-4 text-red-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-red-400 flex-shrink-0" />
                  }
                </button>

                {expandedIdx === idx && (
                  <div className="px-3 pb-3 pt-2 border-t border-red-200 bg-white">
                    <div className="text-xs font-semibold text-slate-700 mb-1">Recommendation:</div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {risk.recommendation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
