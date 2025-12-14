import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle, Play, Send, FileText, HelpCircle } from "lucide-react";

// API Configuration
const API_BASE_URL = "http://localhost:3000";

// Question data from Spec v2.6.4
const QUESTIONS = [
  {
    id: "fpa_annual_budget",
    pillar: "fpa",
    level: 1,
    levelLabel: "Emerging",
    text: "Do you have a documented annual budget that is formally approved by leadership?",
    is_critical: true,
    help: "This means a written budget document that covers all revenue and expenses, reviewed and signed off by executives before the fiscal year starts.",
  },
  {
    id: "fpa_budget_owner",
    pillar: "fpa",
    level: 1,
    levelLabel: "Emerging",
    text: "Is there a single person accountable for owning and maintaining the budget process?",
    is_critical: true,
    help: "One named individual (not a committee) who is responsible for the budget timeline, templates, consolidation, and coordination.",
  },
  {
    id: "fpa_variance_analysis",
    pillar: "fpa",
    level: 2,
    levelLabel: "Defined",
    text: "Do you perform monthly variance analysis comparing actuals to budget?",
    is_critical: false,
    help: "A regular monthly process that compares what actually happened to what was budgeted, with explanations for significant differences.",
  },
  {
    id: "fpa_rolling_forecast",
    pillar: "fpa",
    level: 2,
    levelLabel: "Defined",
    text: "Do you maintain a rolling forecast that is updated at least quarterly?",
    is_critical: false,
    help: "A forecast that always looks 4-6 quarters ahead and is refreshed at least every quarter with the latest information.",
  },
  {
    id: "fpa_driver_based",
    pillar: "fpa",
    level: 3,
    levelLabel: "Managed",
    text: "Is your financial forecast driver-based, linked to operational metrics (e.g., headcount, pipeline, units)?",
    is_critical: false,
    help: "Your forecast is built from operational assumptions (like number of customers, average deal size) rather than just trending historical numbers.",
  },
  {
    id: "fpa_scenario_modeling",
    pillar: "fpa",
    level: 3,
    levelLabel: "Managed",
    text: "Do you routinely model multiple scenarios (base case, upside, downside) for planning?",
    is_critical: false,
    help: "You regularly create best-case, worst-case, and expected-case versions of your forecast to prepare for different outcomes.",
  },
  {
    id: "fpa_integrated_planning",
    pillar: "fpa",
    level: 4,
    levelLabel: "Optimized",
    text: "Is financial planning formally integrated with operational planning (sales, HR, operations)?",
    is_critical: false,
    help: "Finance and operational teams use shared assumptions, aligned timelines, and connected systems — not separate spreadsheets.",
  },
  {
    id: "fpa_predictive",
    pillar: "fpa",
    level: 4,
    levelLabel: "Optimized",
    text: "Do you use predictive analytics or machine learning to improve forecast accuracy?",
    is_critical: false,
    help: "You use statistical models or ML algorithms to predict outcomes like demand, churn, or cash flow — beyond simple trending.",
  },
];

const LEVEL_COLORS = {
  1: { bg: "#FEF3C7", text: "#92400E", accent: "#F59E0B" },
  2: { bg: "#FEF9C3", text: "#854D0E", accent: "#EAB308" },
  3: { bg: "#DCFCE7", text: "#166534", accent: "#22C55E" },
  4: { bg: "#DBEAFE", text: "#1E40AF", accent: "#3B82F6" },
};

