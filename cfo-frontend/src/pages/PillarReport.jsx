// src/pages/PillarReport.jsx
// VS-22 v3: Added ExecutiveSummary, fixed critical_risks to use expert_action.title

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ExecutiveSummary from '../components/report/ExecutiveSummary';
import MaturityBanner from '../components/report/MaturityBanner';
import SummaryTable from '../components/report/SummaryTable';
import StrengthsBar from '../components/report/StrengthsBar';
import CriticalRisksCard from '../components/report/CriticalRisksCard';
import HighValueCard from '../components/report/HighValueCard';
import MaturityFootprintGrid from '../components/report/MaturityFootprintGrid';
import InterpretationSection from '../components/report/InterpretationSection';

const API_URL = import.meta.env.VITE_API_URL;

// Map objective IDs to themes (API doesn't include theme_id on objectives)
// VS-26: Updated for new objective IDs
const OBJECTIVE_THEME_MAP = {
  // Old IDs (for backward compatibility)
  'obj_fpa_l1_budget': 'Foundation',
  'obj_fpa_l1_control': 'Foundation',
  'obj_fpa_l2_variance': 'Foundation',
  'obj_fpa_l2_forecast': 'Future',
  'obj_fpa_l3_driver': 'Future',
  'obj_fpa_l3_scenario': 'Intelligence',
  'obj_fpa_l4_integrate': 'Intelligence',
  'obj_fpa_l4_predict': 'Intelligence',
  // New IDs (VS-26)
  'obj_budget_discipline': 'Foundation',
  'obj_financial_controls': 'Foundation',
  'obj_performance_monitoring': 'Foundation',
  'obj_forecasting_agility': 'Future',
  'obj_driver_based_planning': 'Future',
  'obj_scenario_modeling': 'Future',
  'obj_strategic_influence': 'Intelligence',
  'obj_decision_support': 'Intelligence',
  'obj_operational_excellence': 'Intelligence'
};

