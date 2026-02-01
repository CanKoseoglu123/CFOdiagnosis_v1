// Reusable KPI card for analytics dashboard

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ label, value, trend, trendLabel, icon: Icon, color = 'slate' }) {
  const colorMap = {
    slate: 'text-slate-800',
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
  };

  const valueColor = colorMap[color] || colorMap.slate;

  return (
    <div className="bg-white border border-slate-200 rounded-sm p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-500">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
      </div>
      <div className={`text-2xl font-bold ${valueColor}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {trend !== undefined && trend !== null && (
        <div className="flex items-center gap-1 mt-1">
          {trend > 0 ? (
            <TrendingUp className="w-3 h-3 text-emerald-500" />
          ) : trend < 0 ? (
            <TrendingDown className="w-3 h-3 text-red-500" />
          ) : null}
          <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-600' : 'text-slate-500'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
          {trendLabel && <span className="text-xs text-slate-400">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