const ProgressBar = ({ current, total }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  return (
    <div style={{ width: "100%", height: 8, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
      <div
        style={{
          width: `${percentage}%`,
          height: "100%",
          background: current === total ? "#22C55E" : "#4F46E5",
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
};

const QuestionCard = ({ question, answer, onAnswer, index, showHelp, onToggleHelp }) => {
  const levelColor = LEVEL_COLORS[question.level] || LEVEL_COLORS[1];
  
  return (
    <div
      style={{
        background: "#FFF",
        border: answer !== null ? "2px solid #4F46E5" : "1px solid #E5E7EB",
        borderRadius: 16,
        padding: 24,
        transition: "all 0.2s ease",
        boxShadow: answer !== null ? "0 4px 12px rgba(79, 70, 229, 0.1)" : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: levelColor.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
              color: levelColor.text,
            }}
          >
            {index + 1}
          </div>
          <div>
            <span
              style={{
                background: levelColor.bg,
                color: levelColor.text,
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Level {question.level}: {question.levelLabel}
            </span>
            {question.is_critical && (
              <span
                style={{
                  background: "#FEE2E2",
                  color: "#991B1B",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginLeft: 8,
                }}
              >
                Critical
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onToggleHelp}
          style={{
            background: showHelp ? "#EEF2FF" : "transparent",
            border: "none",
            borderRadius: 8,
            padding: 8,
            cursor: "pointer",
            color: showHelp ? "#4F46E5" : "#9CA3AF",
          }}
          title="Show help"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      <div style={{ fontSize: 16, fontWeight: 500, color: "#111827", lineHeight: 1.5, marginBottom: 16 }}>
        {question.text}
      </div>

      {showHelp && (
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            fontSize: 13,
            color: "#64748B",
            lineHeight: 1.5,
          }}
        >
          💡 {question.help}
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => onAnswer(question.id, true)}
          style={{
            flex: 1,
            padding: "14px 20px",
            borderRadius: 10,
            border: answer === true ? "2px solid #22C55E" : "1px solid #E5E7EB",
            background: answer === true ? "#DCFCE7" : "#FFF",
            color: answer === true ? "#166534" : "#374151",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s ease",
          }}
        >
          {answer === true && <CheckCircle size={18} />}
          Yes
        </button>
        <button
          onClick={() => onAnswer(question.id, false)}
          style={{
            flex: 1,
            padding: "14px 20px",
            borderRadius: 10,
            border: answer === false ? "2px solid #EF4444" : "1px solid #E5E7EB",
            background: answer === false ? "#FEE2E2" : "#FFF",
            color: answer === false ? "#991B1B" : "#374151",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s ease",
          }}
        >
          {answer === false && <AlertTriangle size={18} />}
          No
        </button>
      </div>
    </div>
  );
};

export default function DiagnosticInput() {
  const navigate = useNavigate();
  const [runId, setRunId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [helpVisible, setHelpVisible] = useState({});
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = QUESTIONS.length;
  const allAnswered = answeredCount === totalQuestions;

  const createRun = async () => {
    try {
      setStatus("creating");
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/diagnostic-runs`, {
        method: "POST",
      });
      
      if (!response.ok) throw new Error("Failed to create diagnostic run");
      
      const data = await response.json();
      setRunId(data.id);
      setAnswers({});
      setStatus("answering");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  const saveAnswer = async (questionId, value) => {
    if (!runId) return;
    
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    
    try {
      const response = await fetch(`${API_BASE_URL}/diagnostic-inputs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          run_id: runId,
          question_id: questionId,
          value: value,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to save answer");
    } catch (err) {
      setAnswers((prev) => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
      setError(err.message);
    }
  };

  const submitDiagnostic = async () => {
    if (!runId || !allAnswered) return;
    
    try {
      setStatus("submitting");
      setError(null);
      
      const completeRes = await fetch(`${API_BASE_URL}/diagnostic-runs/${runId}/complete`, {
        method: "POST",
      });
      if (!completeRes.ok) throw new Error("Failed to complete diagnostic run");
      
      const scoreRes = await fetch(`${API_BASE_URL}/diagnostic-runs/${runId}/score`, {
        method: "POST",
      });
      if (!scoreRes.ok) throw new Error("Failed to score diagnostic run");
      
      // Navigate to report with the run ID
      navigate(`/report/${runId}`);
    } catch (err) {
      setError(err.message);
      setStatus("answering");
    }
  };

  const toggleHelp = (questionId) => {
    setHelpVisible((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ background: "#0F172A", color: "#FFF", padding: "24px 0" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8", marginBottom: 6 }}>
            Finance Diagnostic
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Maturity Assessment</h1>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>
        
        {error && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 10,
              padding: 16,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <AlertTriangle size={20} color="#DC2626" />
            <div style={{ color: "#991B1B", fontSize: 14 }}>{error}</div>
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: "#991B1B",
                cursor: "pointer",
                fontSize: 18,
              }}
            >
              ×
            </button>
          </div>
        )}

        {status === "idle" && (
          <div
            style={{
              background: "#FFF",
              border: "1px solid #E5E7EB",
              borderRadius: 16,
              padding: 48,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "#EEF2FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <FileText size={36} color="#4F46E5" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 12px" }}>
              Finance Maturity Diagnostic
            </h2>
            <p style={{ color: "#6B7280", fontSize: 15, lineHeight: 1.6, marginBottom: 32, maxWidth: 500, margin: "0 auto 32px" }}>
              Answer {totalQuestions} questions about your financial planning capabilities. 
              You'll receive a personalized maturity assessment with actionable recommendations.
            </p>
            <button
              onClick={createRun}
              style={{
                background: "#4F46E5",
                color: "#FFF",
                border: "none",
                borderRadius: 10,
                padding: "16px 32px",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Play size={20} />
              Start Assessment
            </button>
          </div>
        )}

        {status === "creating" && (
          <div style={{ textAlign: "center", padding: 48 }}>
            <div
              style={{
                width: 48,
                height: 48,
                border: "3px solid #E5E7EB",
                borderTopColor: "#4F46E5",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <div style={{ color: "#6B7280", fontSize: 14 }}>Creating your assessment...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {status === "answering" && (
          <>
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
                  Progress: {answeredCount} of {totalQuestions} questions
                </span>
                <span style={{ fontSize: 13, color: "#6B7280" }}>
                  {Math.round((answeredCount / totalQuestions) * 100)}%
                </span>
              </div>
              <ProgressBar current={answeredCount} total={totalQuestions} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {QUESTIONS.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  answer={answers[question.id] ?? null}
                  onAnswer={saveAnswer}
                  index={index}
                  showHelp={helpVisible[question.id] || false}
                  onToggleHelp={() => toggleHelp(question.id)}
                />
              ))}
            </div>

            <div style={{ marginTop: 32, textAlign: "center" }}>
              <button
                onClick={submitDiagnostic}
                disabled={!allAnswered}
                style={{
                  background: allAnswered ? "#4F46E5" : "#D1D5DB",
                  color: "#FFF",
                  border: "none",
                  borderRadius: 10,
                  padding: "16px 32px",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: allAnswered ? "pointer" : "not-allowed",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Send size={20} />
                {allAnswered ? "Submit & View Results" : `Answer ${totalQuestions - answeredCount} more`}
              </button>
            </div>
          </>
        )}

        {status === "submitting" && (
          <div style={{ textAlign: "center", padding: 48 }}>
            <div
              style={{
                width: 48,
                height: 48,
                border: "3px solid #E5E7EB",
                borderTopColor: "#22C55E",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <div style={{ color: "#6B7280", fontSize: 14 }}>Calculating your results...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "20px 0", marginTop: 40, background: "#FFF" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px", textAlign: "center", fontSize: 12, color: "#6B7280" }}>
          Finance Diagnostic Platform • Spec v2.6.4
        </div>
      </footer>
    </div>
  );
}
