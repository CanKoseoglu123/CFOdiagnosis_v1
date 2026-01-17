// src/pages/PlatformPage.jsx
// Platform page - How CFO Lens works, aligned with value proposition

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo, LogoIcon, BRAND_COLORS } from '../components/Logo';
import {
  ArrowRight,
  Building2,
  Target,
  ClipboardList,
  Layers,
  AlertTriangle,
  Shield,
  Swords,
  Sparkles,
  FileText,
  ChevronRight,
} from 'lucide-react';

export default function PlatformPage() {
  const { isAuthenticated, user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* NAVIGATION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left side: Logo + Nav Links */}
          <div className="flex items-center">
            <Link to="/">
              <Logo size="sm" />
            </Link>

            {/* Divider */}
            <div className="hidden sm:block h-6 w-px bg-slate-200 mx-6" />

            {/* Nav Links */}
            <div className="hidden sm:flex items-center gap-1">
              <Link
                to="/platform"
                className="px-3 py-2 text-sm font-medium transition-colors"
                style={{ color: BRAND_COLORS.navy }}
              >
                Platform
              </Link>
              <Link
                to="/blog"
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Blog
              </Link>
              <Link
                to="/about"
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                About
              </Link>
            </div>
          </div>

          {/* Right side: Auth */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex flex-col items-end mr-2">
                  <span className="text-sm font-medium text-slate-700">Welcome back</span>
                  <span className="text-xs text-slate-500">{user?.email}</span>
                </div>
                <Link
                  to="/"
                  className="px-4 py-2 text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  Dashboard
                </Link>
                <button
                  onClick={signOut}
                  className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/request-access"
                  className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
                >
                  Request Access
                </Link>
                <Link
                  to="/login"
                  className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
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
      {/* HEADER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <p
              className="text-sm font-medium tracking-wide uppercase mb-4"
              style={{ color: BRAND_COLORS.gold }}
            >
              How It Works
            </p>
            <h1
              className="text-4xl sm:text-5xl font-bold mb-6"
              style={{ color: BRAND_COLORS.navy }}
            >
              A Finance Diagnostic Engine
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              CFO Lens brings your finance function into focus. It answers two questions:{' '}
              <span className="font-medium text-slate-800">
                Where does my FP&A function stand?
              </span>{' '}
              And{' '}
              <span className="font-medium text-slate-800">
                what's the fastest path to close the gaps that matter?
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* THE JOURNEY - 9 Steps */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: BRAND_COLORS.navy }}
            >
              From Diagnosis to Action Plan
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              The diagnostic methodology of a top-tier consulting engagement—compressed into hours.
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  1
                </div>
                <Building2 className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                Intelligent Company Profiling
              </h3>
              <p className="text-sm text-slate-600">
                Not just your industry—your financial character. Size, ownership, margin profile,
                leverage. A PE-backed company has different priorities than a family business.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  2
                </div>
                <Target className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                Context-Aware Benchmarking
              </h3>
              <p className="text-sm text-slate-600">
                What "good" looks like for a $50M company is different from $500M.
                Benchmarks calibrated to companies like yours—not generic templates.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  3
                </div>
                <ClipboardList className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                Structured Assessment
              </h3>
              <p className="text-sm text-slate-600">
                Targeted questions across 26 FP&A practices, 9 objectives, 3 themes.
                Each question maps to exactly one capability—no ambiguity, no overlap.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  4
                </div>
                <Layers className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                Three-Stage Maturity Journey
              </h3>
              <p className="text-sm text-slate-600">
                Foundation (trust the numbers), Future (forecast with agility),
                Intelligence (drive strategic value). Know where you are on the journey.
              </p>
            </div>

            {/* Step 5 */}
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  5
                </div>
                <AlertTriangle className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                Gap & Risk Identification
              </h3>
              <p className="text-sm text-slate-600">
                Gaps tagged by root cause: People, Process, Technology, Data.
                The path forward for a technology gap is different from a culture gap.
              </p>
            </div>

            {/* Step 6 */}
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  6
                </div>
                <Shield className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                Scoring with Guard Rails
              </h3>
              <p className="text-sm text-slate-600">
                Fair but firm. High scores in easy areas don't mask critical gaps elsewhere.
                Critical gates prevent misleading maturity levels.
              </p>
            </div>

            {/* Step 7 */}
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: BRAND_COLORS.gold }}
                >
                  7
                </div>
                <Swords className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                The War Room
              </h3>
              <p className="text-sm text-slate-600">
                Results feed into a prioritized initiative list. Select actions, commit to timelines,
                watch your projected maturity shift. Build the roadmap you can defend.
              </p>
            </div>

            {/* Step 8 */}
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  8
                </div>
                <Sparkles className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                AI Interpretation
              </h3>
              <p className="text-sm text-slate-600">
                AI generates narrative explanations—executive summaries, practice-level insights.
                But it never changes your scores. It explains; it doesn't grade.
              </p>
            </div>

            {/* Step 9 */}
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  9
                </div>
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                Executive Report
              </h3>
              <p className="text-sm text-slate-600">
                A polished, board-ready document. Not a dashboard screenshot—a professional
                deliverable that positions you as strategic, not reactive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* THE THREE STAGES */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: BRAND_COLORS.navy }}
            >
              The Maturity Journey
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Every FP&A function evolves through three stages. The diagnostic shows you
              where you stand—and what it takes to move forward.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Foundation */}
            <div className="relative">
              <div
                className="absolute top-0 left-0 w-1 h-full"
                style={{ backgroundColor: BRAND_COLORS.navy }}
              />
              <div className="pl-6">
                <div
                  className="text-sm font-medium uppercase tracking-wide mb-2"
                  style={{ color: BRAND_COLORS.gold }}
                >
                  Stage 1
                </div>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ color: BRAND_COLORS.navy }}
                >
                  The Foundation
                </h3>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Control & Trust
                </p>
                <p className="text-slate-600 text-sm">
                  Can leadership trust your numbers? Do budgets hold?
                  Are variances explained with substance, not timing excuses?
                </p>
              </div>
            </div>

            {/* Future */}
            <div className="relative">
              <div
                className="absolute top-0 left-0 w-1 h-full"
                style={{ backgroundColor: BRAND_COLORS.navy }}
              />
              <div className="pl-6">
                <div
                  className="text-sm font-medium uppercase tracking-wide mb-2"
                  style={{ color: BRAND_COLORS.gold }}
                >
                  Stage 2
                </div>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ color: BRAND_COLORS.navy }}
                >
                  The Future
                </h3>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Speed & Agility
                </p>
                <p className="text-slate-600 text-sm">
                  Can you forecast quickly and adapt when plans change?
                  Does your rolling forecast actually roll?
                </p>
              </div>
            </div>

            {/* Intelligence */}
            <div className="relative">
              <div
                className="absolute top-0 left-0 w-1 h-full"
                style={{ backgroundColor: BRAND_COLORS.gold }}
              />
              <div className="pl-6">
                <div
                  className="text-sm font-medium uppercase tracking-wide mb-2"
                  style={{ color: BRAND_COLORS.gold }}
                >
                  Stage 3
                </div>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ color: BRAND_COLORS.navy }}
                >
                  The Intelligence
                </h3>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Value & Influence
                </p>
                <p className="text-slate-600 text-sm">
                  Are you a strategic partner or just a reporting function?
                  When was the last time Finance actually shaped a decision?
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* WHERE WE'RE HEADED */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p
                className="text-sm font-medium uppercase tracking-wide mb-3"
                style={{ color: BRAND_COLORS.gold }}
              >
                The Vision
              </p>
              <h2
                className="text-3xl font-bold mb-6"
                style={{ color: BRAND_COLORS.navy }}
              >
                Beyond FP&A
              </h2>
              <p className="text-slate-600 mb-4">
                FP&A is where we start. But the CFO's responsibilities extend far beyond
                planning and analysis. Each area faces the same structural challenge—leaders
                sense there's room to improve but lack the time, frameworks, and benchmarks
                to assess it systematically.
              </p>
              <p className="text-slate-600">
                CFO Lens brings diagnostic rigor to all of them. Same methodology. Same rigor.
                Same path from diagnosis to action.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'FP&A', status: 'Live' },
                { name: 'Accounting & Close', status: 'Coming' },
                { name: 'Treasury & Cash', status: 'Coming' },
                { name: 'Tax', status: 'Coming' },
                { name: 'Finance Team & Org', status: 'Coming' },
                { name: 'Risk & Compliance', status: 'Coming' },
                { name: 'AI Readiness', status: 'Coming' },
                { name: 'Value Creation', status: 'Coming' },
              ].map((pillar) => (
                <div
                  key={pillar.name}
                  className={`p-4 border ${
                    pillar.status === 'Live'
                      ? 'bg-white border-slate-300'
                      : 'bg-slate-100/50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${
                        pillar.status === 'Live' ? 'text-slate-800' : 'text-slate-500'
                      }`}
                    >
                      {pillar.name}
                    </span>
                    {pillar.status === 'Live' && (
                      <span
                        className="text-xs font-medium px-2 py-0.5"
                        style={{ backgroundColor: `${BRAND_COLORS.gold}20`, color: BRAND_COLORS.gold }}
                      >
                        Live
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CTA */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <LogoIcon size={48} className="mx-auto mb-6" />

          <h2
            className="text-3xl font-bold mb-6"
            style={{ color: BRAND_COLORS.navy }}
          >
            Ready to see where you stand?
          </h2>

          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            The diagnosis and action-planning phase of a consulting engagement—compressed
            into hours, at a fraction of the cost—with a simulation tool consultants don't leave behind.
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
              Diagnostic intelligence for finance leaders everywhere.
            </p>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} CFO Lens AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
