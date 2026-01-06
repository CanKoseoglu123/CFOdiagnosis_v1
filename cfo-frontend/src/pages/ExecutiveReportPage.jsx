// src/pages/ExecutiveReportPage.jsx
// VS-45: Dedicated Executive Report page (post-finalization)
// 4 pages, landscape, print-optimized for PDF export

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { supabase } from '../lib/supabase';
import AppShell from '../components/AppShell';
import WorkflowSidebar from '../components/WorkflowSidebar';
import useReportData, { LEVEL_NAMES, OBJECTIVE_THEME_MAP } from '../hooks/useReportData';
import ActionPlanTable from '../components/report/ActionPlanTable';
import PriorityMatrix from '../components/report/PriorityMatrix';
import ObjectivesPracticesOverview from '../components/report/ObjectivesPracticesOverview';

const API_URL = import.meta.env.VITE_API_URL;

// Brand colors
const NAVY = '#1e3a5f';
const GOLD = '#c9a050';

// Logo component for PDF header
function CFOLensLogo({ size = 36 }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <path d="M8 8 L42 8 L42 42 L8 42 Z" fill="none" stroke={NAVY} strokeWidth="6"/>
        <path d="M58 8 L92 8 L92 42 L58 42 Z" fill="none" stroke={NAVY} strokeWidth="6"/>
        <path d="M8 58 L42 58 L42 92 L8 92 Z" fill="none" stroke={NAVY} strokeWidth="6"/>
        <path d="M58 58 L92 58 L92 92 L58 92 Z" fill="none" stroke={NAVY} strokeWidth="6"/>
        <path d="M50 30 L70 50 L50 70 L30 50 Z" fill={GOLD}/>
      </svg>
      <span className="text-sm font-bold tracking-tight" style={{ color: NAVY }}>
        CFO LENS AI
      </span>
    </div>
  );
}

// Objective short names for radar chart
const OBJECTIVE_SHORT_NAMES = {
  'obj_budget_discipline': 'Budget',
  'obj_financial_controls': 'Controls',
  'obj_performance_monitoring': 'Monitoring',
  'obj_forecasting_agility': 'Forecasting',
  'obj_driver_based_planning': 'Driver-Based',
  'obj_scenario_modeling': 'Scenarios',
  'obj_strategic_influence': 'Strategy',
  'obj_decision_support': 'Decisions',
  'obj_operational_excellence': 'Operations'
};

