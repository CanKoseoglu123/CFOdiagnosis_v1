// src/pages/PillarSetupPage.jsx
// VS25: FP&A pillar context setup - Step 2 of 2
// Includes: Tools & Technology, Team & Process, Pain Points, Additional Context

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Wrench, Users, Calendar, Target, AlertCircle, User,
  ArrowRight, ArrowLeft, Loader, Check, MessageSquare
} from 'lucide-react';
import AppShell from '../components/AppShell';
import SetupSidebar from '../components/SetupSidebar';
import SetupProgress from '../components/setup/SetupProgress';
import {
  PLANNING_TOOLS, TEAM_SIZES, FORECAST_FREQUENCIES,
  BUDGET_PROCESSES, PAIN_POINTS, USER_ROLES
} from '../data/contextOptions';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Chip selector component (single select)
function ChipSelector({ label, icon: Icon, value, onChange, options, required, hint }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        <span className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-slate-500" />}
          {label}
          {required && <span className="text-red-500">*</span>}
          {hint && <span className="text-xs text-slate-400 font-normal ml-2">{hint}</span>}
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-sm border text-sm font-medium transition-all
              ${value === opt.value
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-slate-300 hover:border-slate-400 text-slate-600'}`}
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
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        <span className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-slate-500" />}
          {label}
          {required && <span className="text-red-500">*</span>}
          {hint && <span className="text-xs text-slate-400 font-normal ml-2">{hint}</span>}
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
              className={`px-4 py-2 rounded-sm border text-sm font-medium transition-all flex items-center gap-2
                ${isSelected
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : isDisabled
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'border-slate-300 hover:border-slate-400 text-slate-600'}`}
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
    budget_process: '',
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
        // First, check localStorage for company data
        const savedCompany = localStorage.getItem(`setup_company_${runId}`);
        if (!savedCompany) {
          // No company data - redirect back to step 1
          navigate(`/run/${runId}/setup/company`);
          return;
        }

        setCompany(JSON.parse(savedCompany));

        // Check if run exists and hasn't been completed
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/diagnostic-runs/${runId}`, { headers });

        if (!response.ok) {
          setError('Diagnostic run not found');
          return;
        }

        const run = await response.json();

        // If setup already completed, redirect to intro
        if (run.setup_completed_at) {
          localStorage.removeItem(`setup_company_${runId}`);
          navigate(`/run/${runId}/intro`);
          return;
        }

        // Pre-fill if v1 pillar context exists
        if (run.context?.version === 'v1' && run.context.pillar) {
          setPillar(prev => ({ ...prev, ...run.context.pillar }));
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
  }, [runId, navigate]);

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
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/diagnostic-runs/${runId}/setup`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ company, pillar })
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="animate-spin text-primary-600 mx-auto" />
          <p className="mt-4 text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell sidebarContent={<SetupSidebar currentStep={1} />}>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-navy-900 text-white py-6">
          <div className="max-w-2xl mx-auto px-5">
            <div className="text-xs tracking-widest text-slate-300 mb-1">FINANCE DIAGNOSTIC</div>
            <h1 className="text-xl font-bold text-white">FP&A Context</h1>
          </div>
        </div>

        <main className="max-w-2xl mx-auto px-5 py-8">
          <SetupProgress currentStep="pillar" />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-6 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 flex-1">{error}</div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
            </div>
          )}

          {/* Tools & Technology Section */}
          <div className="bg-white border border-slate-200 rounded-sm p-6 mb-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-primary-700">Tools & Technology</h2>
              <p className="text-sm text-slate-500">Which planning and reporting tools do you use?</p>
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
              <label className="block text-xs text-slate-500 mb-1">Other tool...</label>
              <input
                type="text"
                value={pillar.other_tool}
                onChange={(e) => setPillar({ ...pillar, other_tool: e.target.value })}
                placeholder="Specify other tool"
                className="w-full px-4 py-2 border border-slate-300 rounded-sm text-sm
                  focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
              />
            </div>
          </div>

          {/* Team & Process Section */}
          <div className="bg-white border border-slate-200 rounded-sm p-6 mb-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-primary-700">Team & Process</h2>
              <p className="text-sm text-slate-500">Tell us about your FP&A team structure</p>
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

            <ChipSelector
              label="How would you describe your budget process?"
              icon={Target}
              value={pillar.budget_process}
              onChange={(v) => setPillar({ ...pillar, budget_process: v })}
              options={BUDGET_PROCESSES}
            />
          </div>

          {/* Pain Points Section */}
          <div className="bg-white border border-slate-200 rounded-sm p-6 mb-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-primary-700">Pain Points</h2>
              <p className="text-sm text-slate-500">Which challenges best describe your FP&A today?</p>
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
              <label className="block text-xs text-slate-500 mb-1">Other pain point...</label>
              <input
                type="text"
                value={pillar.other_pain_point}
                onChange={(e) => setPillar({ ...pillar, other_pain_point: e.target.value })}
                placeholder="Specify other challenge"
                className="w-full px-4 py-2 border border-slate-300 rounded-sm text-sm
                  focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
              />
            </div>
          </div>

          {/* Additional Context Section */}
          <div className="bg-white border border-slate-200 rounded-sm p-6 mb-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-primary-700">Additional Context</h2>
              <p className="text-sm text-slate-500">Help us understand your perspective</p>
            </div>

            <ChipSelector
              label="What is your role?"
              icon={User}
              value={pillar.user_role}
              onChange={(v) => setPillar({ ...pillar, user_role: v })}
              options={USER_ROLES}
            />

            <div className="mb-5">
              <label className="block text-xs text-slate-500 mb-1">Other role...</label>
              <input
                type="text"
                value={pillar.other_role}
                onChange={(e) => setPillar({ ...pillar, other_role: e.target.value })}
                placeholder="Specify other role"
                className="w-full px-4 py-2 border border-slate-300 rounded-sm text-sm
                  focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <span className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-slate-500" />
                  Any specific context you'd like to share about your FP&A environment?
                </span>
              </label>
              <textarea
                value={pillar.additional_context}
                onChange={(e) => setPillar({ ...pillar, additional_context: e.target.value })}
                placeholder="Optional: Share any additional context about your planning processes, challenges, or priorities..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-sm text-sm
                  focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none resize-none"
              />
              <p className="text-xs text-slate-400 mt-1">This helps us provide more tailored recommendations</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="flex-1 py-3 rounded-sm font-semibold border border-slate-300
                text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid() || saving}
              className={`flex-1 py-3 rounded-sm font-semibold flex items-center justify-center gap-2
                ${isValid() && !saving
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
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
        </main>
      </div>
    </AppShell>
  );
}
