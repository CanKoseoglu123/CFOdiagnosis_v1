// Assessment Panel - Persona/industry distributions, completion metrics

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from './StatCard';

const COLORS = {
  primary: '#1a365d',
  accent: '#c9a050',
  slate: '#64748b',
};

function HorizontalBarList({ title, data, nameKey, countKey }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-sm p-4">
        <h3 className="font-medium text-slate-800 mb-3">{title}</h3>
        <p className="text-sm text-slate-500">No data for this period</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d[countKey] || 0), 1);

  return (
    <div className="bg-white border border-slate-200 rounded-sm p-4">
      <h3 className="font-medium text-slate-800 mb-3">{title}</h3>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item[nameKey]} className="flex items-center gap-3">
            <span className="w-32 text-sm text-slate-600 truncate shrink-0" title={item[nameKey]}>
              {item[nameKey]}
            </span>
            <div className="flex-1">
              <div
                className="h-5 bg-[#1a365d]/15 rounded-sm"
                style={{ width: `${Math.max(4, (item[countKey] / maxCount) * 100)}%` }}
              />
            </div>
            <span className="text-sm font-medium text-slate-800 w-8 text-right">{item[countKey]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AssessmentPanel({ data }) {
  if (!data) return null;

  const progressData = (data.progress_distribution || []).map(d => ({
    name: d.bucket,
    count: d.count,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Completion Rate"
          value={`${data.completion_rate || 0}%`}
          color={data.completion_rate >= 15 ? 'emerald' : 'amber'}
        />
        <StatCard
          label="Avg Completion Time"
          value={data.avg_completion_time_hours ? `${data.avg_completion_time_hours}h` : 'N/A'}
          color="blue"
        />
        <StatCard
          label="Total Assessed"
          value={(data.progress_distribution || []).reduce((sum, d) => sum + d.count, 0)}
        />
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HorizontalBarList
          title="Persona Distribution"
          data={data.persona_distribution}
          nameKey="persona"
          countKey="count"
        />
        <HorizontalBarList
          title="Industry Distribution"
          data={data.industry_distribution}
          nameKey="industry"
          countKey="count"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HorizontalBarList
          title="Revenue Range"
          data={data.revenue_distribution}
          nameKey="range"
          countKey="count"
        />

        {/* Progress Histogram */}
        <div className="bg-white border border-slate-200 rounded-sm p-4">
          <h3 className="font-medium text-slate-800 mb-3">Progress Distribution</h3>
          {progressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={progressData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '2px', fontSize: '12px' }} />
                <Bar dataKey="count" fill={COLORS.primary} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-500">No progress data</p>
          )}
        </div>
      </div>
    </div>
  );
}
