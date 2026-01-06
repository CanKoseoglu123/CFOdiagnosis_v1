// src/pages/CompanySetupPage.jsx
// VS25: Company context setup - Step 1 of 2
// Includes: Company Info, Organisation Scale, Ownership Structure, Transformation Ambition

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Building2, Users, Euro, GitBranch, Zap, Briefcase,
  ArrowRight, Loader, AlertCircle, Check, Info,
  // VS-27: Icons for Business Dynamics section
  TrendingUp, GitMerge, Percent, Shield, Landmark, Database
} from 'lucide-react';
import AppShell from '../components/AppShell';
import EnterpriseCanvas from '../components/EnterpriseCanvas';
import SetupSidebar from '../components/SetupSidebar';
import SetupProgress from '../components/setup/SetupProgress';
import {
  INDUSTRIES, REVENUE_RANGES, EMPLOYEE_COUNTS,
  FINANCE_STRUCTURES, OWNERSHIP_STRUCTURES, CHANGE_APPETITES,
  FINANCE_FTE_RANGES, LEGAL_ENTITY_RANGES,
  // VS-27: Business Dynamics classification inputs
  REVENUE_TRAJECTORY, DEBT_PRESSURE, MA_INTENSITY,
  GROSS_MARGIN_BAND, AUDIT_RIGOR, ERP_STRATEGY
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
  const [redirecting, setRedirecting] = useState(false);
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
    change_appetite: '',
    // VS-27: Business Dynamics classification inputs
    revenue_trajectory: '',
    debt_pressure: '',
    ma_intensity: '',
    gross_margin_band: '',
    audit_rigor: '',
    erp_strategy: ''
  });

  // VS-27c: Track company profile ID if linked
  const [companyProfileId, setCompanyProfileId] = useState(null);

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
          setRedirecting(true);
          navigate(`/run/${runId}/intro`);
          return;
        }

        // VS-27c: Check for linked company profile (single source of truth)
        if (run.company_profile_id) {
          setCompanyProfileId(run.company_profile_id);

          // Fetch company profile to get context
          const profileResponse = await fetch(`${API_BASE_URL}/api/company-profiles/${run.company_profile_id}`, { headers });

          if (profileResponse.ok) {
            const profile = await profileResponse.json();
            const profileContext = profile.context || {};

            console.log('[CompanySetupPage] Loading from company profile:', {
              profile_id: profile.id,
              context: profileContext
            });

            setCompany({
              name: profileContext.name || '',
              industry: profileContext.industry || '',
              revenue_range: profileContext.revenue_range || '',
              employee_count: profileContext.employee_count || '',
              finance_ftes: profileContext.finance_ftes || '',
              legal_entities: profileContext.legal_entities || '',
              finance_structure: profileContext.finance_structure || '',
              ownership_structure: profileContext.ownership_structure || '',
              change_appetite: profileContext.change_appetite || '',
              revenue_trajectory: profileContext.revenue_trajectory || '',
              debt_pressure: profileContext.debt_pressure || '',
              ma_intensity: profileContext.ma_intensity || '',
              gross_margin_band: profileContext.gross_margin_band || '',
              audit_rigor: profileContext.audit_rigor || '',
              erp_strategy: profileContext.erp_strategy || ''
            });
          }
        }
        // Fallback: Pre-fill from legacy context if no profile linked (backwards compat)
        else if (run.context?.company) {
          const apiCompany = run.context.company;
          console.log('[CompanySetupPage] Loading from legacy context:', {
            ownership_structure: apiCompany.ownership_structure,
            finance_structure: apiCompany.finance_structure,
            revenue_trajectory: apiCompany.revenue_trajectory
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
            change_appetite: apiCompany.change_appetite || '',
            revenue_trajectory: apiCompany.revenue_trajectory || '',
            debt_pressure: apiCompany.debt_pressure || '',
            ma_intensity: apiCompany.ma_intensity || '',
            gross_margin_band: apiCompany.gross_margin_band || '',
            audit_rigor: apiCompany.audit_rigor || '',
            erp_strategy: apiCompany.erp_strategy || ''
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
    // VS-27b: All 9 classification fields are required for persona classification
    return company.name && company.industry && company.revenue_range &&
           company.employee_count && company.finance_structure &&
           company.ownership_structure && company.change_appetite &&
           // VS-27: Business Dynamics - all 9 required for classification
           company.legal_entities &&
           company.revenue_trajectory &&
           company.debt_pressure &&
           company.ma_intensity &&
           company.gross_margin_band &&
           company.audit_rigor &&
           company.erp_strategy;
  };

  const handleContinue = async () => {
    if (!isValid()) return;

    setSaving(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();

      // VS-27c: Create or update company profile via API
      // Profile is single source of truth for company context
      let profile;

      if (companyProfileId) {
        // PUT to update existing profile (triggers re-classification, clears override)
        console.log('[CompanySetupPage] Updating existing profile:', companyProfileId);
        const response = await fetch(`${API_BASE_URL}/api/company-profiles/${companyProfileId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ context: company })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to update company profile');
        }
        profile = await response.json();
      } else {
        // POST to create new profile + link to diagnostic run
        console.log('[CompanySetupPage] Creating new profile for run:', runId);
        const response = await fetch(`${API_BASE_URL}/api/company-profiles`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            context: company,
            diagnostic_run_id: runId  // Link immediately in database
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create company profile');
        }
        profile = await response.json();
        setCompanyProfileId(profile.id);
      }

      console.log('[CompanySetupPage] Profile saved with classification:', {
        id: profile.id,
        persona: profile.classification?.persona,
        confidence: profile.classification?.confidence
      });

      // Navigate to persona confirmation page (no localStorage needed)
      const reviewParam = isReviewMode ? '?review=true' : '';
      navigate(`/run/${runId}/setup/persona${reviewParam}`);
    } catch (err) {
      console.error('[CompanySetupPage] Save error:', err);
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading || redirecting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="animate-spin text-primary-600 mx-auto" />
          <p className="mt-4 text-slate-500">{redirecting ? 'Redirecting...' : 'Loading...'}</p>
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
              <p className="text-sm text-blue-700">A few questions about your organization will help set the context for your diagnostic assessment.</p>
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
                onFocus={(e) => {
                  if (e.target.value.toLowerCase() === 'unknown') {
                    setCompany({ ...company, name: '' });
                  }
                }}
                placeholder="Enter your company name"
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
              required
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

          {/* VS-27: Business Dynamics Section */}
          <div className="bg-white border border-gray-300 rounded p-6 mb-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-bold text-blue-700">Business Dynamics</h2>
              <p className="text-sm text-gray-500">Factors that shape your finance organization's priorities</p>
            </div>

            <ChipSelector
              label="Revenue Trajectory (TTM)"
              icon={TrendingUp}
              value={company.revenue_trajectory}
              onChange={(v) => setCompany({ ...company, revenue_trajectory: v })}
              options={REVENUE_TRAJECTORY}
              required
            />

            <ChipSelector
              label="M&A Activity (Last 24 Months)"
              icon={GitMerge}
              value={company.ma_intensity}
              onChange={(v) => setCompany({ ...company, ma_intensity: v })}
              options={MA_INTENSITY}
              required
            />

            <ChipSelector
              label="Gross Margin Profile"
              icon={Percent}
              value={company.gross_margin_band}
              onChange={(v) => setCompany({ ...company, gross_margin_band: v })}
              options={GROSS_MARGIN_BAND}
              required
            />

            <ChipSelector
              label="External Audit Scope"
              icon={Shield}
              value={company.audit_rigor}
              onChange={(v) => setCompany({ ...company, audit_rigor: v })}
              options={AUDIT_RIGOR}
              required
            />

            <ChipSelector
              label="Debt & Covenant Pressure"
              icon={Landmark}
              value={company.debt_pressure}
              onChange={(v) => setCompany({ ...company, debt_pressure: v })}
              options={DEBT_PRESSURE}
              required
            />

            <ChipSelector
              label="ERP Landscape"
              icon={Database}
              value={company.erp_strategy}
              onChange={(v) => setCompany({ ...company, erp_strategy: v })}
              options={ERP_STRATEGY}
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
                Continue
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </EnterpriseCanvas>
      </div>
    </AppShell>
  );
}
