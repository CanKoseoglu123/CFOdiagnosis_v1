// src/pages/PillarReport.jsx
// V2.8.0 Enterprise Report Page with Gartner styling

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { AlertTriangle, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getLevelName, LEVEL_THRESHOLDS } from '../data/spec';
import {
  HeaderBar,
  ExecutiveSummary,
  ObjectiveCard,
  PriorityTabs,
  PrioritySectionHeader,
  InitiativeCard,
  MaturityLadder,
  EmptyState,
} from '../components/report';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function PillarReport() {
  const { runId } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef(null);

  // State
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCards, setExpandedCards] = useState(new Set(['P1'])); // P1 expanded by default
  const [activePriority, setActivePriority] = useState('P1');

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Diagnostic-Report-${runId}`,
  });

  // Fetch report data
  useEffect(() => {
    if (!runId) {
      setError('No run ID provided');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(`${API_BASE_URL}/diagnostic-runs/${runId}/report`, {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

        if (!response.ok) throw new Error('Failed to load report');
        const data = await response.json();
        setReport(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [runId]);

  // Toggle initiative expansion
  const toggleCard = (initiativeId) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(initiativeId)) {
        next.delete(initiativeId);
      } else {
        next.add(initiativeId);
      }
      return next;
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-slate-200 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <div className="text-slate-500 text-sm">Loading report...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center p-8 bg-status-red-bg border border-status-red-border rounded-sm">
          <AlertTriangle className="w-10 h-10 text-status-red-text mx-auto mb-4" />
          <div className="text-lg font-semibold text-status-red-text mb-2">Error</div>
          <div className="text-status-red-text mb-4">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-white px-6 py-2 rounded-sm font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  // Extract V2 data
  const maturityV2 = report.maturity_v2 || {};
  const objectives = report.objectives || [];
  const groupedInitiatives = report.grouped_initiatives || [];
  const criticalRisks = report.critical_risks || [];

  // Compute derived values
  const score = maturityV2.execution_score ?? Math.round((report.overall_score || 0) * 100);
  const actualLevel = maturityV2.actual_level ?? report.maturity?.achieved_level ?? 1;
  const potentialLevel = maturityV2.potential_level ?? actualLevel;
  const capped = maturityV2.capped ?? false;
  const cappedBy = maturityV2.capped_by || [];

  // Count actions
  const actionCount = groupedInitiatives.reduce(
    (sum, init) => sum + (init.actions?.length || 0),
    0
  );

  // Count questions
  const questionsTotal = report.pillars?.reduce((sum, p) => sum + (p.total_questions || 0), 0) || 48;
  const questionsAnswered = report.pillars?.reduce((sum, p) => sum + (p.scored_questions || 0), 0) || 0;

  // Group initiatives by priority
  const initiativesByPriority = {
    P1: groupedInitiatives.filter(i => i.priority === 'P1'),
    P2: groupedInitiatives.filter(i => i.priority === 'P2'),
    P3: groupedInitiatives.filter(i => i.priority === 'P3'),
  };

  // Priority counts
  const priorityCounts = {
    P1: initiativesByPriority.P1.length,
    P2: initiativesByPriority.P2.length,
    P3: initiativesByPriority.P3.length,
  };

  // Compute level progress for maturity ladder
  const levelProgress = {};
  for (let level = 1; level <= 4; level++) {
    const levelObjectives = objectives.filter(o => o.level === level);
    const passed = levelObjectives.filter(o => o.status === 'green').length;
    levelProgress[level] = {
      total: levelObjectives.length || 2,
      passed,
    };
  }

  // Render overview tab content
  const renderOverview = () => (
    <>
      {/* Executive Summary */}
      <ExecutiveSummary
        score={score}
        actualLevel={actualLevel}
        potentialLevel={potentialLevel}
        capped={capped}
        cappedBy={cappedBy}
        questionsTotal={questionsTotal}
        questionsAnswered={questionsAnswered}
        criticalCount={criticalRisks.length}
        failedCriticals={criticalRisks.map(r => r.question_text)}
      />

      {/* Priority Actions Section */}
      <section className="mb-6" data-print-card>
        <div className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            PRIORITY ACTIONS
          </h2>
        </div>

        <PriorityTabs
          counts={priorityCounts}
          activeTab={activePriority}
          onTabChange={setActivePriority}
        />

        <div className="mt-4">
          {initiativesByPriority[activePriority].length === 0 ? (
            <EmptyState priority={activePriority} />
          ) : (
            <div className="space-y-3">
              <PrioritySectionHeader
                priority={activePriority}
                count={priorityCounts[activePriority]}
              />
              {initiativesByPriority[activePriority].map(initiative => (
                <InitiativeCard
                  key={initiative.initiative_id}
                  initiative={initiative}
                  expanded={expandedCards.has(initiative.initiative_id)}
                  onToggle={() => toggleCard(initiative.initiative_id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );

  // Render objectives tab content
  const renderObjectives = () => (
    <section className="mb-6">
      <div className="mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          OBJECTIVE HEALTH CHECK
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {objectives.map(objective => (
          <ObjectiveCard
            key={objective.objective_id}
            objective={objective}
          />
        ))}
      </div>
    </section>
  );

  // Render actions tab content
  const renderActions = () => (
    <section className="mb-6">
      <div className="mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          ALL ACTIONS
        </h2>
      </div>

      {['P1', 'P2', 'P3'].map(priority => {
        const initiatives = initiativesByPriority[priority];
        if (initiatives.length === 0) return null;

        return (
          <div key={priority} className="mb-6">
            <PrioritySectionHeader priority={priority} count={initiatives.length} />
            <div className="space-y-3 mt-3">
              {initiatives.map(initiative => (
                <InitiativeCard
                  key={initiative.initiative_id}
                  initiative={initiative}
                  expanded={true}
                  onToggle={() => {}}
                  forPrint={true}
                />
              ))}
            </div>
          </div>
        );
      })}

      {groupedInitiatives.length === 0 && (
        <EmptyState priority="P1" />
      )}
    </section>
  );

  // Render maturity tab content
  const renderMaturity = () => (
    <section className="mb-6">
      <div className="mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          MATURITY LADDER
        </h2>
      </div>

      <div className="max-w-xl">
        <MaturityLadder
          actualLevel={actualLevel}
          potentialLevel={potentialLevel}
          capped={capped}
          levelProgress={levelProgress}
        />
      </div>

      {/* Maturity explanation */}
      <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-sm max-w-xl">
        <h3 className="text-sm font-semibold text-navy mb-2">How Maturity is Calculated</h3>
        <ul className="text-xs text-slate space-y-1">
          <li>Level 1 (Emerging): Pass all L1 critical questions (≥{LEVEL_THRESHOLDS[1]}% execution)</li>
          <li>Level 2 (Defined): Pass L1 + L2 gates (≥{LEVEL_THRESHOLDS[2]}% execution)</li>
          <li>Level 3 (Managed): Pass L1-L3 gates (≥{LEVEL_THRESHOLDS[3]}% execution)</li>
          <li>Level 4 (Optimized): Pass all gates (≥{LEVEL_THRESHOLDS[4]}% execution)</li>
        </ul>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <HeaderBar
        score={score}
        actualLevel={actualLevel}
        criticalCount={criticalRisks.length}
        actionCount={actionCount}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Print button - floating */}
      <button
        onClick={handlePrint}
        className="fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary-hover text-white px-4 py-3 rounded-sm shadow-lg flex items-center gap-2 no-print"
      >
        <Printer className="w-4 h-4" />
        <span className="font-medium text-sm">Download PDF</span>
      </button>

      {/* Main content */}
      <main ref={contentRef} className="max-w-6xl mx-auto px-6 py-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'objectives' && renderObjectives()}
        {activeTab === 'actions' && renderActions()}
        {activeTab === 'maturity' && renderMaturity()}
      </main>

      {/* Print-only: all sections */}
      <div className="print-only">
        <main className="max-w-6xl mx-auto px-6 py-6">
          {/* Print header */}
          <div className="mb-6 pb-4 border-b border-slate-300">
            <h1 className="text-xl font-bold text-navy">FP&A Diagnostic Report</h1>
            {report.context?.company_name && (
              <p className="text-sm text-slate mt-1">
                {report.context.company_name}
                {report.context.industry && ` - ${report.context.industry}`}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Generated {new Date(report.generated_at).toLocaleDateString()}
            </p>
          </div>

          {/* All sections for print */}
          {renderOverview()}
          {objectives.length > 0 && renderObjectives()}
          {renderMaturity()}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-300 bg-white py-4 no-print">
        <div className="max-w-6xl mx-auto px-6 flex justify-between text-xs text-slate-500">
          <span>Finance Diagnostic Platform - {report.spec_version}</span>
          <span>{new Date(report.generated_at).toLocaleDateString()}</span>
        </div>
      </footer>
    </div>
  );
}
