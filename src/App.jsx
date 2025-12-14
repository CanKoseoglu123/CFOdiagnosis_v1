import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, ChevronRight, Target, TrendingUp, Shield, Zap, ArrowRight, Info } from "lucide-react";

const MOCK_REPORT = {
  run_id: "demo-run-001",
  spec_version: "v2.6.4",
  generated_at: new Date().toISOString(),
  overall_score: 0.42,
  maturity: {
    achieved_level: 1,
    achieved_label: "Emerging",
    blocking_level: 2,
    blocking_evidence_ids: ["fpa_variance_analysis", "fpa_rolling_forecast"],
    gates: [
      { level: 0, label: "Ad-hoc", required_evidence_ids: [] },
      { level: 1, label: "Emerging", required_evidence_ids: ["fpa_annual_budget", "fpa_budget_owner"] },
      { level: 2, label: "Defined", required_evidence_ids: ["fpa_variance_analysis", "fpa_rolling_forecast"] },
      { level: 3, label: "Managed", required_evidence_ids: ["fpa_driver_based", "fpa_scenario_modeling"] },
      { level: 4, label: "Optimized", required_evidence_ids: ["fpa_integrated_planning", "fpa_predictive"] },
    ],
  },
  critical_risks: [{
    evidence_id: "fpa_budget_owner",
    question_text: "Is there a single person accountable for owning and maintaining the budget process?",
    pillar_id: "fpa",
    user_answer: false,
  }],
  pillars: [{
    pillar_id: "fpa",
    pillar_name: "Financial Planning & Analysis",
    score: 0.42,
    scored_questions: 8,
    total_questions: 8,
    maturity: {
      achieved_level: 1,
      achieved_label: "Emerging",
      blocking_level: 2,
      blocking_evidence_ids: ["fpa_variance_analysis", "fpa_rolling_forecast"],
      gates: [
        { level: 0, label: "Ad-hoc", required_evidence_ids: [] },
        { level: 1, label: "Emerging", required_evidence_ids: ["fpa_annual_budget", "fpa_budget_owner"] },
        { level: 2, label: "Defined", required_evidence_ids: ["fpa_variance_analysis", "fpa_rolling_forecast"] },
        { level: 3, label: "Managed", required_evidence_ids: ["fpa_driver_based", "fpa_scenario_modeling"] },
        { level: 4, label: "Optimized", required_evidence_ids: ["fpa_integrated_planning", "fpa_predictive"] },
      ],
    },
    critical_risks: [{
      evidence_id: "fpa_budget_owner",
      question_text: "Is there a single person accountable for owning and maintaining the budget process?",
      pillar_id: "fpa",
      user_answer: false,
    }],
  }],
  actions: [
    { id: "act_assign_budget_owner", title: "Assign a Budget Process Owner", description: "Designate a single individual (typically in Finance) who is accountable for the end-to-end budget process, including timeline, templates, consolidation, and stakeholder coordination.", rationale: "Distributed ownership leads to inconsistent assumptions, missed deadlines, and gaps in coverage. A single owner ensures process integrity and accountability.", priority: "critical", trigger_type: "critical_risk", evidence_id: "fpa_budget_owner", pillar_id: "fpa" },
    { id: "act_implement_variance", title: "Implement Monthly Variance Analysis", description: "Establish a monthly close process that compares actual results to budget. Document significant variances (typically >5% or >$X threshold) with explanations and corrective actions.", rationale: "Variance analysis transforms the budget from a static document into a management tool. It enables early detection of problems and creates accountability for results.", priority: "high", trigger_type: "maturity_blocker", evidence_id: "fpa_variance_analysis", pillar_id: "fpa" },
    { id: "act_implement_forecast", title: "Implement Rolling Forecasts", description: "Move beyond the static annual budget by maintaining a rolling forecast that extends 4-6 quarters ahead and is updated at least quarterly.", rationale: "Annual budgets become stale quickly. Rolling forecasts provide leadership with a continuously updated view of expected performance.", priority: "high", trigger_type: "maturity_blocker", evidence_id: "fpa_rolling_forecast", pillar_id: "fpa" },
  ],
};

