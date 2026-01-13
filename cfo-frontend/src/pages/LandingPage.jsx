// src/pages/LandingPage.jsx
// Landing page - problem-focused, no overselling

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo, LogoIcon, BRAND_COLORS } from '../components/Logo';
import { supabase } from '../lib/supabase';
import {
  ArrowRight,
  X,
  Zap,
  Crosshair,
  Layers,
  GitBranch,
} from 'lucide-react';
import FeedbackButton from '../components/FeedbackButton';

const API_URL = import.meta.env.VITE_API_URL;
const FIRST_OBJECTIVE = 'obj_budget_discipline';

// Helper to extract company name from run
function getCompanyName(run) {
  // V2 format: company_name from joined company_profiles
  if (run.company_name) return run.company_name;
  // V1 format: context.company.name
  if (run.context?.company?.name) return run.context.company.name;
  // Legacy format: context.company_name
  if (run.context?.company_name) return run.context.company_name;
  return 'Untitled Assessment';
}

// Helper to get status badge styling
function getStatusBadge(status) {
  switch (status) {
    case 'locked':
      return { label: 'Finalized', color: 'bg-amber-100 text-amber-700' };
    case 'completed':
      return { label: 'Completed', color: 'bg-green-100 text-green-700' };
    case 'in_progress':
      return { label: 'In Progress', color: 'bg-blue-100 text-blue-700' };
    default:
      return { label: 'Draft', color: 'bg-slate-100 text-slate-600' };
  }
}

