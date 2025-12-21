// src/SetupPage.jsx
// VS18: Minimal Context Intake - Single page setup form
// Wrapped with AppShell layout

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { Building2, Briefcase, ArrowRight, Loader, AlertTriangle } from "lucide-react";
import AppShell from "./components/AppShell";
import SetupSidebar from "./components/SetupSidebar";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function SetupPage() {
  const { runId } = useParams();
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingRun, setCheckingRun] = useState(true);
  const [error, setError] = useState(null);

  // Get auth headers
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
    };
  };

  // Check if run exists and if setup is already completed
  useEffect(() => {
    const checkRun = async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/diagnostic-runs/${runId}`, { headers });

        if (!response.ok) {
          setError("Diagnostic run not found");
          return;
        }

        const run = await response.json();

        // If setup already completed, redirect to intro page
        if (run.setup_completed_at) {
          navigate(`/run/${runId}/intro`);
          return;
        }

        // Pre-fill if context exists (e.g., user came back)
        if (run.context) {
          setCompanyName(run.context.company_name || "");
          setIndustry(run.context.industry || "");
        }
      } catch (err) {
        setError(`Failed to load run: ${err.message}`);
      } finally {
        setCheckingRun(false);
      }
    };

    if (runId) {
      checkRun();
    } else {
      setError("No run ID provided");
      setCheckingRun(false);
    }
  }, [runId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!companyName.trim() || !industry.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/diagnostic-runs/${runId}/setup`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          company_name: companyName.trim(),
          industry: industry.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save setup");
      }

      // Navigate to intro page
      navigate(`/run/${runId}/intro`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingRun) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Loader size={48} style={{ animation: "spin 1s linear infinite", color: "#4F46E5" }} />
          <div style={{ marginTop: 16, color: "#6B7280" }}>Loading...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <AppShell sidebarContent={<SetupSidebar currentStep={1} />}>
      <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui" }}>
        {/* Page Header */}
        <div style={{ background: "#0F172A", color: "#FFF", padding: "32px 0" }}>
          <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 20px" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "#94A3B8", marginBottom: 6 }}>FINANCE DIAGNOSTIC</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Setup Your Assessment</h1>
          </div>
        </div>

        <main style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: 16, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
              <AlertTriangle size={20} color="#DC2626" />
              <div style={{ color: "#991B1B", fontSize: 14 }}>{error}</div>
              <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#991B1B", cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
          )}

          <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 16, padding: 32 }}>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Tell us about your organization</h2>
              <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>This information helps us provide context-aware recommendations.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Building2 size={16} color="#6B7280" />
                    Company Name
                  </div>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Acme Corporation"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    border: "1px solid #E5E7EB",
                    borderRadius: 10,
                    fontSize: 15,
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 32 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Briefcase size={16} color="#6B7280" />
                    Industry
                  </div>
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g., Technology, Healthcare, Manufacturing"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    border: "1px solid #E5E7EB",
                    borderRadius: 10,
                    fontSize: 15,
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !companyName.trim() || !industry.trim()}
                style={{
                  width: "100%",
                  padding: "16px 24px",
                  background: loading || !companyName.trim() || !industry.trim() ? "#D1D5DB" : "#4F46E5",
                  color: "#FFF",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: loading || !companyName.trim() || !industry.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                {loading ? (
                  <>
                    <Loader size={20} style={{ animation: "spin 1s linear infinite" }} />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue to Assessment
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div style={{ textAlign: "center", marginTop: 24, color: "#9CA3AF", fontSize: 13 }}>
            You can update this information later in your account settings.
          </div>
        </main>
      </div>
    </AppShell>
  );
}
