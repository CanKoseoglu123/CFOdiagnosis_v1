// src/pages/PillarSetupPage.jsx
// VS25: FP&A pillar context setup - Step 3 of 3 (after company + persona)
// VS-27c: Updated to only send pillar context (company lives in company_profiles)
// Includes: Tools & Technology, Team & Process, Pain Points, Additional Context

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Wrench, Users, Calendar, Target, AlertCircle, User,
  ArrowRight, ArrowLeft, Loader, Check, MessageSquare, LogOut
} from 'lucide-react';
import AppShell from '../components/AppShell';
import EnterpriseCanvas from '../components/EnterpriseCanvas';
import WorkflowSidebar from '../components/WorkflowSidebar';
import SetupHelpModal from '../components/SetupHelpModal';
import {
  PLANNING_TOOLS, TEAM_SIZES, FORECAST_FREQUENCIES,
  BUDGET_PROCESS_BASE, BUDGET_PROCESS_MODIFIERS, PAIN_POINTS, USER_ROLES,
  TOOL_EFFECTIVENESS, TOOL_EFFECTIVENESS_LEGEND
} from '../data/contextOptions';
import useStepTransition from '../hooks/useStepTransition';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Simple debounce helper for auto-save
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Chip selector component (single select)
function ChipSelector({ label, icon: Icon, value, onChange, options, required, hint }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        <span className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-gray-500" />}
          {label}
          {required && <span className="text-red-500">*</span>}
          {hint && <span className="text-xs text-gray-400 font-normal ml-2">{hint}</span>}
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded border text-sm font-medium transition-all
              ${value === opt.value
                ? 'border-blue-600 bg-blue-50 text-blue-700 border-2'
                : 'border-gray-300 hover:border-gray-400 text-gray-600'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Multi-select chip component
function MultiChipSelector({ label, icon: Icon, value, onChange, options, maxSelect, required, hint }) {
  const toggleOption = (optValue) => {
    if (value.includes(optValue)) {
      onChange(value.filter(v => v !== optValue));
    } else if (!maxSelect || value.length < maxSelect) {
      onChange([...value, optValue]);
    }
  };

  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        <span className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-gray-500" />}
          {label}
          {required && <span className="text-red-500">*</span>}
          {hint && <span className="text-xs text-gray-400 font-normal ml-2">{hint}</span>}
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = value.includes(opt.value);
          const isDisabled = maxSelect && value.length >= maxSelect && !isSelected;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleOption(opt.value)}
              disabled={isDisabled}
              className={`px-4 py-2 rounded border text-sm font-medium transition-all flex items-center gap-2
                ${isSelected
                  ? 'border-blue-600 bg-blue-50 text-blue-700 border-2'
                  : isDisabled
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'border-gray-300 hover:border-gray-400 text-gray-600'}`}
            >
              {isSelected && <Check size={14} />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// VS26: Tool selector with effectiveness rating
function ToolWithEffectivenessSelector({
  selectedTools,
  effectiveness,
  onToolsChange,
  onEffectivenessChange,
  options
}) {
  const toggleTool = (toolValue) => {
    console.log('[ToolSelector] Toggle tool clicked:', toolValue, 'Current tools:', selectedTools);
    if (selectedTools.includes(toolValue)) {
      // Remove tool and its effectiveness
      onToolsChange(selectedTools.filter(t => t !== toolValue));
      const newEff = { ...effectiveness };
      delete newEff[toolValue];
      onEffectivenessChange(newEff);
    } else {
      // Add tool with default 'medium' effectiveness
      onToolsChange([...selectedTools, toolValue]);
      onEffectivenessChange({ ...effectiveness, [toolValue]: 'medium' });
    }
  };

  const setEffectiveness = (toolValue, level) => {
    onEffectivenessChange({ ...effectiveness, [toolValue]: level });
  };

  // Group tools by category
  const toolsByCategory = options.reduce((acc, tool) => {
    const cat = tool.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tool);
    return acc;
  }, {});

  const categoryLabels = {
    spreadsheet: 'Spreadsheet',
    excel_connected: 'Excel-Connected',
    planning_platform: 'Planning Platforms',
    bi_tool: 'BI / Reporting',
    other: 'Other'
  };

  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        <span className="flex items-center gap-2">
          <Wrench size={16} className="text-gray-500" />
          Planning Tools
          <span className="text-red-500">*</span>
          <span className="text-xs text-gray-400 font-normal ml-2">(Select all that apply)</span>
        </span>
      </label>

      {/* Tool selection by category */}
      {Object.entries(toolsByCategory).map(([category, tools]) => (
        <div key={category} className="mb-3">
          <p className="text-xs text-gray-500 mb-1.5">{categoryLabels[category] || category}</p>
          <div className="flex flex-wrap gap-2">
            {tools.map((tool) => {
              const isSelected = selectedTools.includes(tool.value);
              return (
                <button
                  key={tool.value}
                  type="button"
                  onClick={() => toggleTool(tool.value)}
                  className={`px-4 py-2 rounded border text-sm font-medium transition-all flex items-center gap-2
                    ${isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-700 border-2'
                      : 'border-gray-300 hover:border-gray-400 text-gray-600'}`}
                >
                  {isSelected && <Check size={14} />}
                  {tool.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Effectiveness ratings for selected tools */}
      {selectedTools.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-1">How effectively are these tools being used?</p>
          <p className="text-xs text-gray-500 mb-3">
            {TOOL_EFFECTIVENESS_LEGEND.low} → {TOOL_EFFECTIVENESS_LEGEND.high}
          </p>
          <div className="space-y-2">
            {selectedTools.map((toolValue) => {
              const tool = options.find(t => t.value === toolValue);
              const currentEff = effectiveness[toolValue] || 'medium';
              return (
                <div key={toolValue} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-40 truncate" title={tool?.label}>
                    {tool?.label || toolValue}
                  </span>
                  <div className="flex gap-1">
                    {TOOL_EFFECTIVENESS.map((eff) => (
                      <button
                        key={eff.value}
                        type="button"
                        onClick={() => setEffectiveness(toolValue, eff.value)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all
                          ${currentEff === eff.value
                            ? eff.value === 'high'
                              ? 'bg-green-100 text-green-700 border-2 border-green-500'
                              : eff.value === 'medium'
                                ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500'
                                : 'bg-red-100 text-red-700 border-2 border-red-500'
                            : 'bg-white border border-gray-300 text-gray-600 hover:border-gray-400'}`}
                      >
                        {eff.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Budget process selector with base (mutually exclusive) + modifiers (additive)
function BudgetProcessSelector({ baseValue, modifiersValue, onBaseChange, onModifiersChange }) {
  const toggleModifier = (mod) => {
    if (modifiersValue.includes(mod)) {
      onModifiersChange(modifiersValue.filter(v => v !== mod));
    } else {
      onModifiersChange([...modifiersValue, mod]);
    }
  };

  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        <span className="flex items-center gap-2">
          <Target size={16} className="text-gray-500" />
          How would you describe your budget process?
        </span>
      </label>

      {/* Base process - mutually exclusive */}
      <p className="text-xs text-gray-500 mb-2">Select primary approach:</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {BUDGET_PROCESS_BASE.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onBaseChange(opt.value)}
            className={`px-4 py-2 rounded border text-sm font-medium transition-all
              ${baseValue === opt.value
                ? 'border-blue-600 bg-blue-50 text-blue-700 border-2'
                : 'border-gray-300 hover:border-gray-400 text-gray-600'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Modifiers - can select multiple */}
      <p className="text-xs text-gray-500 mb-2">Additional approaches (optional):</p>
      <div className="flex flex-wrap gap-2">
        {BUDGET_PROCESS_MODIFIERS.map((opt) => {
          const isSelected = modifiersValue.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleModifier(opt.value)}
              className={`px-4 py-2 rounded border text-sm font-medium transition-all flex items-center gap-2
                ${isSelected
                  ? 'border-blue-600 bg-blue-50 text-blue-700 border-2'
                  : 'border-gray-300 hover:border-gray-400 text-gray-600'}`}
            >
              {isSelected && <Check size={14} />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PillarSetupPage() {
  const { runId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReviewMode = searchParams.get('review') === 'true';
  const { updateStep } = useStepTransition();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState(null);
  // VS-27c: Company data now lives in company_profiles table, not in state

  const [pillar, setPillar] = useState({
    // Tools & Technology
    tools: [],
    tool_effectiveness: {},       // VS26: { tool_value: 'low'|'medium'|'high' }
    other_tool: '',
    // Team & Process
    team_size: '',
    forecast_frequency: '',
    budget_process_base: '',      // One of: top_down, bottom_up, hybrid
    budget_process_modifiers: [], // Any of: driver_based, zero_based
    // Pain Points
    pain_points: [],
    other_pain_point: '',
    // Additional Context
    user_role: '',
    other_role: '',
    additional_context: ''
  });

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
    };
  };

  // Track if auto-save is in progress
  const [autoSaving, setAutoSaving] = useState(false);
  const isInitialMount = useRef(true);

  // Auto-save pillar context when fields change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const autoSave = useCallback(
    debounce(async (pillarData) => {
      if (!runId) return;

      setAutoSaving(true);
      try {
        // Format tools with effectiveness for API
        const toolsWithEffectiveness = pillarData.tools.map(tool => ({
          tool,
          effectiveness: pillarData.tool_effectiveness[tool] || 'medium'
        }));

        const headers = await getAuthHeaders();
        await fetch(`${API_BASE_URL}/diagnostic-runs/${runId}/setup`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            pillar: {
              ...pillarData,
              tools: toolsWithEffectiveness
            }
          })
        });
        console.log('[PillarSetupPage] Auto-saved pillar context');
      } catch (err) {
        console.error('[PillarSetupPage] Auto-save failed:', err);
      } finally {
        setAutoSaving(false);
      }
    }, 1000),
    [runId]
  );

  // Trigger auto-save when pillar state changes (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!loading) {
      autoSave(pillar);
    }
  }, [pillar, autoSave, loading]);

  // VS-27c: Load run data and check for linked company profile
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if run exists
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/diagnostic-runs/${runId}`, { headers });

        if (!response.ok) {
          setError('Diagnostic run not found');
          return;
        }

        const run = await response.json();

        // If setup already completed and not in review mode, redirect to assessment
        if (run.setup_completed_at && !isReviewMode) {
          setRedirecting(true);
          navigate(`/assess/objective/obj_budget_discipline?runId=${runId}`);
          return;
        }

        // VS-27c: Check for linked company profile instead of localStorage
        if (!run.company_profile_id) {
          // No company profile - redirect back to company setup
          console.log('[PillarSetupPage] No company_profile_id, redirecting to company setup');
          setRedirecting(true);
          navigate(`/run/${runId}/setup/company`);
          return;
        }

        // Pre-fill if pillar context exists (v1 or v2 format)
        const pillarContext = run.context?.pillar;
        if (pillarContext) {
          // VS26: Convert tools array to effectiveness map if it contains objects
          let toolEffectiveness = {};
          let toolsArray = [];
          if (Array.isArray(pillarContext.tools)) {
            if (pillarContext.tools.length > 0 && typeof pillarContext.tools[0] === 'object') {
              // New format: [{tool: 'excel', effectiveness: 'medium'}, ...]
              toolsArray = pillarContext.tools.map(t => t.tool);
              toolEffectiveness = Object.fromEntries(
                pillarContext.tools.map(t => [t.tool, t.effectiveness || 'medium'])
              );
            } else {
              // Old format: ['excel', 'datarails', ...]
              toolsArray = pillarContext.tools;
              toolEffectiveness = Object.fromEntries(
                pillarContext.tools.map(t => [t, 'medium'])
              );
            }
          }
          setPillar(prev => ({
            ...prev,
            // Arrays - default to empty array if null/undefined
            tools: toolsArray,
            tool_effectiveness: toolEffectiveness,
            budget_process_modifiers: pillarContext.budget_process_modifiers || [],
            pain_points: pillarContext.pain_points || [],
            // Strings - default to empty string if null/undefined
            other_tool: pillarContext.other_tool || '',
            team_size: pillarContext.team_size || '',
            forecast_frequency: pillarContext.forecast_frequency || '',
            budget_process_base: pillarContext.budget_process_base || '',
            other_pain_point: pillarContext.other_pain_point || '',
            user_role: pillarContext.user_role || '',
            other_role: pillarContext.other_role || '',
            additional_context: pillarContext.additional_context || ''
          }));
        }
      } catch (err) {
        setError(`Failed to load: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (runId) loadData();
    else {
      setError('No run ID provided');
      setLoading(false);
    }
  }, [runId, navigate, isReviewMode]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isValid = () => {
    return pillar.tools.length >= 1;
  };

  const handleBack = () => {
    // VS-27c: Navigate to persona confirmation page (back from pillar → persona)
    const reviewParam = isReviewMode ? '?review=true' : '';
    navigate(`/run/${runId}/setup/persona${reviewParam}`);
  };

  const handleSubmit = async () => {
    // VS-27c: Only validate pillar data (company is already in company_profiles)
    if (!isValid()) return;

    setSaving(true);
    setError(null);

    try {
      // Combine budget process base and modifiers into single array for API
      const budget_process = [
        ...(pillar.budget_process_base ? [pillar.budget_process_base] : []),
        ...pillar.budget_process_modifiers
      ];

      // VS26: Convert tools to array with effectiveness ratings
      const toolsWithEffectiveness = pillar.tools.map(toolValue => ({
        tool: toolValue,
        effectiveness: pillar.tool_effectiveness[toolValue] || 'medium'
      }));

      const pillarData = {
        ...pillar,
        tools: toolsWithEffectiveness, // VS26: Array of {tool, effectiveness} objects
        budget_process, // Combined array
      };
      // Remove the separate fields before sending
      delete pillarData.budget_process_base;
      delete pillarData.budget_process_modifiers;
      delete pillarData.tool_effectiveness;

      // Clean pillar data - convert null to empty string for text fields, remove empty optional fields
      const cleanPillar = {
        ...pillarData,
        // Ensure text fields are strings (not null)
        other_tool: pillarData.other_tool || '',
        other_pain_point: pillarData.other_pain_point || '',
        other_role: pillarData.other_role || '',
        additional_context: pillarData.additional_context || '',
      };
      // Remove empty optional string fields that aren't required
      if (!cleanPillar.team_size) delete cleanPillar.team_size;
      if (!cleanPillar.forecast_frequency) delete cleanPillar.forecast_frequency;
      if (!cleanPillar.user_role) delete cleanPillar.user_role;
      // Remove empty budget_process array
      if (cleanPillar.budget_process.length === 0) delete cleanPillar.budget_process;

      // VS-27c: Only send pillar data (company is already in company_profiles table)
      console.log('[PillarSetupPage] Sending pillar context:', cleanPillar);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/diagnostic-runs/${runId}/setup`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ pillar: cleanPillar })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.details?.join(', ') || data.error || 'Failed to save');
      }

      // Update step tracking and navigate to first assessment objective
      await updateStep(runId, 'assessment', { last_visited_objective_id: 'obj_budget_discipline' });
      navigate(`/assess/objective/obj_budget_discipline?runId=${runId}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading || redirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500">{redirecting ? 'Redirecting...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell sidebarContent={
      <WorkflowSidebar
        currentStep="setup"
        completedSteps={[]}
        runId={runId}
        isFinalized={false}
        reachableSteps={isReviewMode ? ['assess'] : []}
      />
    }>
      <SetupHelpModal
        title="Your FP&A Environment"
        mainText="Tell us about your FP&A function—the tools you use, your team structure, and the challenges you face today. Be honest about your current state. This isn't a test. Select pain points that genuinely resonate, not aspirational ones."
        whyTitle="Why we ask:"
        whyText="Your tooling and team size affect what's achievable in your context. Pain points help us prioritize which gaps matter most to you. This context makes your action plan practical, not theoretical."
      />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-slate-800 text-white py-6">
          <EnterpriseCanvas mode="setup">
            <div className="text-xs tracking-widest text-blue-300 mb-1">FINANCE DIAGNOSTIC</div>
            <h1 className="text-xl font-bold text-white">FP&A Context</h1>
          </EnterpriseCanvas>
        </div>

        <EnterpriseCanvas mode="setup" className="py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 flex-1">{error}</div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
            </div>
          )}

          {/* Tools & Technology Section */}
          <div className="bg-white border border-gray-300 rounded p-6 mb-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-bold text-blue-700">Tools & Technology</h2>
              <p className="text-sm text-gray-500">Which planning and reporting tools do you use?</p>
            </div>

            <ToolWithEffectivenessSelector
              selectedTools={pillar.tools}
              effectiveness={pillar.tool_effectiveness}
              onToolsChange={(v) => setPillar(prev => ({ ...prev, tools: v }))}
              onEffectivenessChange={(v) => setPillar(prev => ({ ...prev, tool_effectiveness: v }))}
              options={PLANNING_TOOLS}
            />

            <div className="mb-5">
              <label className="block text-xs text-gray-500 mb-1">Other tool...</label>
              <input
                type="text"
                value={pillar.other_tool}
                onChange={(e) => setPillar({ ...pillar, other_tool: e.target.value })}
                placeholder="Specify other tool"
                className="w-full px-4 py-2 border border-gray-300 rounded text-sm
                  focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          {/* Team & Process Section */}
          <div className="bg-white border border-gray-300 rounded p-6 mb-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-bold text-blue-700">Team & Process</h2>
              <p className="text-sm text-gray-500">Tell us about your FP&A team structure</p>
            </div>

            <ChipSelector
              label="How large is your FP&A team?"
              icon={Users}
              value={pillar.team_size}
              onChange={(v) => setPillar({ ...pillar, team_size: v })}
              options={TEAM_SIZES}
            />

            <ChipSelector
              label="How often do you update forecasts?"
              icon={Calendar}
              value={pillar.forecast_frequency}
              onChange={(v) => setPillar({ ...pillar, forecast_frequency: v })}
              options={FORECAST_FREQUENCIES}
            />

            <BudgetProcessSelector
              baseValue={pillar.budget_process_base}
              modifiersValue={pillar.budget_process_modifiers}
              onBaseChange={(v) => setPillar({ ...pillar, budget_process_base: v })}
              onModifiersChange={(v) => setPillar({ ...pillar, budget_process_modifiers: v })}
            />
          </div>

          {/* Pain Points Section */}
          <div className="bg-white border border-gray-300 rounded p-6 mb-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-bold text-blue-700">Pain Points</h2>
              <p className="text-sm text-gray-500">Which challenges best describe your FP&A today?</p>
            </div>

            <MultiChipSelector
              label="Current Challenges"
              icon={AlertCircle}
              value={pillar.pain_points}
              onChange={(v) => setPillar({ ...pillar, pain_points: v })}
              options={PAIN_POINTS}
              maxSelect={5}
              hint="(Select up to 5)"
            />

            <div className="mb-5">
              <label className="block text-xs text-gray-500 mb-1">Other pain point...</label>
              <input
                type="text"
                value={pillar.other_pain_point}
                onChange={(e) => setPillar({ ...pillar, other_pain_point: e.target.value })}
                placeholder="Specify other challenge"
                className="w-full px-4 py-2 border border-gray-300 rounded text-sm
                  focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          {/* Additional Context Section */}
          <div className="bg-white border border-gray-300 rounded p-6 mb-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-bold text-blue-700">Additional Context</h2>
              <p className="text-sm text-gray-500">Help us understand your perspective</p>
            </div>

            <ChipSelector
              label="What is your role?"
              icon={User}
              value={pillar.user_role}
              onChange={(v) => setPillar({ ...pillar, user_role: v })}
              options={USER_ROLES}
            />

            <div className="mb-5">
              <label className="block text-xs text-gray-500 mb-1">Other role...</label>
              <input
                type="text"
                value={pillar.other_role}
                onChange={(e) => setPillar({ ...pillar, other_role: e.target.value })}
                placeholder="Specify other role"
                className="w-full px-4 py-2 border border-gray-300 rounded text-sm
                  focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-gray-500" />
                  Any specific context you'd like to share about your FP&A environment?
                </span>
              </label>
              <textarea
                value={pillar.additional_context}
                onChange={(e) => setPillar({ ...pillar, additional_context: e.target.value })}
                placeholder="Optional: Share any additional context about your planning processes, challenges, or priorities..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded text-sm
                  focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">This helps us provide more tailored recommendations</p>
            </div>
          </div>

          <div className="flex justify-between items-center mb-8">
            <button
              onClick={handleBack}
              className="py-3 px-6 rounded font-semibold border border-gray-300
                text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              Back to Persona
            </button>

            <button
              onClick={() => navigate('/')}
              className="py-3 px-6 rounded font-semibold border border-gray-200
                text-gray-500 hover:bg-gray-50 hover:text-gray-600 flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              Save & Exit
            </button>

            <button
              onClick={handleSubmit}
              disabled={!isValid() || saving}
              className={`py-3 px-6 rounded font-semibold flex items-center justify-center gap-2
                ${isValid() && !saving
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {saving ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Start Diagnostic
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </EnterpriseCanvas>
      </div>
    </AppShell>
  );
}
