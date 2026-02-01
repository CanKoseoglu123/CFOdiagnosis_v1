// Analytics Tab - Container with sub-tab navigation, date range selector, lazy data fetching

import React, { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { isStripeEnabled } from '../../../config/features';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import OverviewPanel from './OverviewPanel';
import FunnelPanel from './FunnelPanel';
import AssessmentPanel from './AssessmentPanel';
import GeoPanel from './GeoPanel';
import RevenuePanel from './RevenuePanel';
import ActivityPanel from './ActivityPanel';

const API_URL = import.meta.env.VITE_API_URL;

const SUB_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'funnel', label: 'Funnel' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'geo', label: 'Geography' },
  { id: 'revenue', label: 'Revenue', stripeOnly: true },
  { id: 'activity', label: 'Activity' },
];

const DATE_RANGES = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 365, label: 'All time' },
];

// Custom hook for lazy panel data fetching
function usePanelData(getToken) {
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const fetchPanel = useCallback(async (panelId, days) => {
    const cacheKey = `${panelId}-${days}`;

    // Don't refetch if already loading
    if (loading[cacheKey]) return;

    setLoading(prev => ({ ...prev, [cacheKey]: true }));
    setErrors(prev => ({ ...prev, [cacheKey]: null }));

    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const params = panelId === 'activity'
        ? '?limit=30'
        : panelId === 'subscriptions'
          ? ''
          : `?days=${days}`;

      const endpoint = panelId === 'revenue' ? 'subscriptions' : panelId;

      const res = await fetch(`${API_URL}/api/admin/analytics/${endpoint}${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 403) throw new Error('Admin access denied');
      if (!res.ok) throw new Error(`Failed to fetch ${panelId} data`);

      const result = await res.json();
      setCache(prev => ({ ...prev, [cacheKey]: result.data }));
    } catch (err) {
      setErrors(prev => ({ ...prev, [cacheKey]: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, [getToken]);

  const getData = useCallback((panelId, days) => {
    const cacheKey = `${panelId}-${days}`;
    return {
      data: cache[cacheKey] || null,
      loading: !!loading[cacheKey],
      error: errors[cacheKey] || null,
    };
  }, [cache, loading, errors]);

  const invalidate = useCallback((panelId, days) => {
    const cacheKey = `${panelId}-${days}`;
    setCache(prev => {
      const next = { ...prev };
      delete next[cacheKey];
      return next;
    });
  }, []);

  return { fetchPanel, getData, invalidate };
}

export default function AnalyticsTab({ getToken }) {
  const [activePanel, setActivePanel] = useState('overview');
  const [daysBack, setDaysBack] = useState(30);
  const { fetchPanel, getData, invalidate } = usePanelData(getToken);

  const visibleTabs = SUB_TABS.filter(tab => !tab.stripeOnly || isStripeEnabled());

  // Fetch data when panel or date range changes
  React.useEffect(() => {
    const panelKey = activePanel === 'revenue' ? 'revenue' : activePanel;
    fetchPanel(panelKey, daysBack);
  }, [activePanel, daysBack, fetchPanel]);

  const currentKey = activePanel === 'revenue' ? 'revenue' : activePanel;
  const { data, loading, error } = getData(currentKey, daysBack);

  const handleRefresh = useCallback(() => {
    invalidate(currentKey, daysBack);
    fetchPanel(currentKey, daysBack);
  }, [currentKey, daysBack, invalidate, fetchPanel]);

  return (
    <div className="space-y-4">
      {/* Sub-tab pills + Date range */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-sm p-0.5">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${
                activePanel === tab.id
                  ? 'bg-[#1a365d] text-white'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {activePanel !== 'activity' && (
            <select
              value={daysBack}
              onChange={(e) => setDaysBack(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-sm bg-white text-slate-700 focus:outline-none focus:border-slate-400"
            >
              {DATE_RANGES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border border-slate-200 rounded-sm p-4 animate-pulse">
                <div className="h-3 bg-slate-200 rounded w-20 mb-2" />
                <div className="h-6 bg-slate-200 rounded w-16" />
              </div>
            ))}
          </div>
          <div className="bg-white border border-slate-200 rounded-sm p-4 animate-pulse h-48" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && data && Object.keys(data).length === 0 && (
        <div className="bg-white border border-slate-200 rounded-sm p-8 text-center">
          <p className="text-sm text-slate-500">No data available for this period</p>
        </div>
      )}

      {/* Panel content */}
      {!loading || data ? (
        <>
          {activePanel === 'overview' && <OverviewPanel data={data} />}
          {activePanel === 'funnel' && <FunnelPanel data={data} />}
          {activePanel === 'assessment' && <AssessmentPanel data={data} />}
          {activePanel === 'geo' && <GeoPanel data={data} />}
          {activePanel === 'revenue' && <RevenuePanel data={data} />}
          {activePanel === 'activity' && (
            <ActivityPanel data={data} onRefresh={handleRefresh} loading={loading} />
          )}
        </>
      ) : null}
    </div>
  );
}