export default function PillarReport() {
  const { runId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (runId) {
      fetchReport();
    }
  }, [runId]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  async function fetchReport() {
    try {
      setLoading(true);
      setError(null);

      // Get session from Supabase directly (useAuth hook doesn't work reliably)
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/report`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch report: ${res.status}`);
      }

      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error('Failed to fetch report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-500">Loading report...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-red-600">
          {error || 'Failed to load report'}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DATA TRANSFORMATIONS
  // ─────────────────────────────────────────────────────────────────────────

  // Transform objectives for SummaryTable and StrengthsBar
  const objectives = (report.objectives || []).map(obj => {
    const objId = obj.id || obj.objective_id;
    return {
      id: objId,
      theme: OBJECTIVE_THEME_MAP[objId] || 'Intelligence',
      objective: obj.objective_name || obj.title || obj.name || objId,
      importance: report.calibration?.importance_map?.[objId] || 3,
      locked: report.calibration?.locked?.includes(objId) || false,
      score: Math.round(obj.score || 0)
    };
  });

  // Transform critical risks - VS22-v3: Use expert_action.title as gap name
  const criticalRisks = (report.critical_risks || []).map(risk => ({
    id: risk.evidence_id || risk.question_id,
    // VS22-v3: Use expert_action.title as the gap name, NOT question_text
    title: risk.expert_action?.title || risk.title || risk.question_text || 'Address this gap',
    action: 'Address this gap',
    recommendation: risk.expert_action?.recommendation || risk.recommendation || '',
    unlocks: `Unlocks Level ${(risk.level || 1) + 1}`
  }));

  // Transform initiatives for HighValueCard
  // Backend returns grouped_initiatives with initiative_title (not title)
  const rawInitiatives = report.grouped_initiatives || report.initiatives || [];
  const initiatives = rawInitiatives.map(init => ({
    id: init.id || init.initiative_id,
    // VS22-v3 FIX: Use initiative_title from backend (strategic project name)
    title: init.initiative_title || init.title || 'Strategic Initiative',
    total_score: init.actions?.reduce((sum, a) => sum + (a.score || 0), 0) || 0,
    actions: (init.actions || []).map(a => ({
      ...a,
      // Action title is the specific gap (from expert_action.title)
      title: a.action_title || a.title || a.action_text,
      is_critical: a.is_critical || false,
      maturity_level: a.level || a.maturity_level || 2
    }))
  }));

  // Calculate totals
  const totalActions = initiatives.reduce((sum, i) => sum + (i.actions?.length || 0), 0);

  // Get maturity data
  const maturityV2 = report.maturity_v2 || {};
  const executionScore = maturityV2.execution_score ?? Math.round((report.overall_score || 0) * 100);
  const actualLevel = maturityV2.actual_level ?? report.maturity?.achieved_level ?? 1;
  const potentialLevel = maturityV2.potential_level ?? actualLevel;
  const levelName = maturityV2.level_name || ['', 'Emerging', 'Defined', 'Managed', 'Optimized'][actualLevel] || 'Emerging';
  const cappedBy = maturityV2.capped_by || [];

  // Count questions answered from pillar data (scored_questions counts all answered)
  const questionsAnswered = report.pillars?.[0]?.scored_questions || 48;

  // ─────────────────────────────────────────────────────────────────────────
  // MATURITY FOOTPRINT DATA (VS-23)
  // Now computed by backend and returned in report.maturity_footprint
  // ─────────────────────────────────────────────────────────────────────────

  const maturityFootprint = report.maturity_footprint || null;

  // Transform API data to component props format
  const maturityLevels = maturityFootprint?.levels?.map(level => ({
    level: level.level,
    name: level.name,
    practices: level.practices.map(p => ({
      id: p.id,
      title: p.title,
      level: p.maturity_level,
      evidence_state: p.evidence_state,
      is_critical: p.has_critical
    }))
  })) || [];

  // Focus next from API (transform to component format)
  const focusNext = maturityFootprint?.focus_next?.map(item => ({
    id: item.practice_id,
    title: item.practice_title,
    level: item.level,
    is_critical: item.reason === 'critical_gap',
    priority: item.priority_score
  })) || [];

  // Summary text from API
  const footprintSummary = maturityFootprint?.summary_text || '';

  // Build objective scores map for the footprint grid (VS-27)
  const objectiveScores = {};
  objectives.forEach(obj => {
    objectiveScores[obj.id] = obj.score;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HEADER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-300">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-slate-800 text-center">
            FP&A Diagnostic Report
          </h1>
          {report.context?.company_name && (
            <p className="text-base text-slate-600 text-center mt-1">
              {report.context.company_name}
              {report.context.industry && ` - ${report.context.industry}`}
            </p>
          )}
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* METRICS BAR */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-300">
        <div className="max-w-5xl mx-auto px-4 py-3 space-y-3">
          {/* Metric Boxes */}
          <div className="grid grid-cols-4 gap-3">
            {/* Execution Score */}
            <div className="text-center p-2 bg-slate-50 rounded border border-slate-200">
              <div className="text-2xl font-bold text-slate-800">
                {executionScore}%
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase">
                Execution
              </div>
            </div>

            {/* Maturity Level */}
            <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">
                L{actualLevel}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase">
                {levelName}
              </div>
            </div>

            {/* Critical Count */}
            <div className="text-center p-2 bg-slate-50 rounded border border-slate-200">
              <div className={`text-2xl font-bold ${criticalRisks.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {criticalRisks.length}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase">
                Critical
              </div>
            </div>

            {/* Action Count */}
            <div className="text-center p-2 bg-slate-50 rounded border border-slate-200">
              <div className="text-2xl font-bold text-slate-800">
                {totalActions}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase">
                Actions
              </div>
            </div>
          </div>

          {/* Maturity Banner */}
          <MaturityBanner
            execution_score={executionScore}
            potential_level={potentialLevel}
            actual_level={actualLevel}
            capped_by={cappedBy}
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* NAVIGATION TABS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 pt-3 text-sm font-semibold transition-colors ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('footprint')}
              className={`pb-3 pt-3 text-sm font-semibold transition-colors ${
                activeTab === 'footprint'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Maturity Footprint
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`pb-3 pt-3 text-sm font-semibold transition-colors ${
                activeTab === 'actions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Action Planning
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MAIN CONTENT */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* VS22-v3: Executive Summary (3-column cards) */}
            <ExecutiveSummary
              execution_score={executionScore}
              actual_level={actualLevel}
              level_name={levelName}
              questions_total={48}
              questions_answered={questionsAnswered}
              critical_count={8}
              failed_critical_count={criticalRisks.length}
            />

            {/* VS-25: AI Interpretation Section */}
            <InterpretationSection runId={runId} />

            {/* Summary Table */}
            <SummaryTable objectives={objectives} />

            {/* Strengths Bar (only shows if objectives >= 70% exist) */}
            <StrengthsBar objectives={objectives} />

            {/* Two Column: Critical Risks + High Value */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CriticalRisksCard risks={criticalRisks} />
              <HighValueCard initiatives={initiatives} />
            </div>
          </>
        )}

        {/* MATURITY FOOTPRINT TAB */}
        {activeTab === 'footprint' && (
          <MaturityFootprintGrid
            levels={maturityLevels}
            focusNext={focusNext}
            summaryText={footprintSummary}
            objectiveScores={objectiveScores}
          />
        )}

        {/* ACTION PLANNING TAB */}
        {activeTab === 'actions' && (
          <div className="bg-white rounded-lg border border-slate-300 p-8 text-center">
            <div className="text-slate-400 text-4xl mb-4">🚧</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Coming Soon</h3>
            <p className="text-slate-500">
              Detailed action planning with timeline and resource allocation will be available in a future update.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-5xl mx-auto px-4 flex justify-between text-xs text-slate-500">
          <span>Finance Diagnostic Platform</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </footer>
    </div>
  );
}
