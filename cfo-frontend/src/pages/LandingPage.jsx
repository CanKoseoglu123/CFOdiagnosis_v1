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
  AlertCircle,
  Clock,
  DollarSign,
  Zap,
  Play,
  ChevronRight,
  Crosshair,
  Layers,
  GitBranch,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

export default function LandingPage() {
  const { isAuthenticated, user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [checkingRuns, setCheckingRuns] = useState(false);

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
        const completedRun = runs.find(r => r.status === 'completed' || r.status === 'locked');

        if (completedRun) {
          navigate(`/report/${completedRun.id}`);
        } else {
          setShowIncompleteModal(true);
        }
      } else {
        setShowIncompleteModal(true);
      }
    } catch (err) {
      console.error('Error checking runs:', err);
      setShowIncompleteModal(true);
    } finally {
      setCheckingRuns(false);
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
      {/* HERO - Problem Focused */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Problem Statement */}
            <div>
              <p
                className="text-sm font-medium tracking-wide uppercase mb-4"
                style={{ color: BRAND_COLORS.gold }}
              >
                For Finance Leaders at $50M–$500M Companies
              </p>

              <h1
                className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-tight"
                style={{ color: BRAND_COLORS.navy }}
              >
                You can't fix the function while you're running the function.
              </h1>

              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Variance explanations that take three days. Forecasts nobody trusts.
                Rolling reforecasts that never roll. The strategic work keeps getting
                pushed to "next quarter." Every quarter.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  to={isAuthenticated ? '/assess' : '/login'}
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  Start the Diagnostic
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span>~25 minutes</span>
                  <span className="text-slate-300">|</span>
                  <span>No credit card</span>
                </div>
              </div>
            </div>

            {/* Right: Visual - The Trap */}
            <div className="relative">
              <div
                className="absolute -inset-4 opacity-5 rounded-sm"
                style={{ backgroundColor: BRAND_COLORS.navy }}
              />
              <div className="relative bg-slate-50 border border-slate-200 p-8">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-6">
                  The Typical Path
                </div>

                {/* Two paths visualization */}
                <div className="space-y-4">
                  {/* Path 1: Consultants */}
                  <div className="flex items-start gap-4 p-4 bg-white border border-slate-200">
                    <div className="w-10 h-10 flex items-center justify-center bg-slate-100 shrink-0">
                      <DollarSign className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-700 mb-1">Hire Consultants</div>
                      <div className="text-sm text-slate-500">
                        $50k+ and 6 weeks for a PDF and presentation.
                        Then the real work begins.
                      </div>
                    </div>
                  </div>

                  {/* OR divider */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs font-medium text-slate-400">OR</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  {/* Path 2: Live with it */}
                  <div className="flex items-start gap-4 p-4 bg-white border border-slate-200">
                    <div className="w-10 h-10 flex items-center justify-center bg-slate-100 shrink-0">
                      <Clock className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-700 mb-1">Live With It</div>
                      <div className="text-sm text-slate-500">
                        Hope the dysfunction doesn't blow up.
                        Push strategic work to next quarter. Again.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* THE OFFERING */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Left: What it is */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
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

              <p className="text-slate-600 leading-relaxed">
                A platform that brings your FP&A function into focus and gives you the
                framing and action plan to fix it yourself. No consultants required.
              </p>
            </div>

            {/* Right: The two questions */}
            <div className="lg:col-span-3">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 p-6">
                  <div
                    className="text-5xl font-bold mb-4"
                    style={{ color: BRAND_COLORS.navy }}
                  >
                    1
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">
                    Where is my FP&A function broken?
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
                    What happens if I fix it?
                  </h3>
                  <p className="text-sm text-slate-600">
                    Open the Simulator. Toggle an initiative on. Commit to a timeline.
                    Watch your projected maturity shift in real time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* THE SIMULATOR - Key Differentiator */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: BRAND_COLORS.navy }}
            >
              Build the roadmap you'll actually take to the CEO
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Unlike a consulting report that sits in a drawer, the Simulator stays live.
              Revisit as conditions change. Reprioritize on the fly.
            </p>
          </div>

          {/* Simulator Preview */}
          <div className="relative">
            <div
              className="absolute -inset-2 opacity-5 rounded-sm"
              style={{ backgroundColor: BRAND_COLORS.navy }}
            />
            <div className="relative bg-white border border-slate-200 overflow-hidden">
              {/* Header */}
              <div
                className="px-6 py-4 border-b border-slate-200 flex items-center justify-between"
                style={{ backgroundColor: `${BRAND_COLORS.navy}08` }}
              >
                <div className="flex items-center gap-3">
                  <LogoIcon size={24} />
                  <span className="font-semibold text-slate-700">Action Planning Simulator</span>
                </div>
                <span className="text-xs text-slate-400">Interactive Preview</span>
              </div>

              {/* Simulator Content */}
              <div className="grid lg:grid-cols-3 divide-x divide-slate-200">
                {/* Left: Initiative List */}
                <div className="p-6">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">
                    Prioritized Initiatives
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'Driver-Based Forecasting', impact: 'High', complexity: 'Med', selected: true },
                      { name: 'Rolling Forecast Cadence', impact: 'High', complexity: 'Low', selected: true },
                      { name: 'Variance Root Cause Analysis', impact: 'Med', complexity: 'Low', selected: false },
                      { name: 'Scenario Planning Framework', impact: 'High', complexity: 'High', selected: false },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-3 border ${item.selected ? 'border-blue-200 bg-blue-50' : 'border-slate-200'}`}
                      >
                        <div
                          className={`w-5 h-5 border-2 flex items-center justify-center ${item.selected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}
                        >
                          {item.selected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-700 truncate">{item.name}</div>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs text-slate-400">Impact: {item.impact}</span>
                            <span className="text-xs text-slate-400">|</span>
                            <span className="text-xs text-slate-400">Complexity: {item.complexity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Middle: Timeline Selection */}
                <div className="p-6">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">
                    Commit Timeline
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: '6 months', desc: 'Quick wins', active: true },
                      { label: '12 months', desc: 'Core improvements', active: true },
                      { label: '24 months', desc: 'Transformational', active: false },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={`p-4 border ${item.active ? 'border-slate-300 bg-slate-50' : 'border-slate-200'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-700">{item.label}</span>
                          {item.active && (
                            <span
                              className="text-xs font-medium px-2 py-0.5"
                              style={{ backgroundColor: `${BRAND_COLORS.gold}20`, color: BRAND_COLORS.gold }}
                            >
                              {i === 0 ? '2 initiatives' : '2 initiatives'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Projection */}
                <div className="p-6" style={{ backgroundColor: `${BRAND_COLORS.navy}05` }}>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">
                    Projected Impact
                  </div>

                  {/* Maturity Level Shift */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-slate-400">L2</div>
                        <div className="text-xs text-slate-400">Current</div>
                      </div>
                      <ArrowRight className="w-6 h-6 text-slate-300" />
                      <div className="text-center">
                        <div
                          className="text-3xl font-bold"
                          style={{ color: BRAND_COLORS.gold }}
                        >
                          L3
                        </div>
                        <div className="text-xs" style={{ color: BRAND_COLORS.gold }}>Projected</div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 mt-4">
                      Managed maturity level achievable in 12 months
                    </div>
                  </div>

                  {/* Score Change */}
                  <div className="bg-white border border-slate-200 p-4">
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-sm text-slate-600">Execution Score</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm text-slate-400 line-through">52%</span>
                        <span className="text-lg font-bold" style={{ color: BRAND_COLORS.navy }}>71%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: '71%', backgroundColor: BRAND_COLORS.navy }}
                      />
                    </div>
                  </div>
                </div>
              </div>
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
            Consultants give you cover.
            <br />
            <span style={{ color: BRAND_COLORS.gold }}>CFO Lens gives you clarity.</span>
          </h2>

          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            You already know your FP&A function has gaps. What you need is a structured way
            to see them clearly, prioritize them, simulate the path forward, and build a case
            for investment that leadership will fund.
          </p>

          {/* Comparison */}
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            <div className="p-6">
              <Zap className="w-8 h-8 mx-auto mb-3" style={{ color: BRAND_COLORS.gold }} />
              <div className="font-semibold text-slate-800 mb-1">Speed</div>
              <div className="text-sm text-slate-600">Hours, not weeks</div>
            </div>
            <div className="p-6">
              <Crosshair className="w-8 h-8 mx-auto mb-3" style={{ color: BRAND_COLORS.gold }} />
              <div className="font-semibold text-slate-800 mb-1">Clarity</div>
              <div className="text-sm text-slate-600">Structured diagnosis</div>
            </div>
            <div className="p-6">
              <GitBranch className="w-8 h-8 mx-auto mb-3" style={{ color: BRAND_COLORS.gold }} />
              <div className="font-semibold text-slate-800 mb-1">A Plan</div>
              <div className="text-sm text-slate-600">You can actually use</div>
            </div>
          </div>

          <Link
            to={isAuthenticated ? '/assess' : '/login'}
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* INCOMPLETE DIAGNOSIS MODAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showIncompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowIncompleteModal(false)}
          />

          <div className="relative bg-white shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-semibold text-slate-800">
                  No Reports Available
                </h3>
              </div>
              <button
                onClick={() => setShowIncompleteModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-slate-600 mb-6">
                You haven't completed a diagnostic assessment yet. Complete the
                assessment to generate your personalized report and action plan.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowIncompleteModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <Link
                  to="/assess"
                  onClick={() => setShowIncompleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  Start Assessment
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
