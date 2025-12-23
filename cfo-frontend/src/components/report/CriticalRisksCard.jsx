// src/components/report/CriticalRisksCard.jsx

import React, { useState } from 'react';
import { AlertTriangle, XCircle, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

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
              <div key={risk.id} className="border border-red-200 rounded bg-red-50">
                <button
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  className="w-full px-3 py-2 flex items-start gap-2 text-left hover:bg-red-100 transition-colors"
                >
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-red-800">
                      {risk.title}
                    </div>
                    <div className="text-xs text-red-600 mt-0.5">
                      → {risk.action}
                    </div>
                  </div>
                  {expandedIdx === idx
                    ? <ChevronUp className="w-4 h-4 text-red-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-red-400 flex-shrink-0" />
                  }
                </button>

                {expandedIdx === idx && (
                  <div className="px-3 pb-3 pt-2 border-t border-red-200 bg-white">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {risk.recommendation}
                    </p>
                    <p className="mt-2 text-xs text-red-600 font-semibold">
                      {risk.impact}
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