// Importance dots component
function ImportanceDots({ level }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${
            i <= level ? 'bg-slate-700' : 'bg-slate-200'
          }`}
        />
      ))}
    </span>
  );
}

// Status badge
function StatusBadge({ status }) {
  const styles = {
    strength: 'text-emerald-700',
    opportunity: 'text-amber-700',
    critical: 'text-red-700 font-semibold'
  };
  const labels = {
    strength: 'Strength',
    opportunity: 'Opportunity',
    critical: 'Critical Fix'
  };
  return (
    <span className={`text-xs ${styles[status] || 'text-slate-600'}`}>
      {labels[status] || status}
    </span>
  );
}

// Timeline Journey visualization
function TimelineJourney({ today, at6m, at12m, at24m }) {
  const milestones = [
    { label: 'Today', value: today, color: 'bg-slate-500' },
    { label: '6m', value: at6m, color: 'bg-blue-400' },
    { label: '12m', value: at12m, color: 'bg-blue-500' },
    { label: '24m', value: at24m, color: 'bg-blue-600' }
  ];

  return (
    <div className="flex items-center gap-1">
      {milestones.map((m, idx) => (
        <React.Fragment key={m.label}>
          <div className="flex flex-col items-center w-9">
            <div className={`text-xs font-semibold ${m.value >= 80 ? 'text-emerald-600' : m.value < 40 ? 'text-red-600' : 'text-slate-700'}`}>
              {m.value}%
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded overflow-hidden">
              <div
                className={`h-full ${m.color} transition-all`}
                style={{ width: `${m.value}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{m.label}</div>
          </div>
          {idx < milestones.length - 1 && (
            <div className="text-slate-300 text-xs">→</div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function ExecutiveReportPage() {
  const { runId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (runId) {
      fetchReport();
      fetchSpec();
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

  async function fetchSpec() {
    try {
      const res = await fetch(`${API_URL}/api/spec`);
      if (res.ok) {
        const data = await res.json();
        setSpec(data);
      }
    } catch (err) {
      console.error('Failed to fetch spec:', err);
    }
  }

  // CRITICAL: Use frozen action_plan_snapshot after finalization
  const actionPlan = useMemo(() => {
    if (!report?.action_plan_snapshot) return {};
    // Convert array to map keyed by question_id
    const planMap = {};
    report.action_plan_snapshot.forEach(item => {
      planMap[item.question_id] = {
        timeline: item.timeline,
        assigned_owner: item.assigned_owner,
        status: item.status
      };
    });
    return planMap;
  }, [report?.action_plan_snapshot]);

  // Use shared hook for data computations
  const reportData = useReportData({
    report,
    actionPlan,
    objectives: spec?.objectives || [],
    questions: spec?.questions || [],
    practices: spec?.practices || []
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-500">Loading executive report...</div>
      </div>
    );
  }

  // Error state
  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-red-600">
          {error || 'Failed to load report'}
        </div>
      </div>
    );
  }

  // CRITICAL: Redirect if not finalized
  if (!report.finalized_at) {
    // Use setTimeout to avoid React warning about state update during render
    setTimeout(() => navigate(`/report/${runId}`, { replace: true }), 0);
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-500">Redirecting to report...</div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DATA TRANSFORMATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  const companyName = report.context?.company_name || report.context?.company?.name || 'Company';
  const industry = report.context?.industry || report.context?.company?.industry;
  const runDate = new Date(report.finalized_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const {
    currentScore,
    currentLevel,
    levelName,
    criticalRisks,
    failedCriticalCount,
    projectedScore,
    projectedLevel,
    projectedByTimeline,
    confidence,
    diagnosis,
    objectiveData,
    objectivesByTheme,
    actionCounts,
    commitmentRegister,
    strengths,
    criticalFixes,
    topOpportunities
  } = reportData;

  // Maturity footprint data
  const maturityFootprint = report.maturity_footprint || null;
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

  // Build objective scores map
  const objectiveScores = {};
  objectiveData.forEach(obj => {
    objectiveScores[obj.id] = obj.today;
  });

  // Build radar chart data
  const radarData = objectiveData.map(obj => ({
    subject: OBJECTIVE_SHORT_NAMES[obj.id] || obj.name,
    Current: projectedByTimeline.current[obj.id] || 0,
    '6 Months': projectedByTimeline['6m'][obj.id] || 0,
    '12 Months': projectedByTimeline['12m'][obj.id] || 0,
    'Full Plan': projectedByTimeline['24m'][obj.id] || 0
  }));

  // Gaps count for Priority Matrix
  const gapsTotal = maturityLevels.reduce((sum, lvl) =>
    sum + (lvl.practices?.filter(p => p.evidence_state !== 'full').length || 0), 0);

  // Sidebar content - shows finalized state
  const sidebarContent = (
    <WorkflowSidebar
      currentStep={null}
      completedSteps={['setup', 'assess', 'calibrate', 'report', 'executive']}
      isFinalized={true}
      runId={runId}
      activeTab="executive"
      onTabChange={() => {}} // No tab change on this page
    />
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <AppShell sidebarContent={sidebarContent}>
      <div className="min-h-screen bg-white executive-report-container">
        {/* Print button (screen only) */}
        <div className="print:hidden fixed top-4 right-4 z-50">
          <button
            onClick={() => window.print()}
            className="bg-slate-800 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            Export PDF
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PAGE 1: EXECUTIVE SUMMARY */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="executive-page p-6">
          {/* Page Header with Logo */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
            <div className="flex items-center gap-4">
              <CFOLensLogo size={32} />
              <div className="border-l border-slate-300 pl-4">
                <div className="text-xs text-slate-500 uppercase tracking-wide">FP&A Diagnostic</div>
                <h1 className="text-xl font-bold text-slate-800">{companyName}</h1>
                {industry && <div className="text-sm text-slate-500">{industry}</div>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Finalized</div>
              <div className="text-sm text-slate-600">{runDate}</div>
            </div>
          </div>

          {/* KPI Tiles Row */}
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div className="text-center p-3 border border-slate-200 bg-slate-50">
              <div className="text-3xl font-bold text-slate-800">{currentScore}%</div>
              <div className="text-xs font-semibold text-slate-500 uppercase">Execution Score</div>
            </div>
            <div className="text-center p-3 border border-blue-200 bg-blue-50">
              <div className="text-3xl font-bold text-blue-700">L{currentLevel}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase">{levelName}</div>
            </div>
            <div className="text-center p-3 border border-slate-200 bg-slate-50">
              <div className={`text-3xl font-bold ${failedCriticalCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {failedCriticalCount}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase">Critical Gaps</div>
            </div>
            <div className="text-center p-3 border border-slate-200 bg-slate-50">
              <div className="text-3xl font-bold text-slate-800">{actionCounts.total}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase">Actions Planned</div>
            </div>
          </div>

          {/* Full-width Spider Chart Section */}
          <div className="border border-slate-300 p-4 border-l-4 border-l-blue-500 mb-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Projected Outcome (24 Months)
            </div>
            <div className="flex items-start gap-6">
              {/* Left: Score projections and legend */}
              <div className="w-48 shrink-0">
                <div className="mb-4">
                  <div className="text-xs text-slate-400 mb-1">Score Progression</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-slate-800">{currentScore}%</span>
                    <span className="text-lg text-slate-400">→</span>
                    <span className="text-2xl font-bold text-emerald-600">{projectedScore}%</span>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-xs text-slate-400 mb-1">Maturity Level</div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-medium text-sm ${
                      currentLevel >= 3 ? 'bg-emerald-100 text-emerald-700' :
                      currentLevel >= 2 ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      L{currentLevel}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className={`px-2 py-0.5 rounded font-medium text-sm ${
                      projectedLevel >= 3 ? 'bg-emerald-100 text-emerald-700' :
                      projectedLevel >= 2 ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      L{projectedLevel}
                    </span>
                  </div>
                </div>
                {/* Legend */}
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-0.5 bg-slate-800 inline-block"></span>
                    <span className="text-slate-600">Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-0.5 bg-emerald-500 inline-block"></span>
                    <span className="text-slate-600">Full Plan (24m)</span>
                  </div>
                </div>
              </div>

              {/* Right: Enlarged Radar Chart */}
              <div className="flex-1 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="85%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} tickCount={5} />
                    <Radar name="Current" dataKey="Current" stroke="#1e293b" fill="#1e293b" fillOpacity={0.1} strokeWidth={2} />
                    <Radar name="Full Plan" dataKey="Full Plan" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                    <Tooltip contentStyle={{ fontSize: '11px' }} formatter={(value) => [`${value}%`]} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Objective Details Table */}
          <div className="border border-slate-300">
            <table className="w-full text-sm objective-table">
              <thead className="bg-slate-100">
                <tr className="border-b border-slate-300">
                  <th className="text-left px-3 py-1.5 font-semibold text-slate-700">Objective</th>
                  <th className="text-center px-3 py-1.5 font-semibold text-slate-700 w-16">Importance</th>
                  <th className="text-center px-3 py-1.5 font-semibold text-slate-700" style={{ width: '200px' }}>Score Journey</th>
                  <th className="text-center px-3 py-1.5 font-semibold text-slate-700 w-24">Level Journey</th>
                  <th className="text-center px-3 py-1.5 font-semibold text-slate-700 w-14">Actions</th>
                  <th className="text-center px-3 py-1.5 font-semibold text-slate-700 w-20">Status</th>
                </tr>
              </thead>
              <tbody>
                {['Foundation', 'Future', 'Intelligence'].map(theme => (
                  <React.Fragment key={theme}>
                    <tr className="bg-slate-50">
                      <td colSpan={6} className="px-3 py-1.5 text-xs font-bold text-slate-600 uppercase tracking-wide">
                        {theme}
                      </td>
                    </tr>
                    {objectivesByTheme[theme]?.map(obj => (
                      <tr key={obj.id} className={`border-b border-slate-200 ${obj.status === 'critical' ? 'border-l-2 border-l-red-500' : ''}`}>
                        <td className="px-3 py-1.5 text-slate-700">{obj.name}</td>
                        <td className="px-3 py-1.5 text-center"><ImportanceDots level={obj.importance} /></td>
                        <td className="px-3 py-1.5">
                          <TimelineJourney today={obj.today} at6m={obj.at6m} at12m={obj.at12m} at24m={obj.at24m} />
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <span className="inline-flex items-center gap-1 text-xs">
                            <span className={`px-1.5 py-0.5 rounded font-medium ${
                              obj.currentLevel >= 3 ? 'bg-emerald-100 text-emerald-700' :
                              obj.currentLevel >= 2 ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>L{obj.currentLevel}</span>
                            <span className="text-slate-400">→</span>
                            <span className={`px-1.5 py-0.5 rounded font-medium ${
                              obj.targetLevel >= 3 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                            }`}>L{obj.targetLevel}</span>
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <span className={`text-sm font-semibold ${obj.actionCount > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                            {obj.actionCount}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-center"><StatusBadge status={obj.status} /></td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PAGE 2: ACTION PLAN */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="executive-page p-6 page-break-before">
          <div className="border-b border-slate-200 pb-2 mb-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Action Plan</h2>
            <div className="text-xs text-slate-400">Page 2 · {companyName}</div>
          </div>
          <ActionPlanTable
            commitmentRegister={commitmentRegister}
            actionCounts={actionCounts}
            criticalFixes={criticalFixes}
            actionPlan={actionPlan}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PAGE 3: PRIORITY MATRIX */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="executive-page p-6 page-break-before">
          <div className="border-b border-slate-200 pb-2 mb-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Priority Matrix</h2>
            <div className="text-xs text-slate-400">Page 3 · {companyName}</div>
          </div>
          {spec && (
            <PriorityMatrix
              footprintLevels={maturityFootprint?.levels}
              specPractices={spec.practices}
              specObjectives={spec.objectives}
              calibration={report.calibration}
              userLevel={currentLevel}
            />
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PAGE 4: MATURITY FOOTPRINT */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="executive-page p-6 page-break-before">
          <div className="border-b border-slate-200 pb-2 mb-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Maturity Footprint</h2>
            <div className="text-xs text-slate-400">Page 4 · {companyName}</div>
          </div>
          <ObjectivesPracticesOverview
            levels={maturityLevels}
            objectiveScores={objectiveScores}
          />
        </div>

        {/* Document Footer */}
        <div className="p-6 border-t border-slate-200 print:mt-8">
          <div className="flex justify-between text-xs text-slate-400">
            <div>Finance Diagnostic Platform — Executive Report</div>
            <div>Finalized {runDate}</div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PRINT STYLES */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <style>{`
          /* Screen layout */
          .executive-report-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .executive-page {
            background: white;
            margin-bottom: 1rem;
            border: 1px solid #e2e8f0;
          }

          /* Print styles */
          @media print {
            @page {
              size: landscape;
              margin: 0.4in;
            }

            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .executive-report-container {
              max-width: none;
            }

            .executive-page {
              border: none;
              margin-bottom: 0;
              page-break-inside: avoid;
            }

            .page-break-before {
              page-break-before: always;
            }

            /* Repeat table headers on each page */
            .objective-table thead,
            .action-plan-table thead {
              display: table-header-group;
            }

            /* Hide print button */
            .print\\:hidden {
              display: none !important;
            }

            /* Ensure sections don't split */
            .border {
              break-inside: avoid;
            }

            /* Footer on each page */
            .executive-page::after {
              content: "";
              display: block;
              height: 0;
              clear: both;
            }
          }

          /* Ensure text doesn't overflow in tables */
          .objective-table td,
          .action-plan-table td {
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        `}</style>
      </div>
    </AppShell>
  );
}
