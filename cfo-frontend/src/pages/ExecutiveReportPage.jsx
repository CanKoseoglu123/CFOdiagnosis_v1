// src/pages/ExecutiveReportPage.jsx
// VS-45: Dedicated Executive Report page (post-finalization)
// 8 pages, landscape, print-optimized for PDF export

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AppShell from '../components/AppShell';
import WorkflowSidebar from '../components/WorkflowSidebar';
import useReportData, { LEVEL_NAMES } from '../hooks/useReportData';
import ActionPlanTable from '../components/report/ActionPlanTable';
import PriorityMatrix from '../components/report/PriorityMatrix';
import ObjectivesPracticesOverview from '../components/report/ObjectivesPracticesOverview';
import BenchmarkTab from '../components/report/BenchmarkTab';
import { BRAND_COLORS } from '../components/Logo';
// Executive commentary uses direct sections from API (no evidence processing needed)

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

function PrintFooter({ pageNumber, runId, printDate }) {
  return (
    <div className="print-footer">
      <div className="print-footer-left">
        <div className="print-footer-left-row text-[8px] text-slate-500">
          <span className="text-[9px] font-semibold text-slate-600">{pageNumber}</span>
          <span>RESTRICTED DISTRIBUTION © 2026 CFO-Lens AI and/or its affiliates. All rights reserved.</span>
        </div>
      </div>
      <div className="print-footer-center text-[10px] text-slate-400">
        <div>Run ID: {runId || 'Unknown'}</div>
        <div>Print Date: {printDate}</div>
      </div>
      <div className="print-footer-right">
        <img
          src="/Logo horizontal.png"
          alt="CFO Lens AI"
          className="h-5 object-contain"
        />
      </div>
    </div>
  );
}

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

