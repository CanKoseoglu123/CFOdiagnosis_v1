// src/components/report/FinalReportTab.jsx
// VS-32: Executive Diagnostic Report - Print-first, 2-page audit memo
// Format: Landscape, high-density, no visual fluff
// Mental model: "Forward to CEO without explanation"

import React, { useMemo } from 'react';

// Objective theme mapping
const OBJECTIVE_THEME_MAP = {
  'obj_budget_discipline': 'Foundation',
  'obj_financial_controls': 'Foundation',
  'obj_performance_monitoring': 'Foundation',
  'obj_forecasting_agility': 'Future',
  'obj_driver_based_planning': 'Future',
  'obj_scenario_modeling': 'Future',
  'obj_strategic_influence': 'Intelligence',
  'obj_decision_support': 'Intelligence',
  'obj_operational_excellence': 'Intelligence',
  // Legacy IDs
  'obj_fpa_l1_budget': 'Foundation',
  'obj_fpa_l1_control': 'Foundation',
  'obj_fpa_l2_variance': 'Foundation',
  'obj_fpa_l2_forecast': 'Future',
  'obj_fpa_l3_driver': 'Future',
  'obj_fpa_l3_scenario': 'Intelligence',
  'obj_fpa_l4_integrate': 'Intelligence',
  'obj_fpa_l4_predict': 'Intelligence'
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

// Timeline Journey visualization component
// Shows: Today → 6m → 12m → 24m with progressive bars
function TimelineJourney({ today, at6m, at12m, at24m }) {
  // Each milestone bar shows the delta from previous milestone
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
          {/* Score indicator */}
          <div className="flex flex-col items-center w-11">
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
          {/* Arrow connector */}
          {idx < milestones.length - 1 && (
            <div className="text-slate-300 text-xs">→</div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function FinalReportTab({
  runId,
  report,
  actionPlan = {},
  objectives = [],
  questions = [],
  initiatives = [],
  companyName,
  industry
}) {
  // ─────────────────────────────────────────────────────────────────────────────
  // DATA COMPUTATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  // Current state metrics
  const maturityV2 = report?.maturity_v2 || {};
  const currentScore = maturityV2.execution_score ?? Math.round((report?.overall_score || 0) * 100);
  const currentLevel = maturityV2.actual_level ?? report?.maturity?.achieved_level ?? 1;
  const levelName = ['', 'Emerging', 'Defined', 'Managed', 'Optimized'][currentLevel] || 'Emerging';

  // Critical failures
  const criticalRisks = report?.critical_risks || [];
  const failedCriticalCount = criticalRisks.length;

  // Build objective data with milestone scores (Today → 6m → 12m → 24m)
  const objectiveData = useMemo(() => {
    const calibration = report?.calibration?.importance_map || {};

    return (report?.objectives || []).map(obj => {
      const objId = obj.id || obj.objective_id;
      const score = Math.round(obj.score || 0);
      const importance = calibration[objId] || 3;
      const theme = OBJECTIVE_THEME_MAP[objId] || 'Intelligence';

      // Determine status
      let status = 'opportunity';
      if (score >= 80) status = 'strength';
      else if (score < 40 || criticalRisks.some(r => r.objective_id === objId)) status = 'critical';

      // Calculate milestone scores based on committed actions by timeline
      const objQuestions = questions.filter(q => q.objective_id === objId);
      const totalQuestions = objQuestions.length || 1;

      // Count actions by timeline for this objective
      const actions6m = objQuestions.filter(q => actionPlan[q.id]?.timeline === '6m').length;
      const actions12m = objQuestions.filter(q => actionPlan[q.id]?.timeline === '12m').length;
      const actions24m = objQuestions.filter(q => actionPlan[q.id]?.timeline === '24m').length;

      // Calculate cumulative scores at each milestone
      const scorePerAction = Math.round(100 / totalQuestions);
      const score6m = Math.min(100, score + (actions6m * scorePerAction));
      const score12m = Math.min(100, score6m + (actions12m * scorePerAction));
      const score24m = Math.min(100, score12m + (actions24m * scorePerAction));

      return {
        id: objId,
        name: obj.objective_name || obj.title || obj.name || objId,
        theme,
        importance,
        today: score,
        at6m: score6m,
        at12m: score12m,
        at24m: score24m,
        status
      };
    });
  }, [report, actionPlan, questions, criticalRisks]);

  // Group objectives by theme
  const objectivesByTheme = useMemo(() => {
    const groups = { Foundation: [], Future: [], Intelligence: [] };
    objectiveData.forEach(obj => {
      if (groups[obj.theme]) {
        groups[obj.theme].push(obj);
      }
    });
    return groups;
  }, [objectiveData]);

  // Action counts by timeline
  const actionCounts = useMemo(() => {
    const counts = { total: 0, '6m': 0, '12m': 0, '24m': 0, withOwner: 0, withTimeline: 0 };
    Object.entries(actionPlan).forEach(([, a]) => {
      counts.total++;
      if (a.timeline === '6m') counts['6m']++;
      else if (a.timeline === '12m') counts['12m']++;
      else if (a.timeline === '24m') counts['24m']++;
      if (a.assigned_owner) counts.withOwner++;
      if (a.timeline) counts.withTimeline++;
    });
    return counts;
  }, [actionPlan]);

  // Projected scores (24 months)
  const projectedScore = useMemo(() => {
    const totalQuestions = questions.length || 48;
    const inputMap = new Map((report?.inputs || []).map(i => [i.question_id, i.value]));
    const currentYes = questions.filter(q => inputMap.get(q.id) === true).length;
    const projectedYes = questions.filter(q => inputMap.get(q.id) === true || actionPlan[q.id]).length;
    return Math.round((projectedYes / totalQuestions) * 100);
  }, [questions, report, actionPlan]);

  // Projected level
  const projectedLevel = useMemo(() => {
    if (projectedScore >= 85) return 4;
    if (projectedScore >= 65) return 3;
    if (projectedScore >= 45) return 2;
    return 1;
  }, [projectedScore]);

  // Confidence based on coverage
  const confidence = useMemo(() => {
    const objectivesWithActions = new Set();
    Object.keys(actionPlan).forEach(qId => {
      const q = questions.find(q => q.id === qId);
      if (q?.objective_id) objectivesWithActions.add(q.objective_id);
    });
    const coverage = objectivesWithActions.size / (objectives.length || 1);
    if (coverage >= 0.7) return 'High';
    if (coverage >= 0.4) return 'Medium';
    return 'Low';
  }, [actionPlan, questions, objectives]);

  // One-line diagnosis
  const diagnosis = useMemo(() => {
    if (currentLevel >= 3 && failedCriticalCount === 0) {
      return 'Strong foundation with mature practices. Focus on optimization and predictive capabilities.';
    }
    if (currentLevel >= 2 && failedCriticalCount <= 2) {
      return 'Foundation established, execution uneven beyond budgeting. Address critical gaps to unlock Level 3.';
    }
    if (failedCriticalCount > 2) {
      return 'Multiple critical gaps blocking maturity progression. Immediate remediation required.';
    }
    return 'Early-stage finance function. Prioritize foundational controls before advancing.';
  }, [currentLevel, failedCriticalCount]);

  // Strengths (objectives >= 80%)
  const strengths = objectiveData.filter(o => o.today >= 80).slice(0, 3);

  // Critical fixes (failed criticals)
  const criticalFixes = criticalRisks.slice(0, 5).map(r => ({
    id: r.evidence_id || r.question_id,
    title: r.expert_action?.title || r.title || 'Address critical gap'
  }));

  // Top opportunities (highest importance × uplift)
  const topOpportunities = useMemo(() => {
    return objectiveData
      .filter(o => o.status !== 'strength')
      .map(o => ({
        ...o,
        uplift: o.at24m - o.today,
        upliftScore: o.importance * (o.at24m - o.today)
      }))
      .sort((a, b) => b.upliftScore - a.upliftScore)
      .slice(0, 3);
  }, [objectiveData]);

  // Build commitment register
  const commitmentRegister = useMemo(() => {
    // Group by objective
    const byObjective = {};
    Object.entries(actionPlan).forEach(([questionId, plan]) => {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      const objId = question.objective_id;
      const objective = objectives.find(o => o.id === objId);
      const objName = objective?.title || objective?.name || objId;

      if (!byObjective[objId]) {
        byObjective[objId] = {
          objectiveId: objId,
          objectiveName: objName,
          actions: []
        };
      }

      byObjective[objId].actions.push({
        id: questionId,
        title: question.text || question.title || 'Action item',
        timeline: plan.timeline,
        owner: plan.assigned_owner,
        isCritical: question.is_critical || false
      });
    });

    return Object.values(byObjective);
  }, [actionPlan, questions, objectives]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  const runDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-white print:bg-white executive-report-landscape">
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* PAGE 1 — CURRENT STATE → TARGET STATE */}
      {/* Note: Uses parent ChapterHeader for document identity (no competing header) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="print:page-break-after-always min-h-[600px]">
        {/* Main Content */}
        <div className="px-6 py-5 space-y-5">
          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* STATE COMPARISON BLOCK */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            {/* Current State */}
            <div className="border border-slate-300 p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Current State
              </div>
              <div className="flex items-baseline gap-4 mb-3">
                <div>
                  <div className="text-3xl font-bold text-slate-800">{currentScore}%</div>
                  <div className="text-xs text-slate-500">Execution</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-700">L{currentLevel}</div>
                  <div className="text-xs text-slate-500">{levelName}</div>
                </div>
                <div>
                  <div className={`text-xl font-bold ${failedCriticalCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {failedCriticalCount}
                  </div>
                  <div className="text-xs text-slate-500">Critical</div>
                </div>
              </div>
              <div className="text-xs text-slate-600 border-t border-slate-200 pt-2">
                {diagnosis}
              </div>
            </div>

            {/* Maturity Development - Level Progression */}
            <div className="border border-slate-300 p-4 bg-blue-50 flex flex-col items-center justify-center">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Maturity Development (24 Months)
              </div>
              <div className="flex items-center gap-2">
                {/* Current Level */}
                <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center border-2 border-slate-400">
                  <span className="text-xl font-bold text-slate-700">L{currentLevel}</span>
                </div>
                {/* Arrow */}
                <div className="text-3xl text-blue-500 font-bold px-2">→</div>
                {/* Target Level */}
                <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center border-2 border-blue-700">
                  <span className="text-xl font-bold text-white">L{projectedLevel}</span>
                </div>
              </div>
            </div>

            {/* Target State (24 Months) */}
            <div className="border border-slate-300 p-4 bg-slate-50">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Target State (24 Months)
              </div>
              <div className="flex items-baseline gap-4 mb-3">
                <div>
                  <div className="text-3xl font-bold text-slate-800">{projectedScore}%</div>
                  <div className="text-xs text-slate-500">Execution</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-700">L{projectedLevel}</div>
                  <div className="text-xs text-slate-500">
                    {['', 'Emerging', 'Defined', 'Managed', 'Optimized'][projectedLevel]}
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-600 border-t border-slate-200 pt-2">
                <div><strong>{actionCounts.total}</strong> committed actions</div>
                <div>Confidence: <strong>{confidence}</strong></div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* ROADMAP BAR */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <div className="border border-slate-300 p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Implementation Roadmap
            </div>
            <div className="flex items-center">
              <div className="flex-1 flex items-center">
                {/* 6 Months */}
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-slate-700">{actionCounts['6m']}</div>
                  <div className="text-xs text-slate-500">6 Months</div>
                  <div className="h-2 bg-blue-600 mt-2" style={{ width: `${Math.max(10, actionCounts['6m'] * 8)}%`, margin: '0 auto' }} />
                </div>
                <div className="text-slate-300 px-2">│</div>
                {/* 12 Months */}
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-slate-700">{actionCounts['12m']}</div>
                  <div className="text-xs text-slate-500">12 Months</div>
                  <div className="h-2 bg-blue-500 mt-2" style={{ width: `${Math.max(10, actionCounts['12m'] * 8)}%`, margin: '0 auto' }} />
                </div>
                <div className="text-slate-300 px-2">│</div>
                {/* 24 Months */}
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-slate-700">{actionCounts['24m']}</div>
                  <div className="text-xs text-slate-500">24 Months</div>
                  <div className="h-2 bg-blue-400 mt-2" style={{ width: `${Math.max(10, actionCounts['24m'] * 8)}%`, margin: '0 auto' }} />
                </div>
              </div>
              <div className="ml-6 text-right border-l border-slate-200 pl-6">
                <div className="text-2xl font-bold text-slate-800">{actionCounts.total}</div>
                <div className="text-xs text-slate-500">Total Actions</div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* OBJECTIVE TABLE with Timeline Journey */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <div className="border border-slate-300">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="text-left px-3 py-2 font-semibold text-slate-700">Objective</th>
                  <th className="text-center px-3 py-2 font-semibold text-slate-700 w-20">Priority</th>
                  <th className="text-center px-3 py-2 font-semibold text-slate-700" style={{ width: '260px' }}>
                    Execution Journey
                  </th>
                  <th className="text-center px-3 py-2 font-semibold text-slate-700 w-20">Status</th>
                </tr>
              </thead>
              <tbody>
                {['Foundation', 'Future', 'Intelligence'].map(theme => (
                  <React.Fragment key={theme}>
                    {/* Theme Header */}
                    <tr className="bg-slate-50">
                      <td colSpan={4} className="px-3 py-1.5 text-xs font-bold text-slate-600 uppercase tracking-wide">
                        {theme}
                      </td>
                    </tr>
                    {/* Objectives */}
                    {objectivesByTheme[theme]?.map(obj => (
                      <tr
                        key={obj.id}
                        className={`border-b border-slate-200 ${obj.status === 'critical' ? 'border-l-2 border-l-red-500' : ''}`}
                      >
                        <td className="px-3 py-2 text-slate-700">{obj.name}</td>
                        <td className="px-3 py-2 text-center">
                          <ImportanceDots level={obj.importance} />
                        </td>
                        <td className="px-3 py-2">
                          <TimelineJourney
                            today={obj.today}
                            at6m={obj.at6m}
                            at12m={obj.at12m}
                            at24m={obj.at24m}
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <StatusBadge status={obj.status} />
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* BOTTOM BAND: Strengths | Critical Fixes | Top Opportunities */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            {/* Strengths */}
            <div className="border border-slate-300 p-3">
              <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
                Strengths
              </div>
              {strengths.length > 0 ? (
                <ul className="text-xs text-slate-600 space-y-1">
                  {strengths.map(s => (
                    <li key={s.id}>• {s.name} ({s.today}%)</li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-slate-400 italic">No objectives above 80%</div>
              )}
            </div>

            {/* Critical Fixes */}
            <div className="border border-slate-300 p-3 border-l-2 border-l-red-500">
              <div className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">
                Critical Fixes
              </div>
              {criticalFixes.length > 0 ? (
                <ul className="text-xs text-slate-600 space-y-1">
                  {criticalFixes.map(c => (
                    <li key={c.id}>• {c.title}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-emerald-600">No critical failures</div>
              )}
            </div>

            {/* Top Opportunities */}
            <div className="border border-slate-300 p-3">
              <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
                Top Opportunities
              </div>
              {topOpportunities.length > 0 ? (
                <ul className="text-xs text-slate-600 space-y-1">
                  {topOpportunities.map(o => (
                    <li key={o.id}>• {o.name} (+{o.uplift}%)</li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-slate-400 italic">All objectives performing well</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* PAGE 2 — COMMITMENT REGISTER */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="print:page-break-before-always px-6 py-5">
        {/* Page 2 Section Header (inline, not competing with parent ChapterHeader) */}
        <div className="border-b border-slate-200 pb-3 mb-4">
          <div className="text-lg font-bold text-slate-800">Commitment Register</div>
          <div className="text-xs text-slate-500">Page 2 of 2 · {runDate}</div>
        </div>

        {/* Register Content */}
        <div className="space-y-4">
          {commitmentRegister.length > 0 ? (
            <>
              {/* Commitment Table */}
              <div className="border border-slate-300">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300">
                      <th className="text-left px-3 py-2 font-semibold text-slate-700">Action</th>
                      <th className="text-center px-3 py-2 font-semibold text-slate-700 w-28">Owner</th>
                      <th className="text-center px-3 py-2 font-semibold text-slate-700 w-24">Timeline</th>
                      <th className="text-center px-3 py-2 font-semibold text-slate-700 w-20">Critical</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commitmentRegister.map(group => (
                      <React.Fragment key={group.objectiveId}>
                        {/* Objective Header */}
                        <tr className="bg-slate-50">
                          <td colSpan={4} className="px-3 py-1.5 text-xs font-bold text-slate-600">
                            Objective: {group.objectiveName}
                          </td>
                        </tr>
                        {/* Actions */}
                        {group.actions.slice(0, 5).map((action, idx) => (
                          <tr key={action.id} className="border-b border-slate-200">
                            <td className="px-3 py-2 text-slate-700 pl-6">
                              {idx + 1}. {action.title}
                            </td>
                            <td className="px-3 py-2 text-center text-slate-600">
                              {action.owner || <span className="text-slate-400">—</span>}
                            </td>
                            <td className="px-3 py-2 text-center text-slate-600">
                              {action.timeline ? `${action.timeline.replace('m', ' mo')}` : <span className="text-slate-400">—</span>}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {action.isCritical ? <span className="text-red-600 font-bold">✔</span> : '—'}
                            </td>
                          </tr>
                        ))}
                        {group.actions.length > 5 && (
                          <tr className="border-b border-slate-200">
                            <td colSpan={4} className="px-3 py-1 pl-6 text-xs text-slate-400 italic">
                              (+{group.actions.length - 5} more actions)
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Accountability Footer */}
              <div className="border border-slate-300 p-4 bg-slate-50">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Accountability Summary
                </div>
                <div className="grid grid-cols-3 gap-6 mb-4">
                  <div>
                    <div className="text-2xl font-bold text-slate-700">
                      {actionCounts.withOwner} / {actionCounts.total}
                    </div>
                    <div className="text-xs text-slate-500">Owners assigned</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-700">
                      {actionCounts.withTimeline} / {actionCounts.total}
                    </div>
                    <div className="text-xs text-slate-500">Timelines assigned</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-700">
                      {criticalFixes.filter(c => actionPlan[c.id]).length} / {criticalFixes.length}
                    </div>
                    <div className="text-xs text-slate-500">Critical fixes covered</div>
                  </div>
                </div>
                <div className="text-sm text-slate-600 border-t border-slate-300 pt-3">
                  {actionCounts.withOwner < actionCounts.total ? (
                    <span>
                      Assign owners to remaining {actionCounts.total - actionCounts.withOwner} actions to fully de-risk critical gaps.
                    </span>
                  ) : actionCounts.withTimeline < actionCounts.total ? (
                    <span>
                      Assign timelines to remaining {actionCounts.total - actionCounts.withTimeline} actions to complete the roadmap.
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-medium">
                      All actions have owners and timelines assigned. Ready for execution.
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* No committed actions */
            <div className="border border-slate-300 p-8 text-center">
              <div className="text-slate-400 text-lg mb-2">No Actions Committed</div>
              <div className="text-sm text-slate-500">
                Use the Action Planning tab to select and schedule improvement actions.
              </div>
            </div>
          )}

          {/* Document Footer */}
          <div className="border-t border-slate-200 pt-4 mt-8">
            <div className="flex justify-between text-xs text-slate-400">
              <div>Finance Diagnostic Platform — Executive Report</div>
              <div>Generated {runDate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles + Landscape Visual Hints */}
      <style>{`
        /* Landscape visual hint for on-screen viewing */
        .executive-report-landscape {
          max-width: 1200px;
          margin: 0 auto;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        /* Print: Force landscape orientation */
        @media print {
          @page {
            size: landscape;
            margin: 0.4in;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .executive-report-landscape {
            max-width: none;
            border: none;
            box-shadow: none;
          }

          .print\\:page-break-after-always {
            page-break-after: always;
          }
          .print\\:page-break-before-always {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  );
}
