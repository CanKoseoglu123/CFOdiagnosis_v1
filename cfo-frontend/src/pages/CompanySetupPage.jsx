// src/pages/CompanySetupPage.jsx
// VS25: Company context setup - Step 1 of 2
// Includes: Company Info, Organisation Scale, Ownership Structure, Transformation Ambition

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Building2, Users, Euro, GitBranch, Zap, Briefcase,
  ArrowRight, Loader, AlertCircle, Check, Info
} from 'lucide-react';
import AppShell from '../components/AppShell';
import EnterpriseCanvas from '../components/EnterpriseCanvas';
import SetupSidebar from '../components/SetupSidebar';
import SetupProgress from '../components/setup/SetupProgress';
import {
  INDUSTRIES, REVENUE_RANGES, EMPLOYEE_COUNTS,
  FINANCE_STRUCTURES, OWNERSHIP_STRUCTURES, CHANGE_APPETITES,
  FINANCE_FTE_RANGES, LEGAL_ENTITY_RANGES
} from '../data/contextOptions';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Chip selector component (single select)
function ChipSelector({ label, icon: Icon, value, onChange, options, required }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        <span className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-slate-500" />}
          {label}
          {required && <span className="text-red-500">*</span>}
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
        className="w-full px-4 py-3 border border-slate-300 rounded-sm text-sm
          focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none
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
            className={`p-4 rounded border-2 text-left transition-all
              ${value === option.value
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: option.color }}
              />
              <span className="font-semibold text-sm">{option.label}</span>
            </div>
            <p className="text-xs text-gray-500">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CompanySetupPage() {
  const { runId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReviewMode = searchParams.get('review') === 'true';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [company, setCompany] = useState({
    name: '',
    industry: '',
    revenue_range: '',
    employee_count: '',
    finance_ftes: '',
    legal_entities: '',
    finance_structure: '',
    ownership_structure: '',
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

        // If setup already completed and NOT in review mode, redirect to intro
        if (run.setup_completed_at && !isReviewMode) {
          navigate(`/run/${runId}/intro`);
          return;
        }

        // Pre-fill if v1 context exists
        if (run.context?.version === 'v1' && run.context.company) {
          const apiCompany = run.context.company;
          console.log('[CompanySetupPage] Loading from API:', {
            ownership_structure: apiCompany.ownership_structure,
            finance_structure: apiCompany.finance_structure,
            full_company: apiCompany
          });
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
  }, [runId, navigate, isReviewMode]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isValid = () => {
    return company.name && company.industry && company.revenue_range &&
           company.employee_count && company.finance_structure &&
           company.ownership_structure && company.change_appetite;
  };

  const handleContinue = async () => {
    if (!isValid()) return;

    setSaving(true);
    setError(null);

    try {
      // Save company context to localStorage for pillar page to combine
      localStorage.setItem(`setup_company_${runId}`, JSON.stringify(company));
      // Pass review=true if we're in review mode so PillarSetupPage doesn't redirect
      const reviewParam = isReviewMode ? '?review=true' : '';
      navigate(`/run/${runId}/setup/pillar${reviewParam}`);
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-slate-800 text-white py-6">
          <EnterpriseCanvas mode="setup">
            <div className="text-xs tracking-widest text-blue-300 mb-1">FINANCE DIAGNOSTIC</div>
            <h1 className="text-xl font-bold text-white">Organizational Context</h1>
          </EnterpriseCanvas>
        </div>

        <EnterpriseCanvas mode="setup" className="py-8">
          <SetupProgress currentStep="company" />

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6 flex items-start gap-3">
            <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Before We Begin</p>
              <p className="text-sm text-blue-700">To ensure accurate benchmarking and tailored insights, please provide context on your organization's scale and structure.</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-6 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 flex-1">{error}</div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
            </div>
          )}

          {/* Company Information Section */}
          <div className="bg-white border border-gray-300 rounded p-6 mb-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-bold text-blue-700">Company Information</h2>
              <p className="text-sm text-gray-500">Basic details about your organization</p>
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
                className="w-full px-4 py-3 border border-slate-300 rounded-sm text-sm
                  focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
                required
              />
            </div>

            <Dropdown
              label="Industry"
              icon={Building2}
              value={company.industry}
              onChange={(v) => setCompany({ ...company, industry: v })}
              options={INDUSTRIES}
              placeholder="Select your industry"
              required
            />
          </div>

          {/* Organisation Scale Section */}
          <div className="bg-white border border-gray-300 rounded p-6 mb-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-bold text-blue-700">Organisation Scale</h2>
              <p className="text-sm text-gray-500">Quantitative metrics about your organization</p>
            </div>

            <ChipSelector
              label="Company Size (Employees)"
              icon={Users}
              value={company.employee_count}
              onChange={(v) => setCompany({ ...company, employee_count: v })}
              options={EMPLOYEE_COUNTS}
              required
            />

            <ChipSelector
              label="Turnover Band"
              icon={Euro}
              value={company.revenue_range}
              onChange={(v) => setCompany({ ...company, revenue_range: v })}
              options={REVENUE_RANGES}
              required
            />

            <ChipSelector
              label="Finance FTEs (Scope Entity)"
              icon={Users}
              value={company.finance_ftes}
              onChange={(v) => setCompany({ ...company, finance_ftes: v })}
              options={FINANCE_FTE_RANGES}
            />

            <ChipSelector
              label="# Legal Entities"
              icon={Building2}
              value={company.legal_entities}
              onChange={(v) => setCompany({ ...company, legal_entities: v })}
              options={LEGAL_ENTITY_RANGES}
            />
          </div>

          {/* Ownership Structure Section */}
          <div className="bg-white border border-gray-300 rounded p-6 mb-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-bold text-blue-700">Ownership Structure</h2>
              <p className="text-sm text-gray-500">Type of organizational ownership</p>
            </div>

            <ChipSelector
              label="Ownership Type"
              icon={Briefcase}
              value={company.ownership_structure}
              onChange={(v) => setCompany({ ...company, ownership_structure: v })}
              options={OWNERSHIP_STRUCTURES}
              required
            />

            <ChipSelector
              label="Finance Structure"
              icon={GitBranch}
              value={company.finance_structure}
              onChange={(v) => setCompany({ ...company, finance_structure: v })}
              options={FINANCE_STRUCTURES.map(f => ({ value: f.value, label: f.label }))}
              required
            />
          </div>

          {/* Transformation Ambition Section */}
          <div className="bg-white border border-gray-300 rounded p-6 mb-6 shadow-sm">
            <ChangeAppetiteSelector
              value={company.change_appetite}
              onChange={(v) => setCompany({ ...company, change_appetite: v })}
            />
          </div>

          <button
            onClick={handleContinue}
            disabled={!isValid() || saving}
            className={`w-full py-3 rounded font-semibold flex items-center justify-center gap-2 mb-8
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
                Continue to FP&A Context
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </EnterpriseCanvas>
      </div>
    </AppShell>
  );
}
