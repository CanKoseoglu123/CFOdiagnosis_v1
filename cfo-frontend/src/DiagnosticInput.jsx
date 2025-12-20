// src/DiagnosticInput.jsx
// VS14: Content Hydration - Questions fetched from /api/spec (Single Source of Truth)
// Renders hierarchy: Pillar -> Level -> Question

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { supabase } from "./lib/supabase";
import { AlertTriangle, CheckCircle, Play, Send, FileText, HelpCircle, Loader, ChevronDown, ChevronRight } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const LEVEL_COLORS = {
  1: { bg: "#FEF3C7", text: "#92400E", accent: "#F59E0B" },
  2: { bg: "#FEF9C3", text: "#854D0E", accent: "#EAB308" },
  3: { bg: "#DCFCE7", text: "#166534", accent: "#22C55E" },
  4: { bg: "#DBEAFE", text: "#1E40AF", accent: "#3B82F6" },
};

const ProgressBar = ({ current, total }) => {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div style={{ width: "100%", height: 8, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: current === total ? "#22C55E" : "#4F46E5", transition: "width 0.3s" }} />
    </div>
  );
};

const QuestionCard = ({ question, answer, onAnswer, showHelp, onToggleHelp }) => {
  const lc = LEVEL_COLORS[question.level] || LEVEL_COLORS[1];
  return (
    <div style={{ background: "#FFF", border: answer !== null ? "2px solid #4F46E5" : "1px solid #E5E7EB", borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          {question.is_critical && <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>CRITICAL</span>}
        </div>
        {question.help && (
          <button onClick={onToggleHelp} style={{ background: showHelp ? "#EEF2FF" : "transparent", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: showHelp ? "#4F46E5" : "#9CA3AF" }}>
            <HelpCircle size={16} />
          </button>
        )}
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, color: "#111827", lineHeight: 1.5, marginBottom: 12 }}>{question.text}</div>
      {showHelp && question.help && <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 13, color: "#64748B" }}>{question.help}</div>}
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => onAnswer(question.id, true)} style={{ flex: 1, padding: "12px 16px", borderRadius: 8, border: answer === true ? "2px solid #22C55E" : "1px solid #E5E7EB", background: answer === true ? "#DCFCE7" : "#FFF", color: answer === true ? "#166534" : "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {answer === true && <CheckCircle size={16} />} Yes
        </button>
        <button onClick={() => onAnswer(question.id, false)} style={{ flex: 1, padding: "12px 16px", borderRadius: 8, border: answer === false ? "2px solid #EF4444" : "1px solid #E5E7EB", background: answer === false ? "#FEE2E2" : "#FFF", color: answer === false ? "#991B1B" : "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {answer === false && <AlertTriangle size={16} />} No
        </button>
      </div>
    </div>
  );
};

const LevelSection = ({ level, label, questions, answers, onAnswer, helpVisible, onToggleHelp }) => {
  const [expanded, setExpanded] = useState(true);
  const lc = LEVEL_COLORS[level] || LEVEL_COLORS[1];
  const answeredInLevel = questions.filter(q => answers[q.id] !== undefined).length;
  const allAnswered = answeredInLevel === questions.length;

  return (
    <div style={{ marginBottom: 24 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: lc.bg,
          border: `2px solid ${lc.accent}`,
          borderRadius: 10,
          cursor: "pointer",
          marginBottom: expanded ? 12 : 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {expanded ? <ChevronDown size={20} color={lc.text} /> : <ChevronRight size={20} color={lc.text} />}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: lc.text }}>Level {level}: {label}</span>
            <span style={{ fontSize: 12, color: lc.text, opacity: 0.8 }}>({questions.length} questions)</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {allAnswered && <CheckCircle size={18} color="#22C55E" />}
          <span style={{ fontSize: 13, fontWeight: 600, color: lc.text }}>{answeredInLevel}/{questions.length}</span>
        </div>
      </button>
      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingLeft: 16, borderLeft: `3px solid ${lc.accent}` }}>
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              answer={answers[q.id] ?? null}
              onAnswer={onAnswer}
              showHelp={helpVisible[q.id] || false}
              onToggleHelp={() => onToggleHelp(q.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PillarSection = ({ pillar, questions, maturityGates, answers, onAnswer, helpVisible, onToggleHelp }) => {
  const pillarQuestions = questions.filter(q => q.pillar === pillar.id);
  const answeredInPillar = pillarQuestions.filter(q => answers[q.id] !== undefined).length;

  // Group questions by level
  const questionsByLevel = {};
  pillarQuestions.forEach(q => {
    const level = q.level || 1;
    if (!questionsByLevel[level]) questionsByLevel[level] = [];
    questionsByLevel[level].push(q);
  });

  // Get level labels from maturityGates
  const levelLabels = {};
  maturityGates.forEach(gate => {
    levelLabels[gate.level] = gate.label;
  });

  const levels = Object.keys(questionsByLevel).map(Number).sort((a, b) => a - b);

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "16px 20px", background: "#0F172A", borderRadius: 12 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", color: "#94A3B8", marginBottom: 4 }}>PILLAR</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#FFF", margin: 0 }}>{pillar.name}</h2>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#94A3B8" }}>Progress</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#FFF" }}>{answeredInPillar}/{pillarQuestions.length}</div>
        </div>
      </div>
      {levels.map(level => (
        <LevelSection
          key={level}
          level={level}
          label={levelLabels[level] || `Level ${level}`}
          questions={questionsByLevel[level]}
          answers={answers}
          onAnswer={onAnswer}
          helpVisible={helpVisible}
          onToggleHelp={onToggleHelp}
        />
      ))}
    </div>
  );
};

export default function DiagnosticInput() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // VS18: Check for runId in URL (from setup redirect)
  const urlRunId = searchParams.get("runId");
  const [runId, setRunId] = useState(urlRunId);
  const [runContext, setRunContext] = useState(null);

  // Spec data from backend (Single Source of Truth)
  const [spec, setSpec] = useState(null);
  const [loadingSpec, setLoadingSpec] = useState(true);
  const [verifyingRun, setVerifyingRun] = useState(!!urlRunId);

  const [answers, setAnswers] = useState({});
  const [helpVisible, setHelpVisible] = useState({});
  const [status, setStatus] = useState(urlRunId ? "answering" : "idle");
  const [error, setError] = useState(null);

  // Get auth token from Supabase session
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
    };
  };

  // VS18: Verify run has completed setup if runId provided
  useEffect(() => {
    if (!urlRunId) {
      setVerifyingRun(false);
      return;
    }

    const verifyRun = async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/diagnostic-runs/${urlRunId}`, { headers });

        if (!response.ok) {
          setError("Diagnostic run not found");
          setStatus("idle");
          setRunId(null);
          return;
        }

        const run = await response.json();

        // Gate: If setup not completed, redirect to setup
        if (!run.setup_completed_at) {
          navigate(`/run/${urlRunId}/setup`);
          return;
        }

        // Setup completed, allow assessment
        setRunContext(run.context);
        setStatus("answering");
      } catch (err) {
        setError(`Failed to verify run: ${err.message}`);
        setStatus("idle");
      } finally {
        setVerifyingRun(false);
      }
    };

    verifyRun();
  }, [urlRunId, navigate]);

  // Fetch full spec from backend on mount
  useEffect(() => {
    const fetchSpec = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/spec`);
        if (!response.ok) throw new Error("Failed to fetch spec");
        const data = await response.json();
        setSpec(data);
      } catch (err) {
        setError(`Failed to load assessment: ${err.message}`);
      } finally {
        setLoadingSpec(false);
      }
    };
    fetchSpec();
  }, []);

  const questions = spec?.questions || [];
  const pillars = spec?.pillars || [];
  const maturityGates = spec?.maturityGates || [];

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const allAnswered = answeredCount === totalQuestions && totalQuestions > 0;

  // VS18: Create run and redirect to setup page
  const createRun = async () => {
    try {
      setStatus("creating");
      setError(null);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/diagnostic-runs`, {
        method: "POST",
        headers,
      });
      if (!response.ok) throw new Error("Failed to create diagnostic run");
      const data = await response.json();
      // Redirect to setup page instead of directly starting questions
      navigate(`/run/${data.id}/setup`);
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  const saveAnswer = async (questionId, value) => {
    if (!runId) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/diagnostic-inputs`, {
        method: "POST",
        headers,
        body: JSON.stringify({ run_id: runId, question_id: questionId, value }),
      });
      if (!response.ok) throw new Error("Failed to save answer");
    } catch (err) {
      setAnswers((prev) => { const u = { ...prev }; delete u[questionId]; return u; });
      setError(err.message);
    }
  };

  const submitDiagnostic = async () => {
    if (!runId || !allAnswered) return;
    try {
      setStatus("submitting");
      setError(null);
      const headers = await getAuthHeaders();
      const completeRes = await fetch(`${API_BASE_URL}/diagnostic-runs/${runId}/complete`, { method: "POST", headers });
      if (!completeRes.ok) throw new Error("Failed to complete run");
      const scoreRes = await fetch(`${API_BASE_URL}/diagnostic-runs/${runId}/score`, { method: "POST", headers });
      if (!scoreRes.ok) throw new Error("Failed to score run");
      navigate(`/report/${runId}`);
    } catch (err) {
      setError(err.message);
      setStatus("answering");
    }
  };

  const toggleHelp = (qid) => setHelpVisible((prev) => ({ ...prev, [qid]: !prev[qid] }));

  // Loading state (spec loading or verifying run)
  if (loadingSpec || verifyingRun) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Loader size={48} style={{ animation: "spin 1s linear infinite", color: "#4F46E5" }} />
          <div style={{ marginTop: 16, color: "#6B7280" }}>Loading assessment...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui" }}>
      <header style={{ background: "#0F172A", color: "#FFF", padding: "24px 0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "#94A3B8", marginBottom: 6 }}>FINANCE DIAGNOSTIC</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Maturity Assessment</h1>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: 16, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <AlertTriangle size={20} color="#DC2626" />
            <div style={{ color: "#991B1B", fontSize: 14 }}>{error}</div>
            <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#991B1B", cursor: "pointer", fontSize: 18 }}>×</button>
          </div>
        )}

        {status === "idle" && (
          <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 16, padding: 48, textAlign: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <FileText size={36} color="#4F46E5" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 12px" }}>Finance Maturity Diagnostic</h2>
            <p style={{ color: "#6B7280", fontSize: 15, lineHeight: 1.6, marginBottom: 24, maxWidth: 500, margin: "0 auto 24px" }}>
              Answer {totalQuestions} questions across {pillars.length} pillar{pillars.length !== 1 ? "s" : ""} to receive a personalized maturity assessment with actionable recommendations.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 32 }}>
              {maturityGates.filter(g => g.level > 0).map(gate => {
                const lc = LEVEL_COLORS[gate.level] || LEVEL_COLORS[1];
                return (
                  <div key={gate.level} style={{ background: lc.bg, color: lc.text, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                    L{gate.level}: {gate.label}
                  </div>
                );
              })}
            </div>
            <button onClick={createRun} style={{ background: "#4F46E5", color: "#FFF", border: "none", borderRadius: 10, padding: "16px 32px", fontSize: 16, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10 }}>
              <Play size={20} /> Start Assessment
            </button>
          </div>
        )}

        {status === "creating" && (
          <div style={{ textAlign: "center", padding: 48 }}>
            <div style={{ width: 48, height: 48, border: "3px solid #E5E7EB", borderTopColor: "#4F46E5", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <div style={{ color: "#6B7280", fontSize: 14 }}>Creating your assessment...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {status === "answering" && (
          <>
            <div style={{ marginBottom: 32, background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Overall Progress: {answeredCount} of {totalQuestions}</span>
                <span style={{ fontSize: 13, color: "#6B7280" }}>{Math.round((answeredCount / totalQuestions) * 100)}%</span>
              </div>
              <ProgressBar current={answeredCount} total={totalQuestions} />
            </div>

            {pillars.map(pillar => (
              <PillarSection
                key={pillar.id}
                pillar={pillar}
                questions={questions}
                maturityGates={maturityGates}
                answers={answers}
                onAnswer={saveAnswer}
                helpVisible={helpVisible}
                onToggleHelp={toggleHelp}
              />
            ))}

            <div style={{ marginTop: 32, textAlign: "center" }}>
              <button onClick={submitDiagnostic} disabled={!allAnswered} style={{ background: allAnswered ? "#4F46E5" : "#D1D5DB", color: "#FFF", border: "none", borderRadius: 10, padding: "16px 32px", fontSize: 16, fontWeight: 600, cursor: allAnswered ? "pointer" : "not-allowed", display: "inline-flex", alignItems: "center", gap: 10 }}>
                <Send size={20} /> {allAnswered ? "Submit & View Results" : `Answer ${totalQuestions - answeredCount} more`}
              </button>
            </div>
          </>
        )}

        {status === "submitting" && (
          <div style={{ textAlign: "center", padding: 48 }}>
            <div style={{ width: 48, height: 48, border: "3px solid #E5E7EB", borderTopColor: "#22C55E", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <div style={{ color: "#6B7280", fontSize: 14 }}>Calculating your results...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "20px 0", marginTop: 40, background: "#FFF" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px", textAlign: "center", fontSize: 12, color: "#6B7280" }}>
          Finance Diagnostic Platform {spec?.version ? `• Spec ${spec.version}` : ""}
        </div>
      </footer>
    </div>
  );
}