const formatScore = (score) => score === null || score === undefined ? "—" : `${Math.round(score * 100)}%`;
const formatDate = (iso) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const colors = {
  priority: { critical: { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" }, high: { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" }, medium: { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" } },
  maturity: [
    { bg: "#FEE2E2", text: "#991B1B", accent: "#EF4444" },
    { bg: "#FEF3C7", text: "#92400E", accent: "#F59E0B" },
    { bg: "#FEF9C3", text: "#854D0E", accent: "#EAB308" },
    { bg: "#DCFCE7", text: "#166534", accent: "#22C55E" },
    { bg: "#DBEAFE", text: "#1E40AF", accent: "#3B82F6" },
  ]
};

const ScoreRing = ({ score, size = 64 }) => {
  const r = (size - 8) / 2, c = 2 * Math.PI * r, o = c - (score || 0) * c;
  const color = score === null ? "#9CA3AF" : score >= 0.8 ? "#22C55E" : score >= 0.6 ? "#EAB308" : score >= 0.4 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8" strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round" style={{ transition: "all 0.8s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.22, color: "#111827" }}>{formatScore(score)}</div>
    </div>
  );
};

const MaturityLadder = ({ maturity }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    {[...maturity.gates].reverse().map((gate) => {
      const achieved = gate.level <= maturity.achieved_level, current = gate.level === maturity.achieved_level, next = gate.level === maturity.achieved_level + 1;
      const c = colors.maturity[gate.level] || colors.maturity[0];
      return (
        <div key={gate.level} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: achieved ? c.bg : "#F9FAFB", border: `2px solid ${current ? c.accent : achieved ? c.bg : "#E5E7EB"}`, opacity: achieved ? 1 : 0.5, transition: "all 0.3s" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: achieved ? c.accent : "#D1D5DB", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontWeight: 700, fontSize: 13 }}>
            {achieved ? <CheckCircle size={18} /> : gate.level}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: achieved ? c.text : "#6B7280", fontSize: 14 }}>Level {gate.level}: {gate.label}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>{gate.required_evidence_ids.length} requirements</div>
          </div>
          {current && <span style={{ background: c.accent, color: "#FFF", padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Current</span>}
          {next && <span style={{ background: "#E5E7EB", color: "#6B7280", padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Next</span>}
        </div>
      );
    })}
  </div>
);

const RiskCard = ({ risk }) => (
  <div style={{ padding: 14, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, borderLeft: "4px solid #EF4444" }}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <AlertTriangle size={14} color="#DC2626" />
      </div>
      <div>
        <div style={{ fontWeight: 600, color: "#991B1B", fontSize: 12, marginBottom: 2 }}>Critical Risk</div>
        <div style={{ color: "#7F1D1D", fontSize: 13, lineHeight: 1.5 }}>{risk.question_text}</div>
      </div>
    </div>
  </div>
);

const ActionCard = ({ action, index }) => {
  const [open, setOpen] = useState(false);
  const c = colors.priority[action.priority] || colors.priority.medium;
  return (
    <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", boxShadow: open ? "0 4px 12px rgba(0,0,0,0.06)" : "none" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", borderBottom: open ? "1px solid #E5E7EB" : "none" }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: c.text, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{index + 1}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{action.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ background: c.bg, color: c.text, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>{action.priority}</span>
            <span style={{ fontSize: 11, color: "#6B7280" }}>{action.trigger_type === "critical_risk" ? "Resolves critical risk" : "Unlocks next level"}</span>
          </div>
        </div>
        <ChevronRight size={18} color="#9CA3AF" style={{ transform: open ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s" }} />
      </div>
      {open && (
        <div style={{ padding: "14px 16px", background: "#F9FAFB" }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>What to do</div>
            <div style={{ color: "#374151", fontSize: 13, lineHeight: 1.6 }}>{action.description}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Why it matters</div>
            <div style={{ color: "#374151", fontSize: 13, lineHeight: 1.6 }}>{action.rationale}</div>
          </div>
        </div>
      )}
    </div>
  );
};

const Section = ({ icon: Icon, title, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      {Icon && <div style={{ width: 30, height: 30, borderRadius: 8, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={16} color="#4F46E5" /></div>}
      <h2 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: 0 }}>{title}</h2>
    </div>
    {children}
  </div>
);

const PillarCard = ({ pillar }) => {
  const c = colors.maturity[pillar.maturity.achieved_level] || colors.maturity[0];
  return (
    <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 4px 0" }}>{pillar.pillar_name}</h3>
          <div style={{ fontSize: 12, color: "#6B7280" }}>{pillar.scored_questions}/{pillar.total_questions} questions</div>
        </div>
        <ScoreRing score={pillar.score} size={60} />
      </div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", background: c.bg, borderRadius: 8, marginBottom: 12 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: c.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: 10, fontWeight: 700 }}>{pillar.maturity.achieved_level}</div>
        <span style={{ fontWeight: 600, color: c.text, fontSize: 13 }}>{pillar.maturity.achieved_label}</span>
      </div>
      {pillar.critical_risks.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#DC2626", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>
          <AlertTriangle size={12} /> {pillar.critical_risks.length} Critical Risk{pillar.critical_risks.length > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
};

export default function FinanceDiagnosticReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => { setTimeout(() => { setReport(MOCK_REPORT); setLoading(false); }, 500); }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #E5E7EB", borderTopColor: "#4F46E5", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ color: "#6B7280", fontSize: 13 }}>Loading report...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!report) return null;
  const mc = colors.maturity[report.maturity.achieved_level] || colors.maturity[0];

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#0F172A", color: "#FFF", padding: "24px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8", marginBottom: 6 }}>Finance Diagnostic</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px 0" }}>Maturity Assessment Report</h1>
          <div style={{ fontSize: 12, color: "#94A3B8" }}>Generated {formatDate(report.generated_at)} • Spec {report.spec_version}</div>
        </div>
      </header>

      {/* Summary */}
      <div style={{ background: "#FFF", borderBottom: "1px solid #E5E7EB", padding: "20px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <ScoreRing score={report.overall_score} size={60} />
            <div><div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase" }}>Execution</div><div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{formatScore(report.overall_score)}</div></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: 10, background: mc.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 18, fontWeight: 700, color: mc.accent }}>L{report.maturity.achieved_level}</span></div>
            <div><div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase" }}>Maturity</div><div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{report.maturity.achieved_label}</div></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: 10, background: report.critical_risks.length > 0 ? "#FEE2E2" : "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {report.critical_risks.length > 0 ? <AlertTriangle size={22} color="#DC2626" /> : <Shield size={22} color="#16A34A" />}
            </div>
            <div><div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase" }}>Critical Risks</div><div style={{ fontSize: 20, fontWeight: 700, color: report.critical_risks.length > 0 ? "#DC2626" : "#16A34A" }}>{report.critical_risks.length}</div></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}><Zap size={22} color="#4F46E5" /></div>
            <div><div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase" }}>Actions</div><div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{report.actions.length}</div></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#FFF", borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", display: "flex" }}>
          {["overview", "maturity", "actions", "pillars"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "14px 18px", fontSize: 13, fontWeight: 500, color: tab === t ? "#4F46E5" : "#6B7280", background: "transparent", border: "none", borderBottom: `2px solid ${tab === t ? "#4F46E5" : "transparent"}`, cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>
        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
            <div>
              {report.critical_risks.length > 0 && (
                <Section icon={AlertTriangle} title="Critical Risks">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{report.critical_risks.map((r, i) => <RiskCard key={i} risk={r} />)}</div>
                </Section>
              )}
              <Section icon={Zap} title="Priority Actions">
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{report.actions.slice(0, 3).map((a, i) => <ActionCard key={a.id} action={a} index={i} />)}</div>
                {report.actions.length > 3 && <button onClick={() => setTab("actions")} style={{ marginTop: 14, width: "100%", padding: "12px", background: "#F3F4F6", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, color: "#374151", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>View all {report.actions.length} actions <ArrowRight size={14} /></button>}
              </Section>
            </div>
            <div>
              <Section icon={TrendingUp} title="Maturity Progress">
                <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20 }}>
                  <MaturityLadder maturity={report.maturity} />
                  {report.maturity.blocking_level && (
                    <div style={{ marginTop: 18, padding: 14, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><Info size={14} color="#D97706" /><span style={{ fontWeight: 600, color: "#92400E", fontSize: 13 }}>Path to Level {report.maturity.blocking_level}</span></div>
                      <div style={{ color: "#78350F", fontSize: 12, lineHeight: 1.5 }}>Complete {report.maturity.blocking_evidence_ids.length} remaining requirement{report.maturity.blocking_evidence_ids.length > 1 ? "s" : ""} to advance.</div>
                    </div>
                  )}
                </div>
              </Section>
            </div>
          </div>
        )}

        {tab === "maturity" && (
          <Section icon={TrendingUp} title="Maturity Assessment">
            <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 14, padding: 24, maxWidth: 500 }}>
              <MaturityLadder maturity={report.maturity} />
            </div>
            {report.maturity.blocking_evidence_ids.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 12 }}>Requirements for Level {report.maturity.blocking_level}</h3>
                <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 14, padding: 16, maxWidth: 500 }}>
                  {report.maturity.blocking_evidence_ids.map((e, i) => (
                    <div key={e} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#FEF3C7", borderRadius: 8, marginBottom: i < report.maturity.blocking_evidence_ids.length - 1 ? 10 : 0 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#FDE68A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#92400E" }}>{i + 1}</div>
                      <code style={{ fontSize: 12, color: "#92400E", fontFamily: "monospace" }}>{e}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {tab === "actions" && (
          <Section icon={Zap} title="Action Plan">
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 700 }}>{report.actions.map((a, i) => <ActionCard key={a.id} action={a} index={i} />)}</div>
            {report.actions.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, background: "#FFF", borderRadius: 14, border: "1px solid #E5E7EB" }}>
                <CheckCircle size={40} color="#22C55E" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 6 }}>All caught up!</div>
                <div style={{ color: "#6B7280", fontSize: 13 }}>No outstanding actions.</div>
              </div>
            )}
          </Section>
        )}

        {tab === "pillars" && (
          <Section icon={Target} title="Pillar Breakdown">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>{report.pillars.map((p) => <PillarCard key={p.pillar_id} pillar={p} />)}</div>
          </Section>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "20px 0", marginTop: 40, background: "#FFF" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B7280" }}>
          <span>Finance Diagnostic Platform • {report.spec_version}</span>
          <span>{formatDate(report.generated_at)}</span>
        </div>
      </footer>
    </div>
  );
}
