// Funnel Panel - Diagnostic journey drop-off visualization

import React from 'react';
import { ArrowRight } from 'lucide-react';
import StatCard from './StatCard';

const STEP_LABELS = {
  intro: 'Intro',
  company_setup: 'Company',
  persona: 'Persona',
  pillar_setup: 'Pillar',
  assessment: 'Assessment',
  calibration: 'Calibration',
  report: 'Report',
  finalized: 'Finalized',
};

export default function FunnelPanel({ data }) {
  if (!data) return null;

  const steps = data.steps || [];
  const maxCount = steps.length > 0 ? steps[0].count : 1;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Completion Rate"
          value={`${data.completion_rate || 0}%`}
          color={data.completion_rate >= 20 ? 'emerald' : 'amber'}
        />
        <StatCard
          label="Avg Time to Complete"
          value={data.avg_time_to_complete ? `${data.avg_time_to_complete}h` : 'N/A'}
          color="blue"
        />
        <StatCard
          label="Total Runs"
          value={steps.length > 0 ? steps[0].count : 0}
        />
      </div>

      {/* Funnel Bars */}
      <div className="bg-white border border-slate-200 rounded-sm p-4">
        <h3 className="font-medium text-slate-800 mb-4">Diagnostic Journey Funnel</h3>
        <div className="space-y-2">
          {steps.map((step, index) => {
            const widthPct = maxCount > 0 ? Math.max(2, (step.count / maxCount) * 100) : 2;
            const isDropoff = step.conversion_pct !== null && step.conversion_pct < 75;

            return (
              <div key={step.name} className="flex items-center gap-3">
                <div className="w-24 text-sm text-slate-600 text-right shrink-0">
                  {STEP_LABELS[step.name] || step.name}
                </div>
                <div className="flex-1 relative">
                  <div
                    className={`h-8 rounded-sm flex items-center px-3 transition-all ${
                      isDropoff ? 'bg-red-100 border border-red-200' : 'bg-[#1a365d]/10 border border-[#1a365d]/20'
                    }`}
                    style={{ width: `${widthPct}%`, minWidth: '60px' }}
                  >
                    <span className="text-xs font-medium text-slate-800">{step.count}</span>
                  </div>
                </div>
                <div className="w-16 text-right shrink-0">
                  {step.conversion_pct !== null ? (
                    <span className={`text-xs font-medium ${isDropoff ? 'text-red-600' : 'text-slate-600'}`}>
                      {step.conversion_pct}%
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-[#1a365d]/10 border border-[#1a365d]/20" /> Normal
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-200" /> Drop-off (&lt;75%)
          </span>
          <span className="ml-auto">Conversion % = step count / previous step count</span>
        </div>
      </div>
    </div>
  );
}
