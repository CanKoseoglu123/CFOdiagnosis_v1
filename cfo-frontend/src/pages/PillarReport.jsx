// src/pages/PillarReport.jsx
// VS-22: Redesigned report with Summary Table + Critical Risks + High Value

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SummaryTable from '../components/report/SummaryTable';
import CriticalRisksCard from '../components/report/CriticalRisksCard';
import HighValueCard from '../components/report/HighValueCard';

const API_URL = import.meta.env.VITE_API_URL;

export default function PillarReport() {
  const { runId } = useParams();
  const { session } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session?.access_token) {
      fetchReport();
    }
  }, [runId, session]);

  async function fetchReport() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/report`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
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

  // Transform objectives data for SummaryTable
  const objectives = (report.objectives || []).map(obj => ({
    id: obj.id || obj.objective_id,
    theme: obj.theme_id === 'foundation' ? 'Foundation'
         : obj.theme_id === 'future' ? 'Future'
         : 'Intelligence',
    objective: obj.title || obj.name,
    importance: report.calibration?.importance_map?.[obj.id || obj.objective_id] || 3,
    locked: report.calibration?.locked?.includes(obj.id || obj.objective_id) || false,
    score: Math.round(obj.score || 0),
    status: (obj.score || 0) >= 80 ? 'green' : (obj.score || 0) >= 50 ? 'yellow' : 'red'
  }));

  // Transform critical risks data
  const criticalRisks = (report.critical_risks || []).map(risk => ({
    id: risk.question_id,
    title: risk.title || risk.question_text,
    action: risk.action || risk.expert_action?.title || 'Address this gap',
    recommendation: risk.recommendation || risk.expert_action?.recommendation || '',
    impact: `Blocks advancement to Level ${(risk.level || 1) + 1}`
  }));

  // Transform initiatives for High Value
  // Use grouped_initiatives if available, otherwise use initiatives
  const rawInitiatives = report.grouped_initiatives || report.initiatives || [];
  const initiatives = rawInitiatives.map(init => ({
    id: init.id || init.initiative_id,
    title: init.title,
    total_score: init.actions?.reduce((sum, a) => sum + (a.score || 0), 0) || 0,
    actions: (init.actions || []).map(a => ({
      title: a.action_title || a.title || a.action_text,
      is_critical: a.is_critical || false
    }))
  }));

  // Calculate totals
  const totalActions = initiatives.reduce((sum, i) => sum + (i.actions?.length || 0), 0);

  // Get maturity data
  const maturityV2 = report.maturity_v2 || {};
  const executionScore = maturityV2.execution_score ?? Math.round((report.overall_score || 0) * 100);
  const actualLevel = maturityV2.actual_level ?? report.maturity?.achieved_level ?? 1;
  const levelName = maturityV2.level_name || ['', 'Emerging', 'Defined', 'Managed', 'Optimized'][actualLevel] || 'Emerging';

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-300">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <h1 className="text-lg font-bold text-slate-800 text-center">
            FP&A Diagnostic Report
          </h1>
          {report.context?.company_name && (
            <p className="text-sm text-slate-500 text-center mt-1">
              {report.context.company_name}
              {report.context.industry && ` - ${report.context.industry}`}
            </p>
          )}
        </div>
      </header>

      {/* Metrics Bar */}
      <div className="bg-white border-b border-slate-300">
        <div className="max-w-5xl mx-auto px-4 py-3 grid grid-cols-4 gap-3">
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
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* Summary Table */}
        <SummaryTable objectives={objectives} />

        {/* Two Column: Critical Risks + High Value */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CriticalRisksCard risks={criticalRisks} />
          <HighValueCard initiatives={initiatives} />
        </div>
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
