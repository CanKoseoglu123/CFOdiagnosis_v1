// src/pages/CalibrationPage.jsx
// VS21: Objective Importance Matrix - Calibration step before report

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, AlertTriangle, ChevronRight, LogOut, X } from 'lucide-react';
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
  5: { label: 'Top', description: 'Top priority (1.5x)' },
};

// Maximum number of "Top Priority" (level 5) selections allowed
const MAX_TOP_PRIORITIES = 2;
// Maximum combined High (4) + Top (5) priority selections
const MAX_HIGH_PRIORITY_COMBINED = 4;

// Theme configuration for grouping
const THEME_CONFIG = {
  foundation: { title: 'The Foundation', icon: '🏛️', color: 'border-l-emerald-500' },
  future: { title: 'The Future', icon: '🔮', color: 'border-l-indigo-500' },
  intelligence: { title: 'The Intelligence', icon: '🧠', color: 'border-l-purple-500' },
};

// Intro Modal Component - shown on every page visit
function CalibrationIntroModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Calibrate Your Priorities</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Main text - what & expectations */}
          <p className="text-sm text-slate-700 leading-relaxed">
            Rate each objective's importance to your organization. All 9 objectives must be rated before proceeding.
          </p>

          {/* Why section */}
          <div className="bg-slate-50 border border-slate-200 rounded p-4">
            <p className="text-xs font-semibold text-slate-600 mb-1">
              Why we ask:
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your priorities impact which gaps are highlighted. Higher priority objectives receive stronger weighting in your action plan.
            </p>
          </div>

          {/* Priority Constraints */}
          <div className="bg-slate-50 border border-slate-200 rounded p-4">
            <p className="text-xs font-semibold text-slate-600 mb-2">Priority Constraints:</p>
            <ul className="space-y-1 text-xs text-slate-500">
              <li><span className="font-medium text-amber-600">Top</span> (highest weight): Limited to 2 selections</li>
              <li><span className="font-medium text-blue-600">High + Top</span> combined: Limited to 4 selections</li>
              <li><span className="font-medium text-slate-500">Med, Low, Min</span>: Unlimited</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// ObjectiveImportanceCard Component
