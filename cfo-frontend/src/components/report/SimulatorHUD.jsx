// src/components/report/SimulatorHUD.jsx
// VS-28: Simulator Header - Execution gauge (left) + Radar chart (right)

import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';

// Objective short names for radar chart
const OBJECTIVE_SHORT_NAMES = {
  'obj_budget_discipline': 'Budget',
  'obj_financial_controls': 'Controls',
  'obj_performance_monitoring': 'Monitoring',
  'obj_forecasting_agility': 'Forecasting',
  'obj_driver_based_planning': 'Driver-Based',
  'obj_scenario_modeling': 'Scenarios',
  'obj_strategic_influence': 'Strategy',
  'obj_decision_support': 'Decisions',
  'obj_operational_excellence': 'Operations'
};

export default function SimulatorHUD({
  executionScore,
  projectedScore,
  objectives,
  projectedByTimeline,
  actionCounts,
  gapsTotal,
  saving
}) {
  // Build radar chart data
  const radarData = objectives.map(obj => ({
    subject: OBJECTIVE_SHORT_NAMES[obj.id] || obj.name || obj.id,
    Current: projectedByTimeline.current[obj.id] || 0,
    '6 Months': projectedByTimeline['6m'][obj.id] || 0,
    '12 Months': projectedByTimeline['12m'][obj.id] || 0,
    'Full Plan': projectedByTimeline['24m'][obj.id] || 0
  }));

  // Calculate improvement
  const improvement = projectedScore - executionScore;

  return (
    <div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-700 uppercase tracking-wide">
          Simulator
        </h2>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>{actionCounts.total} actions planned</span>
          <span className="text-slate-300">|</span>
          <span>{gapsTotal} gaps identified</span>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Execution Score Gauge (Left) */}
          <div className="border border-slate-200 rounded p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Execution Score
            </div>

            {/* Current Score */}
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-bold text-slate-800">{executionScore}%</span>
              {improvement > 0 && (
                <span className="text-lg font-semibold text-emerald-600">
                  → {projectedScore}%
                </span>
              )}
            </div>

            {/* Improvement badge */}
            {improvement > 0 && (
              <div className="mb-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                  +{improvement} points if completed
                </span>
              </div>
            )}

            {/* Progress bar */}
            <div className="relative">
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                {/* Current score fill */}
                <div
                  className="h-full bg-slate-600 absolute left-0 top-0"
                  style={{ width: `${executionScore}%` }}
                />
                {/* Projected score fill (overlay) */}
                {improvement > 0 && (
                  <div
                    className="h-full bg-emerald-400 absolute top-0 opacity-60"
                    style={{
                      left: `${executionScore}%`,
                      width: `${improvement}%`
                    }}
                  />
                )}
              </div>
              {/* Markers */}
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Radar Chart (Right - spans 2 columns) */}
          <div className="col-span-2 border border-slate-200 rounded p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Projected Improvement by Objective
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: '#94a3b8', fontSize: 9 }}
                    tickCount={5}
                  />

                  {/* Current score - solid dark line */}
                  <Radar
                    name="Current"
                    dataKey="Current"
                    stroke="#1e293b"
                    fill="#1e293b"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />

                  {/* 6 months - light blue dashed */}
                  <Radar
                    name="6 Months"
                    dataKey="6 Months"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.05}
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />

                  {/* 12 months - medium blue dashed */}
                  <Radar
                    name="12 Months"
                    dataKey="12 Months"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.05}
                    strokeWidth={1.5}
                    strokeDasharray="6 3"
                  />

                  {/* Full plan - green */}
                  <Radar
                    name="Full Plan"
                    dataKey="Full Plan"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`${value}%`]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px' }}
                    iconSize={10}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Timeline Summary Row */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="grid grid-cols-4 gap-3">
            <TimelineCard
              label="6 Months"
              count={actionCounts['6m']}
              color="bg-blue-500"
            />
            <TimelineCard
              label="12 Months"
              count={actionCounts['12m']}
              color="bg-blue-600"
            />
            <TimelineCard
              label="24 Months"
              count={actionCounts['24m']}
              color="bg-blue-700"
            />
            <TimelineCard
              label="Unassigned"
              count={actionCounts.unassigned}
              color="bg-slate-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Timeline summary card
function TimelineCard({ label, count, color }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200">
      <div className={`w-3 h-3 rounded-sm ${color}`} />
      <div className="flex-1">
        <div className="text-xs text-slate-500">{label}</div>
      </div>
      <div className="text-lg font-bold text-slate-700">{count}</div>
    </div>
  );
}
