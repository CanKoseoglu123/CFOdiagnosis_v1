import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertTriangle, CheckCircle, ChevronRight, Target, TrendingUp, Shield, Zap, ArrowRight, Info, Home, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { supabase } from './lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
        <div key={gate.level} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: achieved ? c.bg : "#F9FAFB", border: `2px solid ${current ? c.accent : achieved ? c.bg : "#E5E7EB"}`, opacity: achieved ? 1 : 0.5 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: achieved ? c.accent : "#D1D5DB", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontWeight: 700, fontSize: 13 }}>
            {achieved ? <CheckCircle size={18} /> : gate.level}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: achieved ? c.text : "#6B7280", fontSize: 14 }}>Level {gate.level}: {gate.label}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>{gate.required_evidence_ids.length} requirements</div>
          </div>
          {current && <span style={{ background: c.accent, color: "#FFF", padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 700 }}>CURRENT</span>}
          {next && <span style={{ background: "#E5E7EB", color: "#6B7280", padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 700 }}>NEXT</span>}
        </div>
      );
    })}
  </div>
);

const RiskCard = ({ risk }) => (
  <div data-print-card style={{
    padding: 14,
    background: "#FFF",  // VS19: White background for print legibility
    border: "2px solid #DC2626",  // VS19: High-contrast dark red border
    borderRadius: 10,
    borderLeft: "6px solid #991B1B"  // VS19: Thicker, darker left accent
  }}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <AlertTriangle size={18} color="#DC2626" />
      <div>
        <div style={{ fontWeight: 700, color: "#991B1B", fontSize: 12, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {risk.severity || "CRITICAL"} Risk
        </div>
        <div style={{ color: "#7F1D1D", fontSize: 13, fontWeight: 500 }}>{risk.question_text}</div>
        {risk.pillar_name && (
          <div style={{ color: "#9CA3AF", fontSize: 11, marginTop: 4 }}>{risk.pillar_name}</div>
        )}
      </div>
    </div>
  </div>
);

const ActionCard = ({ action, index }) => {
  const [open, setOpen] = useState(false);
  const c = colors.priority[action.priority] || colors.priority.medium;
  return (
    <div data-print-card style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", color: c.text, fontWeight: 700, fontSize: 13 }}>{index + 1}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{action.title}</div>
          <span style={{ background: c.bg, color: c.text, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{action.priority.toUpperCase()}</span>
        </div>
        <ChevronRight size={18} color="#9CA3AF" style={{ transform: open ? "rotate(90deg)" : "rotate(0)" }} />
      </div>
      {open && (
        <div style={{ padding: "14px 16px", background: "#F9FAFB", borderTop: "1px solid #E5E7EB" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>WHAT TO DO</div>
            <div style={{ color: "#374151", fontSize: 13 }}>{action.description}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>WHY IT MATTERS</div>
            <div style={{ color: "#374151", fontSize: 13 }}>{action.rationale}</div>
          </div>
        </div>
      )}
    </div>
  );
};

const PillarCard = ({ pillar }) => {
  const c = colors.maturity[pillar.maturity.achieved_level] || colors.maturity[0];
  return (
    <div data-print-card style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>{pillar.pillar_name}</h3>
          <div style={{ fontSize: 12, color: "#6B7280" }}>{pillar.scored_questions}/{pillar.total_questions} questions</div>
        </div>
        <ScoreRing score={pillar.score} size={60} />
      </div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", background: c.bg, borderRadius: 8 }}>
        <span style={{ fontWeight: 600, color: c.text, fontSize: 13 }}>L{pillar.maturity.achieved_level}: {pillar.maturity.achieved_label}</span>
      </div>
    </div>
  );
};

export default function FinanceDiagnosticReport() {
  const { runId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");
  const contentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Diagnostic-Report-${runId}`,
  });

useEffect(() => {
  if (!runId) {
    setError("No run ID provided");
    setLoading(false);
    return;
  }

  const fetchReport = async () => {
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch(`${API_BASE_URL}/diagnostic-runs/${runId}/report`, {
        headers: {
          ...(token && { "Authorization": `Bearer ${token}` }),
        },
      });
      
      if (!response.ok) throw new Error("Failed to load");
      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  fetchReport();
}, [runId]);


  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", fontFamily: "system-ui" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #E5E7EB", borderTopColor: "#4F46E5", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ color: "#6B7280" }}>Loading report...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", fontFamily: "system-ui" }}>
      <div style={{ textAlign: "center", padding: 40, background: "#FEF2F2", borderRadius: 16, border: "1px solid #FECACA" }}>
        <AlertTriangle size={40} color="#DC2626" style={{ marginBottom: 16 }} />
        <div style={{ fontSize: 18, fontWeight: 600, color: "#991B1B", marginBottom: 8 }}>Error</div>
        <div style={{ color: "#7F1D1D", marginBottom: 16 }}>{error}</div>
        <Link to="/assess" style={{ background: "#4F46E5", color: "#FFF", padding: "12px 24px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>
          Start New Assessment
        </Link>
      </div>
    </div>
  );

  if (!report) return null;
  const mc = colors.maturity[report.maturity.achieved_level] || colors.maturity[0];

  return (
    <div ref={contentRef} style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui" }}>
      <header style={{ background: "#0F172A", color: "#FFF", padding: "24px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "#94A3B8", marginBottom: 6 }}>FINANCE DIAGNOSTIC</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Maturity Assessment Report</h1>
            {report.context?.company_name && (
              <div style={{ fontSize: 14, color: "#E2E8F0", marginTop: 6 }}>
                {report.context.company_name}
                {report.context.industry && <span style={{ color: "#94A3B8" }}> • {report.context.industry}</span>}
              </div>
            )}
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>Generated {formatDate(report.generated_at)} • {report.spec_version}</div>
          </div>
          <div className="no-print" style={{ display: "flex", gap: 12 }}>
            <button onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 6, background: "#16A34A", color: "#FFF", padding: "8px 16px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              <Printer size={16} /> Download PDF
            </button>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 6, background: "#1E293B", color: "#94A3B8", padding: "8px 16px", borderRadius: 8, textDecoration: "none", fontSize: 13 }}>
              <Home size={16} /> Home
            </Link>
            <Link to="/assess" style={{ background: "#4F46E5", color: "#FFF", padding: "8px 16px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 500 }}>
              New Assessment
            </Link>
          </div>
        </div>
      </header>

      <div style={{ background: "#FFF", borderBottom: "1px solid #E5E7EB", padding: "20px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <ScoreRing score={report.overall_score} size={60} />
            <div><div style={{ fontSize: 10, color: "#6B7280" }}>EXECUTION</div><div style={{ fontSize: 20, fontWeight: 700 }}>{formatScore(report.overall_score)}</div></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: 10, background: mc.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 18, fontWeight: 700, color: mc.accent }}>L{report.maturity.achieved_level}</span></div>
            <div><div style={{ fontSize: 10, color: "#6B7280" }}>MATURITY</div><div style={{ fontSize: 20, fontWeight: 700 }}>{report.maturity.achieved_label}</div></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: 10, background: report.critical_risks.length > 0 ? "#FEE2E2" : "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {report.critical_risks.length > 0 ? <AlertTriangle size={22} color="#DC2626" /> : <Shield size={22} color="#16A34A" />}
            </div>
            <div><div style={{ fontSize: 10, color: "#6B7280" }}>CRITICAL RISKS</div><div style={{ fontSize: 20, fontWeight: 700, color: report.critical_risks.length > 0 ? "#DC2626" : "#16A34A" }}>{report.critical_risks.length}</div></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}><Zap size={22} color="#4F46E5" /></div>
            <div><div style={{ fontSize: 10, color: "#6B7280" }}>ACTIONS</div><div style={{ fontSize: 20, fontWeight: 700 }}>{report.actions.length}</div></div>
          </div>
        </div>
      </div>

      <div className="no-print" style={{ background: "#FFF", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", display: "flex" }}>
          {["overview", "maturity", "actions", "pillars"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "14px 18px", fontSize: 13, fontWeight: 500, color: tab === t ? "#4F46E5" : "#6B7280", background: "transparent", border: "none", borderBottom: `2px solid ${tab === t ? "#4F46E5" : "transparent"}`, cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>
        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
            <div>
              {report.critical_risks.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}><AlertTriangle size={18} color="#DC2626" /> Critical Risks</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{report.critical_risks.map((r, i) => <RiskCard key={i} risk={r} />)}</div>
                </div>
              )}
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}><Zap size={18} color="#4F46E5" /> Priority Actions</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{report.actions.slice(0, 3).map((a, i) => <ActionCard key={a.id} action={a} index={i} />)}</div>
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}><TrendingUp size={18} color="#4F46E5" /> Maturity Progress</h2>
              <div data-print-card style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20 }}>
                <MaturityLadder maturity={report.maturity} />
              </div>
            </div>
          </div>
        )}
        {tab === "maturity" && (
          <div style={{ maxWidth: 500 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>Maturity Assessment</h2>
            <div data-print-card style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 14, padding: 24 }}>
              <MaturityLadder maturity={report.maturity} />
            </div>
          </div>
        )}
        {tab === "actions" && (
          <div style={{ maxWidth: 700 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>Action Plan</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{report.actions.map((a, i) => <ActionCard key={a.id} action={a} index={i} />)}</div>
          </div>
        )}
        {tab === "pillars" && (
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>Pillar Breakdown</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>{report.pillars.map((p) => <PillarCard key={p.pillar_id} pillar={p} />)}</div>
          </div>
        )}
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "20px 0", marginTop: 40, background: "#FFF" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B7280" }}>
          <span>Finance Diagnostic Platform • {report.spec_version}</span>
          <span>{formatDate(report.generated_at)}</span>
        </div>
      </footer>
    </div>
  );
}