function ExecutionSummaryCard({
  executionScore,
  projectedScore,
  currentLevel,
  projectedLevel,
  levelName,
  projectedLevelName
}) {
  const improvement = Math.max(0, projectedScore - executionScore);

  return (
    <div className="border border-slate-200 rounded-sm p-4 bg-white h-[280px] flex flex-col">
      <div className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">
        Execution Score
      </div>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-5xl font-bold text-slate-800">{executionScore}%</span>
        {improvement > 0 && (
          <span className="flex items-center gap-2 text-emerald-600">
            <span className="text-2xl font-bold">-&gt;</span>
            <span className="text-5xl font-bold">{projectedScore}%</span>
          </span>
        )}
      </div>
      {improvement > 0 && (
        <div className="mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-700">
            +{improvement} points if completed
          </span>
        </div>
      )}
      <div className="mb-3" />
      <div className="pt-3 border-t border-slate-100 mt-auto">
        <div className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">
          Maturity Level
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <span className={`inline-block px-4 py-2 rounded text-5xl font-bold ${
              currentLevel >= 3 ? 'bg-emerald-100 text-emerald-700' :
              currentLevel >= 2 ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              L{currentLevel}
            </span>
            <div className="text-[10px] text-slate-400 mt-1">{levelName}</div>
          </div>
          <span className={`text-2xl font-bold self-start mt-3 ${
            projectedLevel > currentLevel ? 'text-emerald-500' : 'text-slate-300'
          }`}>-&gt;</span>
          <div className="text-center">
            <span className={`inline-block px-4 py-2 rounded text-5xl font-bold ${
              projectedLevel > currentLevel
                ? (projectedLevel >= 3 ? 'bg-emerald-100 text-emerald-700' :
                   projectedLevel >= 2 ? 'bg-amber-100 text-amber-700' :
                   'bg-blue-100 text-blue-700')
                : 'bg-slate-100 text-slate-500'
            }`}>
              L{projectedLevel}
            </span>
            <div className="text-[10px] text-slate-400 mt-1">{projectedLevelName}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriorityObjectivesChart({ objectives }) {
  return (
    <div className="border border-slate-200 rounded-sm p-4 bg-white h-[280px] flex flex-col">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="text-sm font-bold uppercase tracking-wide text-slate-600">
            Highest Priority Objectives
          </div>
          <div className="text-xs text-slate-500">
            Maturity vs target, including committed action impact.
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#0b2d5b]" />
            <span>Maturity</span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className="w-3 h-3 border border-slate-200"
              style={{
                backgroundColor: 'rgba(11, 45, 91, 0.18)',
                backgroundImage: 'repeating-linear-gradient(135deg, rgba(11, 45, 91, 0.6) 0 1px, rgba(11, 45, 91, 0.12) 1px 3px)'
              }}
            />
            <span>With actions</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-1 bg-orange-500" />
            <span>Target</span>
          </div>
        </div>
      </div>
      {objectives.length > 0 ? (
        <>
          <div className="flex-1 flex flex-col justify-between gap-2">
            {objectives.map((obj) => {
              const currentWidth = Math.max(0, (obj.currentLevel / 4) * 100);
              const projectedWidth = Math.max(0, (obj.projectedLevel / 4) * 100);
              const extension = Math.max(0, projectedWidth - currentWidth);
              const targetLeft = obj.targetLevel ? Math.max(0, (obj.targetLevel / 4) * 100) : null;
              const markerClass = obj.importance === 5
                ? 'bg-red-500'
                : obj.importance === 4
                  ? 'bg-amber-500'
                  : 'bg-slate-200';

              return (
                <div key={obj.id} className="grid grid-cols-[170px_1fr] items-center gap-3 h-8">
                  <div className="text-xs text-slate-700 leading-tight font-semibold flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${markerClass}`} />
                    <span>{obj.name}</span>
                  </div>
                  <div className="relative h-6">
                    <div className="absolute inset-0 bg-slate-100 border border-slate-200" />
                    {[1, 2, 3, 4].map((tick) => (
                      <div
                        key={tick}
                        className="absolute top-0 bottom-0 w-px bg-slate-200"
                        style={{ left: `${(tick / 4) * 100}%` }}
                      />
                    ))}
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-[#0b2d5b]"
                      style={{ width: `${currentWidth}%` }}
                    />
                    {extension > 0 && (
                      <div
                        className="absolute top-0 bottom-0"
                        style={{
                          left: `${currentWidth}%`,
                          width: `${extension}%`,
                          backgroundColor: 'rgba(11, 45, 91, 0.18)',
                          backgroundImage: 'repeating-linear-gradient(135deg, rgba(11, 45, 91, 0.6) 0 1px, rgba(11, 45, 91, 0.12) 1px 3px)'
                        }}
                      />
                    )}
                    {targetLeft !== null && (
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-orange-500"
                        style={{ left: `calc(${targetLeft}% - 2px)` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 grid grid-cols-[170px_1fr] items-center gap-3 text-[11px] font-semibold text-slate-600">
            <div />
            <div className="relative h-4 -mt-1">
              <span className="absolute left-0 opacity-0">L0</span>
              <span className="absolute left-1/4 -translate-x-1/2">L1</span>
              <span className="absolute left-1/2 -translate-x-1/2">L2</span>
              <span className="absolute left-3/4 -translate-x-1/2">L3</span>
              <span className="absolute right-0">L4</span>
            </div>
          </div>
        </>
      ) : (
        <div className="text-sm text-slate-500">
          No objectives marked as high or critical priority in calibration.
        </div>
      )}
    </div>
  );
}

export default function ExecutiveReportPage() {
  const { runId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [spec, setSpec] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [aiSections, setAiSections] = useState([]);
  const [aiStatus, setAiStatus] = useState('idle');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (runId) {
      fetchReport();
      fetchSpec();
      fetchBenchmark();
      fetchInterpretation();
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

  async function fetchBenchmark() {
    try {
      setBenchmarkLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/benchmark`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch benchmark: ${res.status}`);
      }

      const data = await res.json();
      setBenchmarkData(data);
    } catch (err) {
      console.error('Failed to fetch benchmark:', err);
    } finally {
      setBenchmarkLoading(false);
    }
  }

  async function fetchInterpretation() {
    try {
      setAiStatus('loading');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers = {
        ...(token && { Authorization: `Bearer ${token}` }),
        'Content-Type': 'application/json'
      };

      // Check executive interpretation status
      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret-executive/status`, {
        headers
      });

      if (!res.ok) {
        setAiStatus('error');
        return;
      }

      const data = await res.json();

      if (data.status === 'completed' && data.sections?.length > 0) {
        // Executive commentary ready
        setAiSections(data.sections);
        setAiStatus('complete');
      } else if (data.status === 'generating') {
        // Poll for completion
        pollExecutiveInterpretation(headers);
      } else if (data.status === 'not_finalized') {
        // Not finalized yet, hide section
        setAiStatus('empty');
      } else {
        // Trigger generation
        const startRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret-executive`, {
          method: 'POST',
          headers
        });

        if (startRes.ok) {
          // Poll for completion
          pollExecutiveInterpretation(headers);
        } else {
          setAiStatus('error');
        }
      }
    } catch (err) {
      console.error('Failed to fetch interpretation:', err);
      setAiStatus('error');
    }
  }

  async function pollExecutiveInterpretation(headers, attempts = 0) {
    if (attempts > 30) {
      // Max 30 attempts (60 seconds)
      setAiStatus('error');
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret-executive/status`, {
        headers
      });

      if (!res.ok) {
        setAiStatus('error');
        return;
      }

      const data = await res.json();

      if (data.status === 'completed' && data.sections?.length > 0) {
        setAiSections(data.sections);
        setAiStatus('complete');
      } else if (data.status === 'generating') {
        pollExecutiveInterpretation(headers, attempts + 1);
      } else if (data.status === 'failed') {
        setAiStatus('error');
      } else {
        setAiStatus('empty');
      }
    } catch (err) {
      console.error('Poll failed:', err);
      setAiStatus('error');
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

  const projectedTargets = useMemo(() => {
    const map = {};
    reportData.objectiveData?.forEach(obj => {
      map[obj.id] = obj.targetLevel;
    });
    return map;
  }, [reportData.objectiveData]);

  const objectiveTargets = useMemo(() => {
    const targets = benchmarkData?.targets?.objectiveTargets || [];
    return new Map(targets.map((t) => [t.objective_id, t.adjustedTarget]));
  }, [benchmarkData]);

  const priorityObjectives = useMemo(() => {
    if (!reportData.objectiveData?.length) return [];
    return reportData.objectiveData
      .map((obj) => ({
        ...obj,
        targetLevel: objectiveTargets.get(obj.id) ?? obj.targetLevel,
        projectedLevel: obj.targetLevel
      }))
      .filter((obj) => obj.importance >= 4)
      .sort((a, b) => {
        if (b.importance !== a.importance) return b.importance - a.importance;
        return (b.targetLevel - b.currentLevel) - (a.targetLevel - a.currentLevel);
      })
      .slice(0, 5);
  }, [reportData.objectiveData, objectiveTargets]);

  // Use executive commentary sections directly from API
  // Sections: current_state, actions_committed, projected_state
  const aiSummarySections = useMemo(() => {
    return aiSections;
  }, [aiSections]);

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
  const printDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const {
    currentScore,
    currentLevel,
    levelName,
    projectedScore,
    projectedLevel,
    objectiveData,
    objectivesByTheme,
    actionCounts,
    commitmentRegister
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
        {/* COVER PAGE - McKinsey/Gartner inspired bottom-heavy layout */}
        <div className="executive-page cover-page print-only">
          {/* Full page flex container - pushes content to bottom */}
          <div className="cover-page-inner">
            {/* Intentional whitespace - top 60% */}
            <div className="cover-whitespace" />

            {/* Content block - bottom 40% */}
            <div className="cover-content">
              {/* Label */}
              <div className="cover-label">
                EXECUTIVE REPORT
              </div>

              {/* Gold underline accent */}
              <div className="cover-underline" />

              {/* Main title */}
              <h1 className="cover-title">
                FP&A Maturity Diagnostic
              </h1>

              {/* Company name - the star */}
              <div className="cover-company">
                {companyName}
              </div>

              {/* Date */}
              <div className="cover-date">
                {new Date(report.finalized_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long'
                })}
              </div>

              {/* Logo */}
              <div className="cover-logo">
                <img
                  src="/Logo horizontal.png"
                  alt="CFO Lens AI"
                  className="h-10 object-contain"
                />
              </div>
            </div>
          </div>
          <PrintFooter pageNumber={1} runId={runId} printDate={printDate} />
        </div>

        {/* PRINT-ONLY DISCLAIMER PAGE */}
        <div className="executive-page p-10 page-break-before print-only">
          <div className="border-b border-slate-200 pb-2 mb-4">
            <h2 className="text-lg font-bold text-slate-800">Confidentiality and Intellectual Property</h2>
          </div>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>
              This report has been prepared by CFO Lens AI for the exclusive use of the client named herein.
              The contents are confidential and proprietary to CFO Lens AI. This report may not be shared
              with third parties, reproduced, or distributed without prior written consent from CFO Lens AI.
              All intellectual property rights in the methodology, framework, and analysis contained herein
              are retained by CFO Lens AI.
            </p>
            <h3 className="text-sm font-semibold text-slate-800">Disclaimer</h3>
            <p>
              This report is based on self-reported assessment data provided by the client. CFO Lens AI
              does not independently verify the accuracy or completeness of client inputs. The analysis,
              scores, and recommendations are generated algorithmically based on these inputs and should
              be considered directional guidance rather than definitive conclusions.
            </p>
            <p>
              CFO Lens AI is not engaged in rendering legal, accounting, tax, or other professional advisory services.
            </p>
            <h3 className="text-sm font-semibold text-slate-800">Limitation of Liability</h3>
            <p>
              CFO Lens AI disclaims all liability for any damages, losses, or claims arising from errors or omissions
              in this report, reliance upon any recommendation made herein, or decisions made based on this analysis.
              This report is provided "as is" without warranty of any kind, express or implied.
            </p>
            <p>
              © 2026 CFO Lens AI. All rights reserved.
            </p>
          </div>
          <PrintFooter pageNumber={2} runId={runId} printDate={printDate} />
        </div>

        {/* PAGE 3: EXECUTIVE SUMMARY */}
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

          <div className="mb-3">
            <h2 className="text-lg font-bold text-slate-800">Overall Results Summary</h2>
            <div className="text-sm text-slate-500">
              You are being evaluated on a scale ranging from L1 (lowest) to L4 (highest).
            </div>
          </div>

          <div className="grid grid-cols-[300px_1fr] gap-4 mb-4">
            <ExecutionSummaryCard
              executionScore={currentScore}
              projectedScore={projectedScore}
              currentLevel={currentLevel}
              projectedLevel={projectedLevel}
              levelName={levelName}
              projectedLevelName={LEVEL_NAMES[projectedLevel]}
            />
            <PriorityObjectivesChart objectives={priorityObjectives} />
          </div>

          <div className="border border-slate-300 p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              AI Summary
            </div>
            {aiStatus === 'complete' && aiSummarySections.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {aiSummarySections.map((section) => (
                  <div key={section.id} className="border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                      {section.title}
                    </div>
                    <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                AI summary is not available yet for this report.
              </div>
            )}
          </div>

          <PrintFooter pageNumber={3} runId={runId} printDate={printDate} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PAGE 4: OBJECTIVE OVERVIEW */}
        <div className="executive-page p-6 page-break-before">
          <div className="border-b border-slate-200 pb-2 mb-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Objective Overview</h2>
            <div className="text-xs text-slate-400 print:hidden">Page 4 - {companyName}</div>
          </div>
          {/* Objective Overview Table */}
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
          <PrintFooter pageNumber={4} runId={runId} printDate={printDate} />
        </div>

        {/* PAGE 5: MATURITY BENCHMARK */}
        <div className="executive-page p-6 page-break-before">
          <div className="border-b border-slate-200 pb-2 mb-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Maturity Benchmark</h2>
            <div className="text-xs text-slate-400 print:hidden">Page 5 - {companyName}</div>
          </div>
          {benchmarkLoading ? (
            <div className="text-slate-500 text-sm">Loading benchmark...</div>
          ) : (
            <BenchmarkTab
              report={report}
              spec={spec}
              benchmarkData={benchmarkData}
              includeCommittedActions={true}
              projectedTargets={projectedTargets}
              projectedTotal={reportData.projectedLevel}
              showPracticeDetails={false}
            />
          )}
          <PrintFooter pageNumber={5} runId={runId} printDate={printDate} />
        </div>

        {/* PAGE 6: ACTION PLAN */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="executive-page p-6 page-break-before">
          <div className="border-b border-slate-200 pb-2 mb-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Action Plan</h2>
            <div className="text-xs text-slate-400 print:hidden">Page 6 - {companyName}</div>
          </div>
          <ActionPlanTable
            commitmentRegister={commitmentRegister}
            actionCounts={actionCounts}
          />
          <PrintFooter pageNumber={6} runId={runId} printDate={printDate} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PAGE 7: PRIORITY MATRIX */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="executive-page p-6 page-break-before priority-matrix-page">
          <div className="border-b border-slate-200 pb-2 mb-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Priority Matrix</h2>
            <div className="text-xs text-slate-400 print:hidden">Page 7 - {companyName}</div>
          </div>
          <div className="priority-matrix-wrap">
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
          <PrintFooter pageNumber={7} runId={runId} printDate={printDate} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PAGE 8: MATURITY FOOTPRINT */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="executive-page p-6 page-break-before">
          <div className="border-b border-slate-200 pb-2 mb-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Maturity Footprint</h2>
            <div className="text-xs text-slate-400 print:hidden">Page 8 - {companyName}</div>
          </div>
          <ObjectivesPracticesOverview
            levels={maturityLevels}
            objectiveScores={objectiveScores}
          />
          <PrintFooter pageNumber={8} runId={runId} printDate={printDate} />
        </div>

        {/* Document Footer */}
        <div className="document-footer p-6 border-t border-slate-200 print:mt-8">
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
            position: relative;
          }

          .print-only {
            display: none;
          }

          .print-footer {
            display: none;
          }

          .cover-accent {
            display: flex;
            width: 100%;
            height: 10px;
          }

          .cover-accent-navy {
            flex: 1;
            background: ${BRAND_COLORS.navy};
          }

          .cover-accent-gold {
            width: 140px;
            background: ${BRAND_COLORS.gold};
          }

          /* Cover page - bottom-heavy McKinsey/Gartner layout */
          .cover-page {
            padding: 0 !important;
            display: flex;
            flex-direction: column;
          }

          .cover-page-inner {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: calc(8.1in - 0.9in);
            position: relative;
          }

          .cover-whitespace {
            flex: 6;
          }

          .cover-content {
            flex: 3;
            padding: 0 60px 40px 60px;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            border-left: 5px solid ${NAVY};
            margin-left: 60px;
            padding-left: 24px;
          }

          .cover-label {
            color: ${GOLD};
            font-size: 16px;
            font-weight: 600;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            margin-bottom: 8px;
          }

          .cover-underline {
            width: 80px;
            height: 3px;
            background: ${GOLD};
            margin-bottom: 20px;
          }

          .cover-title {
            color: ${NAVY};
            font-size: 43px;
            font-weight: 700;
            margin: 0 0 12px 0;
            line-height: 1.2;
          }

          .cover-company {
            color: #334155;
            font-size: 29px;
            font-weight: 600;
            margin-bottom: 8px;
          }

          .cover-date {
            color: #64748b;
            font-size: 18px;
            margin-bottom: 24px;
          }

          .cover-logo {
            margin-bottom: 0;
          }

          .cover-logo img {
            height: 53px;
            object-fit: contain;
          }

          /* Print styles */
          @media print {
            @page {
              size: landscape;
              margin: 0.2in 0.4in;
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
              padding-bottom: 0.9in;
              min-height: 8.1in;
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

            .print-only {
              display: block;
            }

            /* Cover page print overrides */
            .cover-page {
              padding: 0 !important;
              padding-bottom: 0.9in !important;
            }

            .cover-page-inner {
              height: calc(8.1in - 0.9in);
              min-height: calc(8.1in - 0.9in);
            }

            .cover-content {
              border-left: 5px solid ${NAVY};
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .cover-label,
            .cover-underline {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .print-footer {
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              gap: 12px;
              position: absolute;
              bottom: -0.5in;
              left: 0.4in;
              right: 0.4in;
            }

            .print-footer-left-row {
              display: flex;
              align-items: baseline;
              gap: 8px;
            }

            .print-footer-center {
              text-align: center;
              flex: 1;
            }

            .print-footer-right {
              text-align: right;
              min-width: 140px;
            }

            .print-footer-right img {
              display: block;
              margin-left: auto;
            }

            .document-footer {
              display: none;
            }

            .objective-table {
              font-size: 11px;
              break-inside: avoid;
            }

            .objective-table th,
            .objective-table td {
              padding-top: 4px;
              padding-bottom: 4px;
            }

            .benchmark-axis-tick {
              transform: translateY(0) !important;
            }

            .priority-matrix-page {
              padding: 0.35in 0.4in 0.9in !important;
            }

            .priority-matrix-page .matrix-grid {
              transform: scale(0.93);
              transform-origin: top left;
            }

            .priority-matrix-page .matrix-cell {
              min-height: 80px !important;
              padding: 6px !important;
            }

            .priority-matrix-page .priority-matrix-wrap {
              padding-bottom: 0.15in;
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
