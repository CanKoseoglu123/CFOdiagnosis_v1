// src/components/report/MatrixLegend.jsx
// VS-33: Priority Matrix - Legend for status colors and zones
// Colors aligned with ObjectivesPracticesOverview (navy blue theme)

import React from 'react';

export default function MatrixLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
      {/* Status Legend - Navy blue theme */}
      <div className="flex items-center gap-4">
        <span className="font-medium text-slate-700">Status:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#003366]" />
          <span>Proven</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#336699]" />
          <span>Partial</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#6699CC]" />
          <span>Gap</span>
        </div>
      </div>

      {/* Zone Legend - Stripe indicators */}
      <div className="border-l border-slate-300 pl-6 flex items-center gap-4">
        <span className="font-medium text-slate-700">Zones:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-3 bg-white border-l-4 border-red-500" />
          <span>Urgent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-3 bg-white border-l-4 border-blue-500" />
          <span>Vision</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-3 bg-white border-l-4 border-slate-400" />
          <span>Operational</span>
        </div>
      </div>
    </div>
  );
}