export default function LandingPage() {
  const { isAuthenticated, user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [showRunsModal, setShowRunsModal] = useState(false);
  const [checkingRuns, setCheckingRuns] = useState(false);
  const [allRuns, setAllRuns] = useState([]);

  async function handleDashboardClick(e) {
    e.preventDefault();
    setCheckingRuns(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${API_URL}/diagnostic-runs`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const runs = await res.json();
        // Filter out 'created' status (empty runs with no setup)
        const actionableRuns = runs.filter(r => r.status !== 'created');
        setAllRuns(actionableRuns);
        setShowRunsModal(true);
      } else {
        setAllRuns([]);
        setShowRunsModal(true);
      }
    } catch (err) {
      console.error('Error checking runs:', err);
      setAllRuns([]);
      setShowRunsModal(true);
    } finally {
      setCheckingRuns(false);
    }
  }

  function handleRunClick(run) {
    setShowRunsModal(false);

    if (run.status === 'completed' || run.status === 'locked') {
      navigate(`/report/${run.id}`);
    } else {
      // In-progress: check if setup is complete (already in fetch response)
      if (run.setup_completed_at) {
        navigate(`/assess/objective/${FIRST_OBJECTIVE}?runId=${run.id}`);
      } else {
        navigate(`/run/${run.id}/setup/company`);
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* NAVIGATION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="sm" />

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-500 hidden sm:block">
                  {user?.email}
                </span>
                <button
                  onClick={handleDashboardClick}
                  disabled={checkingRuns}
                  className="px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-70"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  {checkingRuns ? 'Loading...' : 'My Reports'}
                </button>
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HERO - Centered */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p
            className="text-sm font-medium tracking-wide uppercase mb-4"
            style={{ color: BRAND_COLORS.gold }}
          >
            Created for Finance Leaders by Finance Leaders
          </p>

          <h1
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-tight"
            style={{ color: BRAND_COLORS.navy }}
          >
            Build the FP&A function your business deserves.
          </h1>

          <p className="text-lg text-slate-600 mb-6 leading-relaxed">
            Variance explanations that take three days. Forecasts nobody trusts.
            Rolling reforecasts that never roll. The strategic work keeps getting
            pushed to "next quarter." Every quarter.
          </p>

          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            You already know your FP&A function has gaps. You need a
            structured way to articulate them clearly, prioritize what to fix,
            and get it done.
          </p>

          <Link
            to={isAuthenticated ? '/select-pillar' : '/login'}
            className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: BRAND_COLORS.navy }}
          >
            Start the FP&A Diagnostic
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* THE OFFERING */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <LogoIcon size={32} />
              <span
                className="text-sm font-medium uppercase tracking-wide"
                style={{ color: BRAND_COLORS.gold }}
              >
                What We're Offering
              </span>
            </div>

            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: BRAND_COLORS.navy }}
            >
              A Finance Diagnostic Engine
            </h2>

            <p className="text-slate-600 leading-relaxed max-w-2xl mx-auto">
              A platform that brings your FP&A function into focus and gives you the
              framing and action plan to fix it yourself. No consultants required.
            </p>
          </div>

          {/* Three outcomes */}
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 p-6">
              <div
                className="text-5xl font-bold mb-4"
                style={{ color: BRAND_COLORS.navy }}
              >
                1
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                A clear picture of where your FP&A function stands
              </h3>
              <p className="text-sm text-slate-600">
                60 questions. Maturity scored across the full FP&A landscape.
                Gaps tagged by root cause: People, Process, Technology, or Data.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6">
              <div
                className="text-5xl font-bold mb-4"
                style={{ color: BRAND_COLORS.navy }}
              >
                2
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                A prioritized list of what to fix first
              </h3>
              <p className="text-sm text-slate-600">
                Initiatives ranked by impact and complexity. Know what matters most
                and what can wait.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6">
              <div
                className="text-5xl font-bold mb-4"
                style={{ color: BRAND_COLORS.navy }}
              >
                3
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                A simulator to test different improvement paths
              </h3>
              <p className="text-sm text-slate-600">
                Toggle initiatives on and off. Commit to a timeline. Watch your
                projected maturity shift in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* THE REPORTS - Key Differentiator */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: BRAND_COLORS.navy }}
            >
              Build the roadmap that will make a difference
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Comprehensive reports and planning tools that help you identify the right actions
              to improve the maturity of your FP&A function — and track progress over time.
            </p>
          </div>

          {/* Stacked Report Cards */}
          <div className="relative h-80 sm:h-96 mx-auto max-w-4xl">
            {/* Card 1 - Executive Summary (bottom layer) */}
            <div
              className="absolute left-[10%] top-0 w-[55%] aspect-[4/3] rounded-lg shadow-xl overflow-hidden border border-slate-200 z-0"
              style={{
                transform: 'rotate(-2deg)',
                filter: 'blur(1.5px)'
              }}
            >
              <img
                src="/report-overview.png.png"
                alt="Executive Summary Report"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-white/10" />
            </div>

            {/* Card 2 - Maturity Footprint (middle layer) */}
            <div
              className="absolute left-1/2 -translate-x-1/2 top-6 w-[55%] aspect-[4/3] rounded-lg shadow-xl overflow-hidden border border-slate-200 z-10"
              style={{
                filter: 'blur(0.75px)'
              }}
            >
              <img
                src="/report-footprint.png.png"
                alt="Maturity Footprint Report"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-white/5" />
            </div>

            {/* Card 3 - Action Planning Simulator (top layer) */}
            <div
              className="absolute right-[10%] top-12 w-[55%] aspect-[4/3] rounded-lg shadow-2xl overflow-hidden border border-slate-200 z-20"
              style={{
                transform: 'rotate(2deg)',
                filter: 'blur(0px)'
              }}
            >
              <img
                src="/report-simulator.png.png"
                alt="Action Planning Simulator"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* WHAT YOU SHOULD KNOW - Honest */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-2xl font-bold mb-8 text-center"
            style={{ color: BRAND_COLORS.navy }}
          >
            What You Should Know
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-start gap-3">
                <Crosshair className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">
                    Self-assessment requires honesty
                  </h3>
                  <p className="text-sm text-slate-600">
                    If your team believes they're more mature than they are, the scores
                    will reflect that. Works best with input from stakeholders who'll tell the truth.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-start gap-3">
                <Layers className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">
                    Diagnosis and planning, not execution
                  </h3>
                  <p className="text-sm text-slate-600">
                    It tells you what to fix and in what order. The transformation work—hiring,
                    implementing systems, changing processes—is still yours to do.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* THE PITCH */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <LogoIcon size={48} className="mx-auto mb-6" />

          <h2
            className="text-3xl sm:text-4xl font-bold mb-6"
            style={{ color: BRAND_COLORS.navy }}
          >
            See clearly. Prioritize confidently.
            <br />
            <span style={{ color: BRAND_COLORS.gold }}>Act decisively.</span>
          </h2>

          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            A structured diagnostic that shows you exactly where your FP&A function stands,
            what to fix first, and how to build a plan that leadership will fund.
          </p>

          {/* Comparison */}
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            <div className="p-6">
              <Zap className="w-8 h-8 mx-auto mb-3" style={{ color: BRAND_COLORS.gold }} />
              <div className="font-semibold text-slate-800 mb-1">Speed</div>
              <div className="text-sm text-slate-600">Diagnosis in a single session</div>
            </div>
            <div className="p-6">
              <Crosshair className="w-8 h-8 mx-auto mb-3" style={{ color: BRAND_COLORS.gold }} />
              <div className="font-semibold text-slate-800 mb-1">Clarity</div>
              <div className="text-sm text-slate-600">See exactly where you stand</div>
            </div>
            <div className="p-6">
              <GitBranch className="w-8 h-8 mx-auto mb-3" style={{ color: BRAND_COLORS.gold }} />
              <div className="font-semibold text-slate-800 mb-1">A Plan</div>
              <div className="text-sm text-slate-600">Prioritized and ready to execute</div>
            </div>
          </div>

          <Link
            to={isAuthenticated ? '/select-pillar' : '/login'}
            className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: BRAND_COLORS.navy }}
          >
            Start the FP&A Diagnostic
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FOOTER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <footer
        className="py-12 px-6 border-t border-slate-200"
        style={{ backgroundColor: `${BRAND_COLORS.navy}05` }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Logo size="sm" />
            <p className="text-sm text-slate-500">
              The diagnosis and action plan phase of a consulting engagement—compressed
              into hours, at a fraction of the cost.
            </p>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} CFO Lens AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Feedback Button */}
      <FeedbackButton currentPage="landing" />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MY ASSESSMENTS MODAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showRunsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowRunsModal(false)} />

          <div className="relative bg-white shadow-xl w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">My Assessments</h3>
              <button onClick={() => setShowRunsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Runs List */}
            <div className="max-h-96 overflow-y-auto">
              {allRuns.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <p className="mb-4">No assessments found.</p>
                  <Link
                    to="/select-pillar"
                    onClick={() => setShowRunsModal(false)}
                    className="inline-block px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: BRAND_COLORS.navy }}
                  >
                    Start Assessment
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {allRuns.map(run => {
                    const badge = getStatusBadge(run.status);
                    return (
                      <button
                        key={run.id}
                        onClick={() => handleRunClick(run)}
                        className="w-full p-4 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 truncate">
                              {getCompanyName(run)}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              FP&A Assessment
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-500">
                              <span className={`px-2 py-0.5 text-xs font-medium ${badge.color}`}>
                                {badge.label}
                              </span>
                              <span>•</span>
                              <span>Started {new Date(run.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-slate-400">
                              {run.status === 'in_progress' ? 'Continue' : 'View'}
                            </span>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {allRuns.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <Link
                  to="/select-pillar"
                  onClick={() => setShowRunsModal(false)}
                  className="text-sm font-medium hover:underline"
                  style={{ color: BRAND_COLORS.navy }}
                >
                  + Start New Assessment
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
