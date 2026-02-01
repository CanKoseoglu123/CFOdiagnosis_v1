// Activity Panel - Real-time event feed with auto-refresh

import React, { useEffect, useRef } from 'react';
import { UserPlus, Play, CheckCircle, MessageSquare, Eye, RefreshCw } from 'lucide-react';

const EVENT_CONFIG = {
  signup: { icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Signup' },
  run_created: { icon: Play, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Run Created' },
  run_finalized: { icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Finalized' },
  feedback: { icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Feedback' },
  visit: { icon: Eye, color: 'text-slate-500', bg: 'bg-slate-50', label: 'Visit' },
};

function formatRelativeTime(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function ActivityPanel({ data, onRefresh, loading }) {
  const intervalRef = useRef(null);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (onRefresh) onRefresh();
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [onRefresh]);

  const events = data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Auto-refreshes every 30 seconds</p>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-sm divide-y divide-slate-100">
        {events.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No recent activity</div>
        ) : (
          events.map((event, i) => {
            const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.visit;
            const Icon = config.icon;

            return (
              <div key={`${event.event_type}-${event.created_at}-${i}`} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${config.bg}`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-sm text-slate-700 truncate">{event.detail || ''}</span>
                  </div>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {event.created_at ? formatRelativeTime(event.created_at) : ''}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
