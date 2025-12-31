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
  BUDGET_PROCESS_BASE, BUDGET_PROCESS_MODIFIERS, PAIN_POINTS, USER_ROLES
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

        // If setup already completed and not in review mode, redirect to intro
        if (run.setup_completed_at && !isReviewMode) {
          localStorage.removeItem(`setup_company_${runId}`);
          navigate(`/run/${runId}/intro`);
          return;
        }

        // In review mode, load company from API context with defaults for missing fields
        if (isReviewMode && run.context?.company) {
          const apiCompany = run.context.company;
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
          setPillar(prev => ({
            ...prev,
            // Arrays - default to empty array if null/undefined
            tools: apiPillar.tools || [],
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
    navigate(`/run/${runId}/setup/company`);
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

      const pillarData = {
        ...pillar,
        budget_process, // Combined array
      };
      // Remove the separate fields before sending
      delete pillarData.budget_process_base;
      delete pillarData.budget_process_modifiers;

      // Clean company data - remove empty/null fields that would fail validation
      const cleanCompany = Object.fromEntries(
        Object.entries(company).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      );

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

      // Clear localStorage and proceed
      localStorage.removeItem(`setup_company_${runId}`);
      navigate(`/run/${runId}/intro`);
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

            <MultiChipSelector
              label="Planning Tools"
              icon={Wrench}
              value={pillar.tools}
              onChange={(v) => setPillar({ ...pillar, tools: v })}
              options={PLANNING_TOOLS}
              required
              hint="(Select all that apply)"
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

          <div className="flex gap-3 mb-8">
            <button
              onClick={handleBack}
              className="flex-1 py-3 rounded font-semibold border border-gray-300
                text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid() || saving}
              className={`flex-1 py-3 rounded font-semibold flex items-center justify-center gap-2
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