function ObjectiveImportanceCard({ objective, value, onChange, locked, topPriorityDisabled, highPriorityDisabled }) {
  const isUnselected = value === null || value === undefined;

  return (
    <div className={`bg-white border rounded-sm p-4 ${
      locked
        ? 'bg-red-50 border-slate-300'
        : isUnselected
          ? 'border-amber-300 bg-amber-50/30'
          : 'border-slate-300'
    }`}>
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
        {value === 5 && !locked && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-sm ml-2">
            Top Priority
          </span>
        )}
        {isUnselected && !locked && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-sm ml-2">
            Not Rated
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(level => {
          // Level 5 is disabled if max reached AND this objective isn't already at 5
          const isTopDisabled = level === 5 && topPriorityDisabled && value !== 5;
          // Level 4 is disabled if combined max reached AND this objective isn't already at 4 or 5
          const isHighDisabled = level === 4 && highPriorityDisabled && value !== 4 && value !== 5;
          const isDisabled = locked || isTopDisabled || isHighDisabled;

          // Determine tooltip message
          let tooltipMsg = IMPORTANCE_CONFIG[level].description;
          if (isTopDisabled) tooltipMsg = 'Maximum 2 Top Priorities reached';
          if (isHighDisabled) tooltipMsg = 'Maximum 4 High + Top Priorities reached';

          const isSelected = value === level;

          return (
            <button
              key={level}
              onClick={() => !isDisabled && onChange(level)}
              disabled={isDisabled}
              title={tooltipMsg}
              className={`
                flex-1 py-2 text-sm border rounded-sm transition-colors
                ${isSelected
                  ? level === 5
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-primary text-white border-primary'
                  : 'bg-white text-slate-600 border-slate-300'
                }
                ${isDisabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:border-primary hover:text-primary'
                }
              `}
            >
              {IMPORTANCE_CONFIG[level].label}
            </button>
          );
        })}
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

// Priority Counter Component - shows both Top Priority and Combined caps
function PriorityCounter({ topCount, maxTop, combinedCount, maxCombined }) {
  const topRemaining = maxTop - topCount;
  const combinedRemaining = maxCombined - combinedCount;
  const isTopFull = topCount >= maxTop;
  const isCombinedFull = combinedCount >= maxCombined;

  return (
    <div className="space-y-4 mb-6">
      {/* Top Priority (Level 5) Counter */}
      <div className={`p-4 border rounded-sm ${isTopFull ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">Top Priority</span>
          <span className={`text-sm font-bold ${isTopFull ? 'text-amber-600' : 'text-slate-600'}`}>
            {topCount} / {maxTop}
          </span>
        </div>
        <div className="flex gap-1.5 mb-2">
          {Array.from({ length: maxTop }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i < topCount ? 'bg-amber-500' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-slate-500">
          {isTopFull
            ? 'All Top Priority slots used. Deselect one to choose another.'
            : `Select ${topRemaining} more objective${topRemaining !== 1 ? 's' : ''} as Top Priority`}
        </p>
      </div>

      {/* Combined High + Top Counter */}
      <div className={`p-4 border rounded-sm ${isCombinedFull ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">High + Top Combined</span>
          <span className={`text-sm font-bold ${isCombinedFull ? 'text-blue-600' : 'text-slate-600'}`}>
            {combinedCount} / {maxCombined}
          </span>
        </div>
        <div className="flex gap-1.5 mb-2">
          {Array.from({ length: maxCombined }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i < combinedCount ? 'bg-blue-500' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-slate-500">
          {isCombinedFull
            ? 'All High + Top Priority slots used. Deselect one to add another.'
            : `${combinedRemaining} slot${combinedRemaining !== 1 ? 's' : ''} remaining for High or Top priorities`}
        </p>
      </div>
    </div>
  );
}

// Sidebar Component
function CalibrationSidebar({ objectives, importanceMap, lockedObjectives, topPriorityCount, combinedPriorityCount, onSubmit, onSaveAndExit, saving }) {
  const totalObjectives = objectives.length;
  const selectedCount = Object.keys(importanceMap).length;
  const allSelected = selectedCount === totalObjectives;
  const remainingCount = totalObjectives - selectedCount;

  return (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-lg font-bold text-navy">CFO Diagnostic</h1>
        <p className="text-xs text-slate-500 mt-1">Calibrate Priorities</p>
      </div>

      {/* Completion Progress */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Progress</span>
          <span className={`text-sm font-bold ${allSelected ? 'text-emerald-600' : 'text-amber-600'}`}>
            {selectedCount} / {totalObjectives}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${allSelected ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${(selectedCount / totalObjectives) * 100}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {allSelected
            ? 'All objectives rated'
            : `${remainingCount} objective${remainingCount !== 1 ? 's' : ''} remaining`}
        </p>
      </div>

      {/* Priority Constraints */}
      <div className="p-6 border-b border-slate-200 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Priority Limits
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Top</span>
          <span className={`text-sm font-medium ${topPriorityCount >= MAX_TOP_PRIORITIES ? 'text-amber-600' : 'text-slate-600'}`}>
            {topPriorityCount}/{MAX_TOP_PRIORITIES} used
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">High+Top</span>
          <span className={`text-sm font-medium ${combinedPriorityCount >= MAX_HIGH_PRIORITY_COMBINED ? 'text-blue-600' : 'text-slate-600'}`}>
            {combinedPriorityCount}/{MAX_HIGH_PRIORITY_COMBINED} used
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-6 flex-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
          How It Works
        </h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex gap-2">
            <span className="text-amber-500">•</span>
            Top: highest weight (1.5x)
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            High: elevated weight (1.25x)
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            Med/Low/Min: standard to reduced
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-slate-200 space-y-3">
        <button
          onClick={onSubmit}
          disabled={!allSelected || saving}
          className={`w-full py-3 rounded-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            allSelected && !saving
              ? 'bg-primary text-white hover:bg-primary-hover'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving...' : 'Generate Report'}
          <ChevronRight className="w-4 h-4" />
        </button>
        {!allSelected && (
          <p className="text-xs text-amber-600 text-center">
            Rate all {totalObjectives} objectives to continue ({remainingCount} remaining)
          </p>
        )}
        <button
          onClick={onSaveAndExit}
          className="w-full py-2 text-slate-500 hover:text-slate-600 text-sm transition-colors flex items-center justify-center gap-2 border border-slate-200 rounded-sm"
        >
          <LogOut className="w-4 h-4" />
          Save & Exit
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
  const [showIntroModal, setShowIntroModal] = useState(true);

  // Fetch objectives and calibration data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // NAV-010: Fetch run data to check if assessment is complete
        const runRes = await fetch(`${API_BASE_URL}/diagnostic-runs/${runId}`, { headers });
        if (!runRes.ok) throw new Error('Failed to load run data');
        const runData = await runRes.json();

        // NAV-010: Gate check - redirect to assessment if not ready for calibration
        const validCalibrationSteps = ['calibration', 'report', 'finalized'];
        if (!validCalibrationSteps.includes(runData.current_step)) {
          // User hasn't completed assessment yet, redirect to first objective
          const targetObjective = runData.last_visited_objective_id || 'obj_budget_discipline';
          navigate(`/assess/objective/${targetObjective}?runId=${runId}`, { replace: true });
          return;
        }

        // Fetch spec for objectives
        const specRes = await fetch(`${API_BASE_URL}/api/spec`);
        if (!specRes.ok) throw new Error('Failed to load spec');
        const specData = await specRes.json();

        // Fetch existing calibration data
        const calibRes = await fetch(`${API_BASE_URL}/diagnostic-runs/${runId}/calibration`, { headers });
        if (!calibRes.ok) throw new Error('Failed to load calibration');
        const calibData = await calibRes.json();

        const loadedObjectives = specData.objectives || [];
        const existingMap = calibData.importance_map || {};

        // Initialize missing objectives to default level 3 (Medium - 1.0x multiplier)
        // This ensures users can proceed immediately with defaults or adjust as needed
        const initializedMap = { ...existingMap };
        loadedObjectives.forEach(obj => {
          if (!(obj.id in initializedMap)) {
            initializedMap[obj.id] = 3;  // Default to Medium (1.0x)
          }
        });

        setObjectives(loadedObjectives);
        setImportanceMap(initializedMap);
        setLockedObjectives(calibData.locked || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [runId, navigate]);

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

  // Group objectives by theme
  const objectivesByTheme = objectives.reduce((acc, obj) => {
    const theme = obj.theme || 'foundation';
    if (!acc[theme]) acc[theme] = [];
    acc[theme].push(obj);
    return acc;
  }, {});

  // Count how many objectives are set to level 5 (Top Priority)
  const topPriorityCount = Object.values(importanceMap).filter(v => v === 5).length;
  const topPriorityDisabled = topPriorityCount >= MAX_TOP_PRIORITIES;

  // Count how many objectives are set to level 4 or 5 (High + Top combined)
  const combinedPriorityCount = Object.values(importanceMap).filter(v => v >= 4).length;
  const highPriorityDisabled = combinedPriorityCount >= MAX_HIGH_PRIORITY_COMBINED;

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

  // Completion tracking
  const totalObjectives = objectives.length;
  const selectedCount = Object.keys(importanceMap).length;
  const allSelected = selectedCount === totalObjectives && totalObjectives > 0;
  const remainingCount = totalObjectives - selectedCount;

  const sidebar = (
    <CalibrationSidebar
      objectives={objectives}
      importanceMap={importanceMap}
      lockedObjectives={lockedObjectives}
      topPriorityCount={topPriorityCount}
      combinedPriorityCount={combinedPriorityCount}
      onSubmit={handleSubmit}
      onSaveAndExit={() => navigate('/')}
      saving={saving}
    />
  );

  return (
    <>
      {/* Intro Modal - shown on every page visit */}
      {showIntroModal && (
        <CalibrationIntroModal onClose={() => setShowIntroModal(false)} />
      )}

      <AppShell sidebarContent={sidebar}>
        <EnterpriseCanvas mode="assessment" className="py-8">
          <h1 className="text-2xl font-bold text-navy mb-2">
            Calibrate Priorities
          </h1>
          <p className="text-slate-600 mb-6">
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
                      value={importanceMap[obj.id] ?? null}
                      onChange={(val) => handleImportanceChange(obj.id, val)}
                      locked={lockedObjectives.includes(obj.id)}
                      topPriorityDisabled={topPriorityDisabled}
                      highPriorityDisabled={highPriorityDisabled}
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
              disabled={!allSelected || saving}
              className={`w-full py-3 rounded-sm font-semibold transition-colors ${
                allSelected && !saving
                  ? 'bg-primary text-white hover:bg-primary-hover'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {saving ? 'Saving...' : 'Generate Report'}
            </button>
            {!allSelected && (
              <p className="text-xs text-amber-600 text-center">
                Rate all {totalObjectives} objectives to continue ({remainingCount} remaining)
              </p>
            )}
            <button
              onClick={() => navigate('/')}
              className="w-full py-2 text-slate-500 hover:text-slate-600 text-sm transition-colors flex items-center justify-center gap-2 border border-slate-200 rounded-sm"
            >
              <LogOut className="w-4 h-4" />
              Save & Exit
            </button>
          </div>
        </EnterpriseCanvas>
      </AppShell>
    </>
  );
}
