// VS11 — Finance Diagnostic Report Frontend
// Executive-grade, Gartner-style diagnostic report interface
// Consumes /diagnostic-runs/:id/report endpoint

import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, ChevronRight, Target, TrendingUp, Shield, Zap, ArrowRight, Info } from "lucide-react";

// ============================================================
// MOCK DATA (Replace with API call in production)
// ============================================================

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
  critical_risks: [
    {
      evidence_id: "fpa_budget_owner",
      question_text: "Is there a single person accountable for owning and maintaining the budget process?",
      pillar_id: "fpa",
      user_answer: false,
    },
  ],
  pillars: [
    {
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
      critical_risks: [
        {
          evidence_id: "fpa_budget_owner",
          question_text: "Is there a single person accountable for owning and maintaining the budget process?",
          pillar_id: "fpa",
          user_answer: false,
        },
      ],
    },
  ],
  actions: [
    {
      id: "act_assign_budget_owner",
      title: "Assign a Budget Process Owner",
      description: "Designate a single individual (typically in Finance) who is accountable for the end-to-end budget process, including timeline, templates, consolidation, and stakeholder coordination.",
      rationale: "Distributed ownership leads to inconsistent assumptions, missed deadlines, and gaps in coverage. A single owner ensures process integrity and accountability.",
      priority: "critical",
      trigger_type: "critical_risk",
      evidence_id: "fpa_budget_owner",
      pillar_id: "fpa",
    },
    {
      id: "act_implement_variance",
      title: "Implement Monthly Variance Analysis",
      description: "Establish a monthly close process that compares actual results to budget. Document significant variances (typically >5% or >$X threshold) with explanations and corrective actions.",
      rationale: "Variance analysis transforms the budget from a static document into a management tool. It enables early detection of problems and creates accountability for results.",
      priority: "high",
      trigger_type: "maturity_blocker",
      evidence_id: "fpa_variance_analysis",
      pillar_id: "fpa",
    },
    {
      id: "act_implement_forecast",
      title: "Implement Rolling Forecasts",
      description: "Move beyond the static annual budget by maintaining a rolling forecast that extends 4-6 quarters ahead and is updated at least quarterly.",
      rationale: "Annual budgets become stale quickly. Rolling forecasts provide leadership with a continuously updated view of expected performance.",
      priority: "high",
      trigger_type: "maturity_blocker",
      evidence_id: "fpa_rolling_forecast",
      pillar_id: "fpa",
    },
  ],
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

const formatScore = (score) => {
  if (score === null || score === undefined) return "—";
  return `${Math.round(score * 100)}%`;
};

