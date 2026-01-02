// src/pages/PillarSetupPage.jsx
// VS25: FP&A pillar context setup - Step 2 of 2
// Includes: Tools & Technology, Team & Process, Pain Points, Additional Context

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Wrench, Users, Calendar, Target, AlertCircle, User,
  ArrowRight, ArrowLeft, Loader, Check, MessageSquare
} from 'lucide-react';
import AppShell from '../components/AppShell';
import EnterpriseCanvas from '../components/EnterpriseCanvas';
import SetupSidebar from '../components/SetupSidebar';
import SetupProgress from '../components/setup/SetupProgress';
import {
  PLANNING_TOOLS, TEAM_SIZES, FORECAST_FREQUENCIES,
  BUDGET_PROCESS_BASE, BUDGET_PROCESS_MODIFIERS, PAIN_POINTS, USER_ROLES,
  TOOL_EFFECTIVENESS, TOOL_EFFECTIVENESS_LEGEND
} from '../data/contextOptions';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [company, setCompany] = useState(null);

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

  // Load company data from localStorage and check run
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
          localStorage.removeItem(`setup_company_${runId}`);
          navigate(`/assess/foundation?runId=${runId}`);
          return;
        }

        // In review mode, load company from API context with defaults for missing fields
        if (isReviewMode && run.context?.company) {
          const apiCompany = run.context.company;
          console.log('[PillarSetupPage] Loading company from API in review mode:', apiCompany);
          setCompany({
            name: apiCompany.name || '',
            industry: apiCompany.industry || '',
            revenue_range: apiCompany.revenue_range || '',
            employee_count: apiCompany.employee_count || '',
            finance_ftes: apiCompany.finance_ftes || '',
            legal_entities: apiCompany.legal_entities || '',
            finance_structure: apiCompany.finance_structure || '',
            ownership_structure: apiCompany.ownership_structure || '',
            change_appetite: apiCompany.change_appetite || ''
          });
        } else {
          // Normal flow: check localStorage for company data
          const savedCompany = localStorage.getItem(`setup_company_${runId}`);
          if (!savedCompany) {
            // No company data - redirect back to step 1
            navigate(`/run/${runId}/setup/company`);
            return;
          }
          setCompany(JSON.parse(savedCompany));
        }

        // Pre-fill if v1 pillar context exists
        if (run.context?.version === 'v1' && run.context.pillar) {
          const apiPillar = run.context.pillar;
          // VS26: Convert tools array to effectiveness map if it contains objects
          let toolEffectiveness = {};
          let toolsArray = [];
          if (Array.isArray(apiPillar.tools)) {
            if (apiPillar.tools.length > 0 && typeof apiPillar.tools[0] === 'object') {
              // New format: [{tool: 'excel', effectiveness: 'medium'}, ...]
              toolsArray = apiPillar.tools.map(t => t.tool);
              toolEffectiveness = Object.fromEntries(
                apiPillar.tools.map(t => [t.tool, t.effectiveness || 'medium'])
              );
            } else {
              // Old format: ['excel', 'datarails', ...]
              toolsArray = apiPillar.tools;
              toolEffectiveness = Object.fromEntries(
                apiPillar.tools.map(t => [t, 'medium'])
              );
            }
          }
          setPillar(prev => ({
            ...prev,
            // Arrays - default to empty array if null/undefined
            tools: toolsArray,
            tool_effectiveness: toolEffectiveness,
            budget_process_modifiers: apiPillar.budget_process_modifiers || [],
            pain_points: apiPillar.pain_points || [],
            // Strings - default to empty string if null/undefined
            other_tool: apiPillar.other_tool || '',
            team_size: apiPillar.team_size || '',
            forecast_frequency: apiPillar.forecast_frequency || '',
            budget_process_base: apiPillar.budget_process_base || '',
            other_pain_point: apiPillar.other_pain_point || '',
            user_role: apiPillar.user_role || '',
            other_role: apiPillar.other_role || '',
            additional_context: apiPillar.additional_context || ''
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
    // Pass review=true if we're in review mode so CompanySetupPage doesn't redirect
    const reviewParam = isReviewMode ? '?review=true' : '';
    navigate(`/run/${runId}/setup/company${reviewParam}`);
  };

  const handleSubmit = async () => {
    if (!isValid() || !company) return;

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

      // Clean company data - remove empty/null fields that would fail validation
      const cleanCompany = Object.fromEntries(
        Object.entries(company).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      );
      console.log('[PillarSetupPage] Original company from state:', company);
      console.log('[PillarSetupPage] Cleaned company being sent to API:', cleanCompany);

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

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/diagnostic-runs/${runId}/setup`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ company: cleanCompany, pillar: cleanPillar })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.details?.join(', ') || data.error || 'Failed to save');
      }

      // Clear localStorage and proceed to assessment
      localStorage.removeItem(`setup_company_${runId}`);
      navigate(`/assess/foundation?runId=${runId}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell sidebarContent={<SetupSidebar currentStep={1} />}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-slate-800 text-white py-6">
          <EnterpriseCanvas mode="setup">
            <div className="text-xs tracking-widest text-blue-300 mb-1">FINANCE DIAGNOSTIC</div>
            <h1 className="text-xl font-bold text-white">FP&A Context</h1>
          </EnterpriseCanvas>
        </div>

        <EnterpriseCanvas mode="setup" className="py-8">
          <SetupProgress currentStep="pillar" />

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

          <div className="flex justify-between mb-8">
            <button
              onClick={handleBack}
              className="py-3 px-6 rounded font-semibold border border-gray-300
                text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              Back to Organizational Context
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
