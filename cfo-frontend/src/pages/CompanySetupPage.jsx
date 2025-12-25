// src/pages/CompanySetupPage.jsx
// VS25: Company context setup - Step 1 of 2

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Building2, Users, DollarSign, GitBranch, Zap,
  ArrowRight, Loader, AlertCircle, Check
} from 'lucide-react';
import AppShell from '../components/AppShell';
import SetupSidebar from '../components/SetupSidebar';
import SetupProgress from '../components/setup/SetupProgress';
import {
  INDUSTRIES, REVENUE_RANGES, EMPLOYEE_COUNTS,
  FINANCE_STRUCTURES, CHANGE_APPETITES
} from '../data/contextOptions';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Dropdown component
function Dropdown({ label, icon: Icon, value, onChange, options, placeholder, required }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        <span className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-slate-500" />}
          {label}
          {required && <span className="text-red-500">*</span>}
        </span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-slate-200 rounded-sm text-sm
          focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none
          bg-white appearance-none cursor-pointer"
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// Radio group for change appetite
function ChangeAppetiteSelector({ value, onChange }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-slate-700 mb-3">
        <span className="flex items-center gap-2">
          <Zap size={16} className="text-slate-500" />
          Transformation Ambition
          <span className="text-red-500">*</span>
        </span>
      </label>
      <div className="grid grid-cols-3 gap-3">
        {CHANGE_APPETITES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`p-4 rounded-sm border-2 text-left transition-all
              ${value === option.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-slate-200 hover:border-slate-300'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: option.color }}
              />
              <span className="font-semibold text-sm">{option.label}</span>
            </div>
            <p className="text-xs text-slate-500">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CompanySetupPage() {
  const { runId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [company, setCompany] = useState({
    name: '',
    industry: '',
    revenue_range: '',
    employee_count: '',
    finance_structure: '',
    change_appetite: ''
  });

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
    };
  };

  // Load existing data
  useEffect(() => {
    const loadRun = async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/diagnostic-runs/${runId}`, { headers });

        if (!response.ok) {
          setError('Diagnostic run not found');
          return;
        }

        const run = await response.json();

        // If setup already completed, redirect to questions
        if (run.setup_completed_at) {
          navigate(`/run/${runId}/intro`);
          return;
        }

        // Pre-fill if v1 context exists
        if (run.context?.version === 'v1') {
          setCompany(run.context.company);
        } else if (run.context?.company_name) {
          // Legacy context - pre-fill what we have
          setCompany(prev => ({
            ...prev,
            name: run.context.company_name || '',
            industry: run.context.industry || ''
          }));
        }
      } catch (err) {
        setError(`Failed to load: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (runId) loadRun();
    else {
      setError('No run ID provided');
      setLoading(false);
    }
  }, [runId, navigate]);

  const isValid = () => {
    return company.name && company.industry && company.revenue_range &&
           company.employee_count && company.finance_structure && company.change_appetite;
  };

  const handleContinue = async () => {
    if (!isValid()) return;

    setSaving(true);
    setError(null);

    try {
      // Save company context to localStorage for pillar page to combine
      localStorage.setItem(`setup_company_${runId}`, JSON.stringify(company));
      navigate(`/run/${runId}/setup/pillar`);
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
            <h1 className="text-xl font-bold">Company Profile</h1>
          </div>
        </div>

        <main className="max-w-2xl mx-auto px-5 py-8">
          <SetupProgress currentStep="company" />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-6 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 flex-1">{error}</div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-sm p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-800">Tell us about your organization</h2>
              <p className="text-sm text-slate-500 mt-1">This helps us calibrate recommendations to your scale and structure.</p>
            </div>

            {/* Company Name */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <span className="flex items-center gap-2">
                  <Building2 size={16} className="text-slate-500" />
                  Company Name
                  <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="text"
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                placeholder="e.g., Acme Corporation"
                className="w-full px-4 py-3 border border-slate-200 rounded-sm text-sm
                  focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                required
              />
            </div>

            <Dropdown
              label="Industry"
              icon={Building2}
              value={company.industry}
              onChange={(v) => setCompany({ ...company, industry: v })}
              options={INDUSTRIES}
              placeholder="Select industry..."
              required
            />

            <Dropdown
              label="Annual Revenue"
              icon={DollarSign}
              value={company.revenue_range}
              onChange={(v) => setCompany({ ...company, revenue_range: v })}
              options={REVENUE_RANGES}
              placeholder="Select range..."
              required
            />

            <Dropdown
              label="Total Headcount"
              icon={Users}
              value={company.employee_count}
              onChange={(v) => setCompany({ ...company, employee_count: v })}
              options={EMPLOYEE_COUNTS}
              placeholder="Select range..."
              required
            />

            <Dropdown
              label="Finance Structure"
              icon={GitBranch}
              value={company.finance_structure}
              onChange={(v) => setCompany({ ...company, finance_structure: v })}
              options={FINANCE_STRUCTURES}
              placeholder="Select structure..."
              required
            />

            <ChangeAppetiteSelector
              value={company.change_appetite}
              onChange={(v) => setCompany({ ...company, change_appetite: v })}
            />

            <button
              onClick={handleContinue}
              disabled={!isValid() || saving}
              className={`w-full py-3 rounded-sm font-semibold flex items-center justify-center gap-2
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
                  Continue
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
