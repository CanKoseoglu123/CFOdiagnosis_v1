// Revenue Panel - MRR, conversion, churn (Stripe only)

import React from 'react';
import { DollarSign, TrendingUp, UserMinus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import StatCard from './StatCard';

const COLORS = ['#1a365d', '#64748b', '#c9a050'];

export default function RevenuePanel({ data }) {
  if (!data) return null;

  const userPie = [
    { name: 'Paid', value: data.paid_users || 0 },
    { name: 'Free', value: data.free_users || 0 },
    { name: 'Override', value: data.override_users || 0 },
  ].filter(d => d.value > 0);

  const mrrFormatted = data.mrr != null ? `$${(data.mrr / 100).toLocaleString()}` : '$0';
  const conversionPct = data.conversion_rate != null ? `${(data.conversion_rate * 100).toFixed(1)}%` : '0%';

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="MRR" value={mrrFormatted} icon={DollarSign} color="emerald" />
        <StatCard label="Conversion Rate" value={conversionPct} icon={TrendingUp} color="blue" />
        <StatCard label="Paid Users" value={data.paid_users || 0} />
        <StatCard label="Churn (30d)" value={data.churn_count || 0} icon={UserMinus} color={data.churn_count > 0 ? 'red' : 'slate'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Distribution Pie */}
        <div className="bg-white border border-slate-200 rounded-sm p-4">
          <h3 className="font-medium text-slate-800 mb-3">User Distribution</h3>
          {userPie.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={userPie} dataKey="value" cx="50%" cy="50%" outerRadius={60} strokeWidth={1} stroke="#e2e8f0">
                    {userPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {userPie.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-600">{d.name}</span>
                    <span className="font-medium text-slate-800">{d.value}</span>
                  </div>
                ))}
                <div className="text-xs text-slate-500 pt-1 border-t border-slate-100">
                  Total: {data.total_users || 0}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No user data</p>
          )}
        </div>

        {/* Monthly Trend */}
        <div className="bg-white border border-slate-200 rounded-sm p-4">
          <h3 className="font-medium text-slate-800 mb-3">Subscriptions by Month</h3>
          {data.subscriptions_by_month && data.subscriptions_by_month.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.subscriptions_by_month}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '2px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="count" stroke="#1a365d" strokeWidth={2} dot={{ fill: '#1a365d', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-500">No subscription history</p>
          )}
        </div>
      </div>
    </div>
  );
}
