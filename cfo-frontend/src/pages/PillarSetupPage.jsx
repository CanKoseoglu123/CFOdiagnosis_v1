// src/pages/PillarSetupPage.jsx
// VS25: FP&A pillar context setup - Step 2 of 2

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Calculator, Wrench, Layers, AlertCircle, FileText,
  ArrowRight, ArrowLeft, Loader, Check
} from 'lucide-react';
import AppShell from '../components/AppShell';
import SetupSidebar from '../components/SetupSidebar';
import SetupProgress from '../components/setup/SetupProgress';
import { SYSTEMS, PAIN_POINTS } from '../data/contextOptions';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Multi-select for systems
function SystemsSelector({ value, onChange }) {
  const toggleSystem = (sys) => {
    if (value.includes(sys)) {
      onChange(value.filter(v => v !== sys));
    } else if (value.length < 5) {
      onChange([...value, sys]);
    }
  };

  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-slate-700 mb-3">
        <span className="flex items-center gap-2">
          <Wrench size={16} className="text-slate-500" />
          Primary Planning Tools
          <span className="text-red-500">*</span>
          <span className="text-xs text-slate-400 font-normal ml-2">(Select all that apply)</span>
        </span>
      </label>
      <div className="grid grid-cols-2 gap-2">
        {SYSTEMS.map((sys) => (
          <button
            key={sys.value}
            type="button"
            onClick={() => toggleSystem(sys.value)}
            className={`p-3 rounded-sm border text-left text-sm transition-all
              ${value.includes(sys.value)
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-sm border flex items-center justify-center
                ${value.includes(sys.value) ? 'bg-primary-500 border-primary-500' : 'border-slate-300'}`}>
                {value.includes(sys.value) && <Check size={12} className="text-white" />}
              </div>
              {sys.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Pain points multi-select (max 3)
function PainPointsSelector({ value, onChange }) {
  const togglePain = (pain) => {
    if (value.includes(pain)) {
      onChange(value.filter(v => v !== pain));
    } else if (value.length < 3) {
      onChange([...value, pain]);
    }
  };

  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-slate-700 mb-3">
        <span className="flex items-center gap-2">
          <AlertCircle size={16} className="text-slate-500" />
          Top Pain Points
          <span className="text-xs text-slate-400 font-normal ml-2">(Select up to 3)</span>
        </span>
      </label>
      <div className="space-y-2">
        {PAIN_POINTS.map((pain) => (
          <button
            key={pain.value}
            type="button"
            onClick={() => togglePain(pain.value)}
            disabled={value.length >= 3 && !value.includes(pain.value)}
            className={`w-full p-3 rounded-sm border text-left text-sm transition-all
              ${value.includes(pain.value)
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : value.length >= 3
                  ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-sm border flex items-center justify-center
                ${value.includes(pain.value) ? 'bg-primary-500 border-primary-500' : 'border-slate-300'}`}>
                {value.includes(pain.value) && <Check size={12} className="text-white" />}
              </div>
              {pain.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Complexity inputs
function ComplexityInputs({ value, onChange }) {
  const updateField = (field, val) => {
    onChange({ ...value, [field]: parseInt(val) || 1 });
  };

  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-slate-700 mb-3">
        <span className="flex items-center gap-2">
          <Layers size={16} className="text-slate-500" />
          Complexity Drivers
        </span>
      </label>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1"># Business Units</label>
          <input
            type="number"
            min="1"
            max="50"
            value={value.business_units}
            onChange={(e) => updateField('business_units', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-sm text-sm
              focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1"># Currencies</label>
          <input
            type="number"
            min="1"
            max="20"
            value={value.currencies}
            onChange={(e) => updateField('currencies', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-sm text-sm
              focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1"># Legal Entities</label>
          <input
            type="number"
            min="1"
            max="50"
            value={value.legal_entities}
            onChange={(e) => updateField('legal_entities', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-sm text-sm
              focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          />
        </div>
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
    ftes: 1,
    systems: [],
    complexity: { business_units: 1, currencies: 1, legal_entities: 1 },
    pain_points: [],
    ongoing_projects: ''
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

        // If setup already completed, redirect to questions
        if (run.setup_completed_at) {
          localStorage.removeItem(`setup_company_${runId}`);
          navigate(`/run/${runId}/intro`);
          return;
        }

        // Pre-fill if v1 pillar context exists
        if (run.context?.version === 'v1' && run.context.pillar) {
          setPillar(run.context.pillar);
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
    return pillar.systems.length >= 1;
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
            <div className="text-xs tracking-widest text-slate-400 mb-1">FINANCE DIAGNOSTIC</div>
            <h1 className="text-xl font-bold">FP&A Context</h1>
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

          <div className="bg-white border border-slate-200 rounded-sm p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-800">FP&A Team Context</h2>
              <p className="text-sm text-slate-500 mt-1">Help us understand your team's capacity and current challenges.</p>
            </div>

            {/* FTEs */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <span className="flex items-center gap-2">
                  <Calculator size={16} className="text-slate-500" />
                  FP&A Team Size (FTEs)
                </span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={pillar.ftes}
                onChange={(e) => setPillar({ ...pillar, ftes: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-slate-200 rounded-sm text-sm
                  focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              />
              <p className="text-xs text-slate-400 mt-1">Include partial FTEs (e.g., 2.5 for 2 full-time + 1 part-time)</p>
            </div>

            <SystemsSelector
              value={pillar.systems}
              onChange={(v) => setPillar({ ...pillar, systems: v })}
            />

            <ComplexityInputs
              value={pillar.complexity}
              onChange={(v) => setPillar({ ...pillar, complexity: v })}
            />

            <PainPointsSelector
              value={pillar.pain_points}
              onChange={(v) => setPillar({ ...pillar, pain_points: v })}
            />

            {/* Ongoing Projects */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <span className="flex items-center gap-2">
                  <FileText size={16} className="text-slate-500" />
                  Active Initiatives
                  <span className="text-xs text-slate-400 font-normal ml-2">(Optional)</span>
                </span>
              </label>
              <input
                type="text"
                value={pillar.ongoing_projects}
                onChange={(e) => setPillar({ ...pillar, ongoing_projects: e.target.value.slice(0, 200) })}
                placeholder="e.g., ERP implementation, New CFO onboarding"
                maxLength={200}
                className="w-full px-4 py-3 border border-slate-200 rounded-sm text-sm
                  focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              />
              <p className="text-xs text-slate-400 mt-1">{pillar.ongoing_projects.length}/200 characters</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 py-3 rounded-sm font-semibold border border-slate-200
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
                    Start Assessment
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
