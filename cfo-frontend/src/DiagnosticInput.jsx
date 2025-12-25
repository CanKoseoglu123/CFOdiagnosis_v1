// src/DiagnosticInput.jsx
// VS14: Content Hydration - Questions fetched from /api/spec (Single Source of Truth)
// v2.7.0: Renders hierarchy: Theme -> Objective -> Question (grouped by theme_order)
// Wrapped with AppShell layout

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { supabase } from "./lib/supabase";
import { AlertTriangle, CheckCircle, Play, Send, FileText, HelpCircle, Loader, ChevronDown, ChevronRight } from "lucide-react";
import AppShell from "./components/AppShell";
import QuestionnaireSidebar from "./components/QuestionnaireSidebar";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const THEME_COLORS = {
  foundation: { bg: "#FEF3C7", text: "#92400E", accent: "#F59E0B", icon: "🏛️" },
  future: { bg: "#DBEAFE", text: "#1E40AF", accent: "#3B82F6", icon: "🔮" },
  intelligence: { bg: "#E0E7FF", text: "#4338CA", accent: "#6366F1", icon: "🧠" },
};

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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {question.is_critical && <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>CRITICAL</span>}
          <span style={{ background: lc.bg, color: lc.text, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>L{question.level}</span>
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

const ObjectiveSection = ({ objective, questions, answers, onAnswer, helpVisible, onToggleHelp }) => {
  const [expanded, setExpanded] = useState(true);
  const lc = LEVEL_COLORS[objective.level] || LEVEL_COLORS[1];
  const answeredInObjective = questions.filter(q => answers[q.id] !== undefined).length;
  const allAnswered = answeredInObjective === questions.length;

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "#FFF",
          border: `1px solid ${lc.accent}`,
          borderRadius: 10,
          cursor: "pointer",
          marginBottom: expanded ? 12 : 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {expanded ? <ChevronDown size={18} color={lc.text} /> : <ChevronRight size={18} color={lc.text} />}
          <div style={{ textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{objective.name}</span>
              <span style={{ background: lc.bg, color: lc.text, padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>L{objective.level}</span>
            </div>
            {objective.purpose && (
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{objective.purpose}</div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {allAnswered && <CheckCircle size={16} color="#22C55E" />}
          <span style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>{answeredInObjective}/{questions.length}</span>
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

const ThemeSection = ({ theme, objectives, questions, answers, onAnswer, helpVisible, onToggleHelp }) => {
  const [expanded, setExpanded] = useState(true);
  const tc = THEME_COLORS[theme.code] || THEME_COLORS.foundation;

  // Get questions for all objectives in this theme
  const themeQuestionIds = new Set(
    objectives.flatMap(obj =>
      questions.filter(q => q.objective_id === obj.id).map(q => q.id)
    )
  );
  const themeQuestions = questions.filter(q => themeQuestionIds.has(q.id));
  const answeredInTheme = themeQuestions.filter(q => answers[q.id] !== undefined).length;
  const allAnswered = answeredInTheme === themeQuestions.length;

  return (
    <div style={{ marginBottom: 32 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          background: tc.bg,
          border: `2px solid ${tc.accent}`,
          borderRadius: 12,
          cursor: "pointer",
          marginBottom: expanded ? 16 : 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {expanded ? <ChevronDown size={20} color={tc.text} /> : <ChevronRight size={20} color={tc.text} />}
          <span style={{ fontSize: 24 }}>{tc.icon}</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: tc.text }}>{theme.name}</div>
            <div style={{ fontSize: 12, color: tc.text, opacity: 0.8 }}>{theme.displayName}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {allAnswered && <CheckCircle size={20} color="#22C55E" />}
          <span style={{ fontSize: 14, fontWeight: 600, color: tc.text }}>{answeredInTheme}/{themeQuestions.length}</span>
        </div>
      </button>
      {expanded && (
        <div style={{ paddingLeft: 8 }}>
          {objectives.map(objective => {
            const objQuestions = questions.filter(q => q.objective_id === objective.id);
            return (
              <ObjectiveSection
                key={objective.id}
                objective={objective}
                questions={objQuestions}
                answers={answers}
                onAnswer={onAnswer}
                helpVisible={helpVisible}
                onToggleHelp={onToggleHelp}
              />
            );
          })}
        </div>
      )}
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

        // Gate: If setup not completed, redirect to company setup
        if (!run.setup_completed_at) {
          navigate(`/run/${urlRunId}/setup/company`);
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
  const objectives = spec?.objectives || [];
  const maturityGates = spec?.maturityGates || [];
  const themes = spec?.themes || [];

  // v2.7.0: Sort objectives by theme_order for deterministic UI rendering
  const sortedObjectives = useMemo(() => {
    return [...objectives].sort((a, b) => (a.theme_order || 0) - (b.theme_order || 0));
  }, [objectives]);

  // v2.7.0: Group objectives by theme
  const groupedByTheme = useMemo(() => {
    if (themes.length === 0) {
      return null;
    }
    return themes.map(theme => ({
      ...theme,
      objectives: sortedObjectives.filter(obj => obj.theme === theme.code)
    })).filter(group => group.objectives.length > 0);
  }, [themes, sortedObjectives]);

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const allAnswered = answeredCount === totalQuestions && totalQuestions > 0;

  // Build sidebar themes data
  const sidebarThemes = useMemo(() => {
    if (!groupedByTheme) return [];
    return groupedByTheme.map(theme => {
      const themeObjectives = theme.objectives || [];
      const themeQuestionIds = new Set(
        themeObjectives.flatMap(obj =>
          questions.filter(q => q.objective_id === obj.id).map(q => q.id)
        )
      );
      const themeQuestions = questions.filter(q => themeQuestionIds.has(q.id));
      const answeredInTheme = themeQuestions.filter(q => answers[q.id] !== undefined).length;

      return {
        code: theme.code,
        name: theme.name,
        answered: answeredInTheme,
        total: themeQuestions.length,
        completed: answeredInTheme === themeQuestions.length && themeQuestions.length > 0,
        objectives: themeObjectives.map(obj => {
          const objQuestions = questions.filter(q => q.objective_id === obj.id);
          const objAnswered = objQuestions.filter(q => answers[q.id] !== undefined).length;
          return {
            id: obj.id,
            name: obj.name,
            answered: objAnswered,
            total: objQuestions.length,
            active: false,
          };
        }),
      };
    });
  }, [groupedByTheme, questions, answers]);

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
      navigate(`/run/${data.id}/setup/company`);
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
      // VS21: Redirect to calibration page instead of report
      navigate(`/run/${runId}/calibrate`);
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

  // Fallback rendering for v2.6.4 (no themes)
  const renderLegacyView = () => (
    <>
      {pillars.map(pillar => {
        const pillarQuestions = questions.filter(q => q.pillar === pillar.id);
        const questionsByLevel = {};
        pillarQuestions.forEach(q => {
          const level = q.level || 1;
          if (!questionsByLevel[level]) questionsByLevel[level] = [];
          questionsByLevel[level].push(q);
        });
        const levelLabels = {};
        maturityGates.forEach(gate => { levelLabels[gate.level] = gate.label; });
        const levels = Object.keys(questionsByLevel).map(Number).sort((a, b) => a - b);

        return (
          <div key={pillar.id} style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "16px 20px", background: "#0F172A", borderRadius: 12 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.1em", color: "#94A3B8", marginBottom: 4 }}>PILLAR</div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#FFF", margin: 0 }}>{pillar.name}</h2>
              </div>
            </div>
            {levels.map(level => {
              const levelQuestions = questionsByLevel[level];
              const answeredInLevel = levelQuestions.filter(q => answers[q.id] !== undefined).length;
              const lc = LEVEL_COLORS[level] || LEVEL_COLORS[1];
              return (
                <div key={level} style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 12px", background: lc.bg, borderRadius: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: lc.text }}>Level {level}: {levelLabels[level]}</span>
                    <span style={{ fontSize: 12, color: lc.text }}>({answeredInLevel}/{levelQuestions.length})</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {levelQuestions.map(q => (
                      <QuestionCard
                        key={q.id}
                        question={q}
                        answer={answers[q.id] ?? null}
                        onAnswer={saveAnswer}
                        showHelp={helpVisible[q.id] || false}
                        onToggleHelp={() => toggleHelp(q.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );

  // v2.7.0 theme-based rendering
  const renderThemeView = () => (
    <>
      {groupedByTheme.map(themeGroup => (
        <ThemeSection
          key={themeGroup.code}
          theme={themeGroup}
          objectives={themeGroup.objectives}
          questions={questions}
          answers={answers}
          onAnswer={saveAnswer}
          helpVisible={helpVisible}
          onToggleHelp={toggleHelp}
        />
      ))}
    </>
  );

  // Mobile bottom nav for questionnaire
  const mobileBottomNav = status === "answering" ? (
    <>
      <div style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
        {answeredCount} of {totalQuestions}
      </div>
      <button
        className="mobile-nav-button primary"
        onClick={submitDiagnostic}
        disabled={!allAnswered}
      >
        <Send size={16} />
        {allAnswered ? "Submit" : `${totalQuestions - answeredCount} left`}
      </button>
    </>
  ) : null;

  // Sidebar content for questionnaire
  const sidebarContent = (
    <QuestionnaireSidebar
      progress={{
        answered: answeredCount,
        total: totalQuestions,
        percentage: totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0,
      }}
      themes={sidebarThemes}
      activeTheme={null}
      onThemeClick={() => {}}
      onSubmit={submitDiagnostic}
      canSubmit={allAnswered}
    />
  );

  return (
    <AppShell sidebarContent={sidebarContent} mobileBottomNav={mobileBottomNav}>
      <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui" }}>
        {/* Page Header */}
        <div style={{ background: "#0F172A", color: "#FFF", padding: "32px 0" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "#94A3B8", marginBottom: 6 }}>FINANCE DIAGNOSTIC</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Maturity Assessment</h1>
            {runContext?.company_name && (
              <div style={{ fontSize: 14, color: "#94A3B8", marginTop: 6 }}>{runContext.company_name}</div>
            )}
          </div>
        </div>

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
                Answer {totalQuestions} questions across {themes.length > 0 ? `${themes.length} themes` : `${pillars.length} pillar${pillars.length !== 1 ? "s" : ""}`} to receive a personalized maturity assessment with actionable recommendations.
              </p>
              {themes.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 32 }}>
                  {themes.map(theme => {
                    const tc = THEME_COLORS[theme.code] || THEME_COLORS.foundation;
                    return (
                      <div key={theme.code} style={{ background: tc.bg, color: tc.text, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{tc.icon}</span> {theme.name}
                      </div>
                    );
                  })}
                </div>
              )}
              {themes.length === 0 && (
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
              )}
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

              {groupedByTheme ? renderThemeView() : renderLegacyView()}

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
    </AppShell>
  );
}
