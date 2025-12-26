// src/pages/CalibrationPage.jsx
// VS21: Objective Importance Matrix - Calibration step before report

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, AlertTriangle, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AppShell from '../components/AppShell';
import EnterpriseCanvas from '../components/EnterpriseCanvas';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Importance level configuration
const IMPORTANCE_CONFIG = {
  1: { label: 'Min', description: 'Minimal priority (0.5x)' },
  2: { label: 'Low', description: 'Low priority (0.75x)' },
  3: { label: 'Med', description: 'Medium priority (1.0x)' },
  4: { label: 'High', description: 'High priority (1.25x)' },
  5: { label: 'Crit', description: 'Critical priority (1.5x)' },
};

// Theme configuration for grouping
const THEME_CONFIG = {
  foundation: { title: 'The Foundation', icon: '🏛️', color: 'border-l-emerald-500' },
  future: { title: 'The Future', icon: '🔮', color: 'border-l-indigo-500' },
  intelligence: { title: 'The Intelligence', icon: '🧠', color: 'border-l-purple-500' },
};

// ObjectiveImportanceCard Component
function ObjectiveImportanceCard({ objective, value, onChange, locked }) {
  return (
    <div className={`bg-white border border-slate-300 rounded-sm p-4 ${locked ? 'bg-red-50' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-navy">{objective.name}</h3>
          {objective.purpose && (
            <p className="text-xs text-slate-500 mt-1">{objective.purpose}</p>
          )}
        </div>
        {locked && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-sm flex items-center gap-1 ml-2">
            <Lock className="w-3 h-3" />
            Critical Blocker
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(level => (
          <button
            key={level}
            onClick={() => !locked && onChange(level)}
            disabled={locked}
            title={IMPORTANCE_CONFIG[level].description}
            className={`
              flex-1 py-2 text-sm border rounded-sm transition-colors
              ${value === level
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-slate-600 border-slate-300'
              }
              ${locked
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:border-primary hover:text-primary'
              }
            `}
          >
            {IMPORTANCE_CONFIG[level].label}
          </button>
        ))}
      </div>

      {locked && (
        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          This objective contains a failed critical question and cannot be deprioritized.
        </p>
      )}
    </div>
  );
}

// Sidebar Component
function CalibrationSidebar({ objectives, importanceMap, lockedObjectives, onSubmit, onSkip }) {
  const totalObjectives = objectives.length;
  const configuredCount = Object.keys(importanceMap).length;

  return (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-lg font-bold text-navy">CFO Diagnostic</h1>
        <p className="text-xs text-slate-500 mt-1">Calibrate Priorities</p>
      </div>

      {/* Progress */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-600">Objectives Configured</span>
          <span className="font-semibold text-navy">{configuredCount}/{totalObjectives}</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(configuredCount / totalObjectives) * 100}%` }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="p-6 flex-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
          How It Works
        </h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            Rate each objective's importance to your organization
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            Higher importance = higher priority in recommendations
          </li>
          <li className="flex gap-2">
            <span className="text-red-600">•</span>
            Critical blockers are locked at maximum priority
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-slate-200 space-y-3">
        <button
          onClick={onSubmit}
          className="w-full py-3 bg-primary text-white rounded-sm font-semibold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
        >
          Generate Report
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={onSkip}
          className="w-full py-2 text-slate-600 hover:text-navy text-sm transition-colors"
        >
          Skip (use defaults)
        </button>
      </div>
    </div>
  );
}

export default function CalibrationPage() {
  const { runId } = useParams();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [objectives, setObjectives] = useState([]);
  const [importanceMap, setImportanceMap] = useState({});
  const [lockedObjectives, setLockedObjectives] = useState([]);

  // Fetch objectives and calibration data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // Fetch spec for objectives
        const specRes = await fetch(`${API_BASE_URL}/api/spec`);
        if (!specRes.ok) throw new Error('Failed to load spec');
        const specData = await specRes.json();

        // Fetch existing calibration data
        const calibRes = await fetch(`${API_BASE_URL}/diagnostic-runs/${runId}/calibration`, { headers });
        if (!calibRes.ok) throw new Error('Failed to load calibration');
        const calibData = await calibRes.json();

        setObjectives(specData.objectives || []);
        setImportanceMap(calibData.importance_map || {});
        setLockedObjectives(calibData.locked || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [runId]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Update importance for an objective
  const handleImportanceChange = (objectiveId, value) => {
    setImportanceMap(prev => ({
      ...prev,
      [objectiveId]: value
    }));
  };

  // Save and navigate to report
  const handleSubmit = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${API_BASE_URL}/diagnostic-runs/${runId}/calibration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ importance_map: importanceMap }),
      });

      if (!response.ok) throw new Error('Failed to save calibration');

      navigate(`/report/${runId}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  // Skip calibration (use defaults)
  const handleSkip = async () => {
    // Just navigate - the backend will use defaults
    navigate(`/report/${runId}`);
  };

  // Group objectives by theme
  const objectivesByTheme = objectives.reduce((acc, obj) => {
    const theme = obj.theme || 'foundation';
    if (!acc[theme]) acc[theme] = [];
    acc[theme].push(obj);
    return acc;
  }, {});

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-slate-200 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <div className="text-slate-500 text-sm">Loading objectives...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center p-8 bg-red-50 border border-red-200 rounded-sm">
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-4" />
          <div className="text-lg font-semibold text-red-800 mb-2">Error</div>
          <div className="text-red-700 mb-4">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-white px-6 py-2 rounded-sm font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const sidebar = (
    <CalibrationSidebar
      objectives={objectives}
      importanceMap={importanceMap}
      lockedObjectives={lockedObjectives}
      onSubmit={handleSubmit}
      onSkip={handleSkip}
    />
  );

  return (
    <AppShell sidebarContent={sidebar}>
      <EnterpriseCanvas mode="assessment" className="py-8">
        <h1 className="text-2xl font-bold text-navy mb-2">
          Calibrate Priorities
        </h1>
        <p className="text-slate-600 mb-8">
          Tell us which areas matter most to your organization right now.
          This helps us prioritize your action plan.
        </p>

        {/* Objectives grouped by theme */}
        {Object.entries(objectivesByTheme).map(([themeId, themeObjectives]) => {
          const theme = THEME_CONFIG[themeId] || { title: themeId, icon: '📋', color: 'border-l-slate-500' };

          return (
            <div key={themeId} className="mb-8">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4 flex items-center gap-2">
                <span>{theme.icon}</span>
                {theme.title}
              </h2>
              <div className="space-y-4">
                {themeObjectives.map(obj => (
                  <ObjectiveImportanceCard
                    key={obj.id}
                    objective={obj}
                    value={importanceMap[obj.id] || 3}
                    onChange={(val) => handleImportanceChange(obj.id, val)}
                    locked={lockedObjectives.includes(obj.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Mobile-only submit button */}
        <div className="lg:hidden mt-8 space-y-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-3 bg-primary text-white rounded-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Generate Report'}
          </button>
          <button
            onClick={handleSkip}
            className="w-full py-2 text-slate-600 hover:text-navy text-sm transition-colors"
          >
            Skip (use defaults)
          </button>
        </div>
      </EnterpriseCanvas>
    </AppShell>
  );
}
