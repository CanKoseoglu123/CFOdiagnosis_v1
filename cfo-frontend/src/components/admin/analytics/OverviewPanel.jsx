// Overview Panel - KPIs, visitor trend, devices, referrers

import React from 'react';
import { Users, Eye, Monitor, Smartphone, Tablet } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from './StatCard';

const COLORS = ['#1a365d', '#c9a050', '#64748b', '#94a3b8'];

function DevicePieChart({ devices }) {
  if (!devices) return null;
  const data = [
    { name: 'Desktop', value: devices.desktop || 0 },
    { name: 'Mobile', value: devices.mobile || 0 },
    { name: 'Tablet', value: devices.tablet || 0 },
  ].filter(d => d.value > 0);

  if (data.length === 0) return <p className="text-sm text-slate-500">No device data</p>;

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={120} height={120}>
        <PieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%" outerRadius={50} strokeWidth={1} stroke="#e2e8f0">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-slate-600">{d.name}</span>
            <span className="font-medium text-slate-800">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OverviewPanel({ data }) {
  if (!data) return null;

  const periodChange = data.previous_period > 0
    ? Math.round(((data.period - data.previous_period) / data.previous_period) * 100)
    : null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Visitors (all time)" value={data.total_visitors || 0} icon={Users} />
        <StatCard
          label="Visitors (period)"
          value={data.period || 0}
          trend={periodChange}
          trendLabel="vs prev period"
          color="blue"
        />
        <StatCard label="Today" value={data.today || 0} color="emerald" />
        <StatCard label="Page Views" value={data.total_page_views || 0} icon={Eye} />
      </div>

      {/* Visitor Trend */}
      {data.visitors_by_day && data.visitors_by_day.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-sm p-4">
          <h3 className="font-medium text-slate-800 mb-3">Daily Visitors</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.visitors_by_day}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '2px', fontSize: '12px' }}
                labelFormatter={d => new Date(d).toLocaleDateString()}
              />
              <Area type="monotone" dataKey="unique_visitors" stroke="#1a365d" fill="#1a365d" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="count" stroke="#c9a050" fill="#c9a050" fillOpacity={0.05} strokeWidth={1.5} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#1a365d] inline-block" /> Unique Visitors</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#c9a050] inline-block border-dashed" /> Page Views</span>
          </div>
        </div>
      )}

      {/* Devices + Referrers + New vs Returning */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Devices */}
        <div className="bg-white border border-slate-200 rounded-sm p-4">
          <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <Monitor className="w-4 h-4" /> Devices
          </h3>
          <DevicePieChart devices={data.devices} />
        </div>

        {/* Top Referrers */}
        <div className="bg-white border border-slate-200 rounded-sm p-4">
          <h3 className="font-medium text-slate-800 mb-3">Top Referrers</h3>
          {data.referrers && data.referrers.length > 0 ? (
            <div className="space-y-2">
              {data.referrers.slice(0, 8).map((r) => (
                <div key={r.domain} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 truncate max-w-[180px]" title={r.domain}>{r.domain}</span>
                  <span className="font-medium text-slate-800">{r.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No referrer data</p>
          )}
        </div>

        {/* New vs Returning */}
        <div className="bg-white border border-slate-200 rounded-sm p-4">
          <h3 className="font-medium text-slate-800 mb-3">New vs Returning</h3>
          {data.new_vs_returning ? (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">New</span>
                  <span className="font-medium text-slate-800">{data.new_vs_returning.new || 0}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-[#1a365d] rounded-sm"
                    style={{
                      width: `${((data.new_vs_returning.new || 0) / Math.max(1, (data.new_vs_returning.new || 0) + (data.new_vs_returning.returning || 0))) * 100}%`
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">Returning</span>
                  <span className="font-medium text-slate-800">{data.new_vs_returning.returning || 0}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-[#c9a050] rounded-sm"
                    style={{
                      width: `${((data.new_vs_returning.returning || 0) / Math.max(1, (data.new_vs_returning.new || 0) + (data.new_vs_returning.returning || 0))) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No session data</p>
          )}
        </div>
      </div>
    </div>
  );
}