const formatDate = (isoString) => {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case "critical": return { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" };
    case "high": return { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" };
    case "medium": return { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" };
    default: return { bg: "#F3F4F6", text: "#374151", border: "#E5E7EB" };
  }
};

const getMaturityColor = (level) => {
  const colors = [
    { bg: "#FEE2E2", text: "#991B1B", accent: "#EF4444" }, // 0 - Ad-hoc (Red)
    { bg: "#FEF3C7", text: "#92400E", accent: "#F59E0B" }, // 1 - Emerging (Amber)
    { bg: "#FEF9C3", text: "#854D0E", accent: "#EAB308" }, // 2 - Defined (Yellow)
    { bg: "#DCFCE7", text: "#166534", accent: "#22C55E" }, // 3 - Managed (Green)
    { bg: "#DBEAFE", text: "#1E40AF", accent: "#3B82F6" }, // 4 - Optimized (Blue)
  ];
  return colors[level] || colors[0];
};

// ============================================================
// COMPONENTS
// ============================================================

// --- Score Ring ---
const ScoreRing = ({ score, size = 160, strokeWidth = 12, label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score !== null ? score : 0;
  const offset = circumference - progress * circumference;
  
  const getScoreColor = (s) => {
    if (s === null) return "#9CA3AF";
    if (s >= 0.8) return "#22C55E";
    if (s >= 0.6) return "#EAB308";
    if (s >= 0.4) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getScoreColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 1s ease-out, stroke 0.3s ease",
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
        }}
      >
        <div style={{ 
          fontSize: size * 0.25, 
          fontWeight: 700, 
          color: "#111827",
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: "-0.02em",
        }}>
          {formatScore(score)}
        </div>
        {label && (
          <div style={{ 
            fontSize: 12, 
            color: "#6B7280", 
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginTop: 4,
          }}>
            {label}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Maturity Ladder ---
const MaturityLadder = ({ maturity, compact = false }) => {
  const { achieved_level, gates } = maturity;
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 6 : 10 }}>
      {[...gates].reverse().map((gate, idx) => {
        const isAchieved = gate.level <= achieved_level;
        const isCurrent = gate.level === achieved_level;
        const isNext = gate.level === achieved_level + 1;
        const colors = getMaturityColor(gate.level);
        
        return (
          <div
            key={gate.level}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: compact ? "8px 12px" : "12px 16px",
              borderRadius: 8,
              backgroundColor: isAchieved ? colors.bg : "#F9FAFB",
              border: `2px solid ${isCurrent ? colors.accent : isAchieved ? colors.border || colors.bg : "#E5E7EB"}`,
              opacity: isAchieved ? 1 : 0.6,
              transition: "all 0.3s ease",
              position: "relative",
            }}
          >
            <div
              style={{
                width: compact ? 28 : 36,
                height: compact ? 28 : 36,
                borderRadius: "50%",
                backgroundColor: isAchieved ? colors.accent : "#D1D5DB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFF",
                fontWeight: 700,
                fontSize: compact ? 12 : 14,
              }}
            >
              {isAchieved ? <CheckCircle size={compact ? 16 : 20} /> : gate.level}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontWeight: 600, 
                color: isAchieved ? colors.text : "#6B7280",
                fontSize: compact ? 13 : 15,
              }}>
                Level {gate.level}: {gate.label}
              </div>
              {!compact && (
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                  {gate.required_evidence_ids.length} requirements
                </div>
              )}
            </div>
            {isCurrent && (
              <div style={{
                backgroundColor: colors.accent,
                color: "#FFF",
                padding: "4px 10px",
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}>
                Current
              </div>
            )}
            {isNext && (
              <div style={{
                backgroundColor: "#E5E7EB",
                color: "#6B7280",
                padding: "4px 10px",
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}>
                Next
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// --- Critical Risk Card ---
const CriticalRiskCard = ({ risk }) => {
  return (
    <div
      style={{
        padding: 16,
        backgroundColor: "#FEF2F2",
        border: "1px solid #FECACA",
        borderRadius: 10,
        borderLeft: "4px solid #EF4444",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          backgroundColor: "#FEE2E2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <AlertTriangle size={16} color="#DC2626" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: 600, 
            color: "#991B1B", 
            fontSize: 14,
            marginBottom: 4,
          }}>
            Critical Risk Identified
          </div>
          <div style={{ color: "#7F1D1D", fontSize: 13, lineHeight: 1.5 }}>
            {risk.question_text}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Action Card ---
const ActionCard = ({ action, index }) => {
  const [expanded, setExpanded] = useState(false);
  const priorityColors = getPriorityColor(action.priority);
  
  return (
    <div
      style={{
        backgroundColor: "#FFF",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        overflow: "hidden",
        transition: "box-shadow 0.2s ease",
        boxShadow: expanded ? "0 4px 12px rgba(0,0,0,0.08)" : "none",
      }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          cursor: "pointer",
          borderBottom: expanded ? "1px solid #E5E7EB" : "none",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: priorityColors.bg,
            border: `1px solid ${priorityColors.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: priorityColors.text,
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {index + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: "#111827", fontSize: 15 }}>
            {action.title}
          </div>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 8, 
            marginTop: 4,
            flexWrap: "wrap",
          }}>
            <span
              style={{
                backgroundColor: priorityColors.bg,
                color: priorityColors.text,
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              {action.priority}
            </span>
            <span style={{ fontSize: 12, color: "#6B7280" }}>
              {action.trigger_type === "critical_risk" ? "Resolves critical risk" : "Unlocks next maturity level"}
            </span>
          </div>
        </div>
        <ChevronRight
          size={20}
          color="#9CA3AF"
          style={{
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </div>
      
      {expanded && (
        <div style={{ padding: "16px 20px", backgroundColor: "#F9FAFB" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ 
              fontSize: 11, 
              fontWeight: 600, 
              color: "#6B7280", 
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 6,
            }}>
              What to do
            </div>
            <div style={{ color: "#374151", fontSize: 14, lineHeight: 1.6 }}>
              {action.description}
            </div>
          </div>
          <div>
            <div style={{ 
              fontSize: 11, 
              fontWeight: 600, 
              color: "#6B7280", 
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 6,
            }}>
              Why it matters
            </div>
            <div style={{ color: "#374151", fontSize: 14, lineHeight: 1.6 }}>
              {action.rationale}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Section Header ---
const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
      {Icon && (
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: "#EEF2FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Icon size={18} color="#4F46E5" />
        </div>
      )}
      <h2 style={{ 
        fontSize: 20, 
        fontWeight: 700, 
        color: "#111827",
        margin: 0,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {title}
      </h2>
    </div>
    {subtitle && (
      <p style={{ 
        fontSize: 14, 
        color: "#6B7280", 
        margin: "8px 0 0 42px",
        lineHeight: 1.5,
      }}>
        {subtitle}
      </p>
    )}
  </div>
);

// --- Pillar Card ---
const PillarCard = ({ pillar }) => {
  const maturityColors = getMaturityColor(pillar.maturity.achieved_level);
  
  return (
    <div
      style={{
        backgroundColor: "#FFF",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        padding: 24,
        transition: "box-shadow 0.2s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h3 style={{ 
            fontSize: 18, 
            fontWeight: 700, 
            color: "#111827", 
            margin: "0 0 4px 0",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {pillar.pillar_name}
          </h3>
          <div style={{ fontSize: 13, color: "#6B7280" }}>
            {pillar.scored_questions} of {pillar.total_questions} questions assessed
          </div>
        </div>
        <ScoreRing score={pillar.score} size={80} strokeWidth={8} />
      </div>
      
      {/* Maturity Badge */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        backgroundColor: maturityColors.bg,
        borderRadius: 8,
        marginBottom: 16,
      }}>
        <div style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          backgroundColor: maturityColors.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFF",
          fontSize: 11,
          fontWeight: 700,
        }}>
          {pillar.maturity.achieved_level}
        </div>
        <span style={{ 
          fontWeight: 600, 
          color: maturityColors.text,
          fontSize: 14,
        }}>
          {pillar.maturity.achieved_label}
        </span>
      </div>
      
      {/* Critical Risks */}
      {pillar.critical_risks.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ 
            fontSize: 11, 
            fontWeight: 600, 
            color: "#DC2626", 
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <AlertTriangle size={12} />
            {pillar.critical_risks.length} Critical Risk{pillar.critical_risks.length > 1 ? "s" : ""}
          </div>
        </div>
      )}
      
      {/* Blocking Evidence */}
      {pillar.maturity.blocking_evidence_ids.length > 0 && (
        <div style={{ 
          marginTop: 12,
          padding: "10px 12px",
          backgroundColor: "#F9FAFB",
          borderRadius: 8,
          fontSize: 13,
          color: "#6B7280",
        }}>
          <strong style={{ color: "#374151" }}>To reach Level {pillar.maturity.blocking_level}:</strong>
          <span style={{ marginLeft: 4 }}>
            {pillar.maturity.blocking_evidence_ids.length} requirement{pillar.maturity.blocking_evidence_ids.length > 1 ? "s" : ""} remaining
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function FinanceDiagnosticReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Simulate API call - replace with actual fetch
    const fetchReport = async () => {
      try {
        setLoading(true);
        // In production: const res = await fetch(`/diagnostic-runs/${runId}/report`);
        // const data = await res.json();
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network delay
        setReport(MOCK_REPORT);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8FAFC",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48,
            height: 48,
            border: "3px solid #E5E7EB",
            borderTopColor: "#4F46E5",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px",
          }} />
          <div style={{ color: "#6B7280", fontSize: 14 }}>Loading diagnostic report...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8FAFC",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}>
        <div style={{
          textAlign: "center",
          padding: 32,
          backgroundColor: "#FEF2F2",
          borderRadius: 12,
          border: "1px solid #FECACA",
        }}>
          <AlertTriangle size={32} color="#DC2626" style={{ marginBottom: 12 }} />
          <div style={{ color: "#991B1B", fontWeight: 600, marginBottom: 8 }}>Failed to load report</div>
          <div style={{ color: "#7F1D1D", fontSize: 14 }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const maturityColors = getMaturityColor(report.maturity.achieved_level);

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#F8FAFC",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      
      {/* Header */}
      <header style={{
        backgroundColor: "#0F172A",
        color: "#FFF",
        padding: "32px 0",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ 
            fontSize: 12, 
            textTransform: "uppercase", 
            letterSpacing: "0.1em",
            color: "#94A3B8",
            marginBottom: 8,
          }}>
            Finance Diagnostic
          </div>
          <h1 style={{ 
            fontSize: 32, 
            fontWeight: 700, 
            margin: "0 0 8px 0",
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: "-0.02em",
          }}>
            Maturity Assessment Report
          </h1>
          <div style={{ 
            fontSize: 14, 
            color: "#94A3B8",
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}>
            <span>Generated {formatDate(report.generated_at)}</span>
            <span style={{ color: "#475569" }}>•</span>
            <span>Spec {report.spec_version}</span>
            <span style={{ color: "#475569" }}>•</span>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: "#64748B" }}>
              {report.run_id}
            </span>
          </div>
        </div>
      </header>

      {/* Executive Summary Strip */}
      <div style={{
        backgroundColor: "#FFF",
        borderBottom: "1px solid #E5E7EB",
        padding: "24px 0",
      }}>
        <div style={{ 
          maxWidth: 1200, 
          margin: "0 auto", 
          padding: "0 24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 32,
        }}>
          {/* Overall Score */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <ScoreRing score={report.overall_score} size={72} strokeWidth={7} />
            <div>
              <div style={{ fontSize: 12, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Execution Score
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>
                {formatScore(report.overall_score)}
              </div>
            </div>
          </div>
          
          {/* Maturity Level */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              backgroundColor: maturityColors.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ 
                fontSize: 28, 
                fontWeight: 700, 
                color: maturityColors.accent,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                L{report.maturity.achieved_level}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Maturity Level
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>
                {report.maturity.achieved_label}
              </div>
            </div>
          </div>
          
          {/* Critical Risks */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              backgroundColor: report.critical_risks.length > 0 ? "#FEE2E2" : "#DCFCE7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {report.critical_risks.length > 0 ? (
                <AlertTriangle size={28} color="#DC2626" />
              ) : (
                <Shield size={28} color="#16A34A" />
              )}
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Critical Risks
              </div>
              <div style={{ 
                fontSize: 24, 
                fontWeight: 700, 
                color: report.critical_risks.length > 0 ? "#DC2626" : "#16A34A",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {report.critical_risks.length}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              backgroundColor: "#EEF2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Zap size={28} color="#4F46E5" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Priority Actions
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>
                {report.actions.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        backgroundColor: "#FFF",
        borderBottom: "1px solid #E5E7EB",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", gap: 0 }}>
            {[
              { id: "overview", label: "Overview" },
              { id: "maturity", label: "Maturity" },
              { id: "actions", label: "Action Plan" },
              { id: "pillars", label: "Pillars" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "16px 20px",
                  fontSize: 14,
                  fontWeight: 500,
                  color: activeTab === tab.id ? "#4F46E5" : "#6B7280",
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: `2px solid ${activeTab === tab.id ? "#4F46E5" : "transparent"}`,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            {/* Left Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Critical Risks Section */}
              {report.critical_risks.length > 0 && (
                <div>
                  <SectionHeader 
                    icon={AlertTriangle} 
                    title="Critical Risks" 
                    subtitle="Issues that require immediate attention"
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {report.critical_risks.map((risk, idx) => (
                      <CriticalRiskCard key={idx} risk={risk} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Top Actions */}
              <div>
                <SectionHeader 
                  icon={Zap} 
                  title="Top Priority Actions" 
                  subtitle="Recommended next steps to improve maturity"
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {report.actions.slice(0, 3).map((action, idx) => (
                    <ActionCard key={action.id} action={action} index={idx} />
                  ))}
                </div>
                {report.actions.length > 3 && (
                  <button
                    onClick={() => setActiveTab("actions")}
                    style={{
                      marginTop: 16,
                      padding: "12px 20px",
                      backgroundColor: "#F3F4F6",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#374151",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      justifyContent: "center",
                    }}
                  >
                    View all {report.actions.length} actions
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
            
            {/* Right Column - Maturity */}
            <div>
              <SectionHeader 
                icon={TrendingUp} 
                title="Maturity Progress" 
                subtitle="Your organization's finance maturity journey"
              />
              <div style={{
                backgroundColor: "#FFF",
                border: "1px solid #E5E7EB",
                borderRadius: 16,
                padding: 24,
              }}>
                <MaturityLadder maturity={report.maturity} />
                
                {report.maturity.blocking_level && (
                  <div style={{
                    marginTop: 20,
                    padding: 16,
                    backgroundColor: "#FFFBEB",
                    border: "1px solid #FDE68A",
                    borderRadius: 10,
                  }}>
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 8,
                      marginBottom: 8,
                    }}>
                      <Info size={16} color="#D97706" />
                      <span style={{ fontWeight: 600, color: "#92400E", fontSize: 14 }}>
                        Path to Level {report.maturity.blocking_level}
                      </span>
                    </div>
                    <div style={{ color: "#78350F", fontSize: 13, lineHeight: 1.5 }}>
                      Complete {report.maturity.blocking_evidence_ids.length} remaining 
                      requirement{report.maturity.blocking_evidence_ids.length > 1 ? "s" : ""} to 
                      advance to the next maturity level.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Maturity Tab */}
        {activeTab === "maturity" && (
          <div>
            <SectionHeader 
              icon={TrendingUp} 
              title="Maturity Assessment" 
              subtitle="Detailed breakdown of your maturity progression across all gates"
            />
            <div style={{
              backgroundColor: "#FFF",
              border: "1px solid #E5E7EB",
              borderRadius: 16,
              padding: 32,
              maxWidth: 600,
            }}>
              <MaturityLadder maturity={report.maturity} />
            </div>
            
            {/* Blocking Evidence Details */}
            {report.maturity.blocking_evidence_ids.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <SectionHeader 
                  icon={Target} 
                  title="Requirements for Next Level" 
                  subtitle={`Evidence needed to achieve Level ${report.maturity.blocking_level}`}
                />
                <div style={{
                  backgroundColor: "#FFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: 16,
                  padding: 24,
                  maxWidth: 600,
                }}>
                  {report.maturity.blocking_evidence_ids.map((evidenceId, idx) => (
                    <div
                      key={evidenceId}
                      style={{
                        padding: "12px 16px",
                        backgroundColor: "#FEF3C7",
                        borderRadius: 8,
                        marginBottom: idx < report.maturity.blocking_evidence_ids.length - 1 ? 12 : 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: "#FDE68A",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#92400E",
                      }}>
                        {idx + 1}
                      </div>
                      <code style={{ 
                        fontSize: 13, 
                        color: "#92400E",
                        fontFamily: "'SF Mono', 'Monaco', monospace",
                      }}>
                        {evidenceId}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === "actions" && (
          <div>
            <SectionHeader 
              icon={Zap} 
              title="Action Plan" 
              subtitle={`${report.actions.length} prioritized recommendations to improve your finance maturity`}
            />
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: 12,
              maxWidth: 800,
            }}>
              {report.actions.map((action, idx) => (
                <ActionCard key={action.id} action={action} index={idx} />
              ))}
            </div>
            
            {report.actions.length === 0 && (
              <div style={{
                textAlign: "center",
                padding: 48,
                backgroundColor: "#FFF",
                borderRadius: 16,
                border: "1px solid #E5E7EB",
              }}>
                <CheckCircle size={48} color="#22C55E" style={{ marginBottom: 16 }} />
                <div style={{ fontSize: 18, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
                  All caught up!
                </div>
                <div style={{ color: "#6B7280", fontSize: 14 }}>
                  No outstanding actions at this time.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pillars Tab */}
        {activeTab === "pillars" && (
          <div>
            <SectionHeader 
              icon={Target} 
              title="Pillar Breakdown" 
              subtitle="Detailed assessment results for each finance capability area"
            />
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", 
              gap: 24,
            }}>
              {report.pillars.map((pillar) => (
                <PillarCard key={pillar.pillar_id} pillar={pillar} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid #E5E7EB",
        padding: "24px 0",
        marginTop: 48,
        backgroundColor: "#FFF",
      }}>
        <div style={{ 
          maxWidth: 1200, 
          margin: "0 auto", 
          padding: "0 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}>
          <div style={{ fontSize: 13, color: "#6B7280" }}>
            Finance Diagnostic Platform • Spec {report.spec_version}
          </div>
          <div style={{ fontSize: 13, color: "#9CA3AF" }}>
            Report generated {formatDate(report.generated_at)}
          </div>
        </div>
      </footer>
    </div>
  );
}
