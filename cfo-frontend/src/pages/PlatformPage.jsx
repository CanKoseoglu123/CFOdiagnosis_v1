// src/pages/PlatformPage.jsx
// Platform page - matches Blog page style

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo, BRAND_COLORS } from '../components/Logo';
import { ArrowRight, Target, BarChart3, ClipboardCheck } from 'lucide-react';

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
      <section className="pt-24 pb-8 px-6 border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <h1
            className="text-4xl sm:text-5xl font-bold"
            style={{ color: BRAND_COLORS.navy }}
          >
            The Platform
          </h1>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* INTRO */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <p className="text-lg text-slate-600 leading-relaxed mb-4">
              CFO Lens is a structured diagnostic that evaluates your finance function
              across 9 objectives, 26 practices, and 97 capability indicators.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              Get a clear picture of where you stand, benchmark against your peers,
              and build a prioritized action plan.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HOW IT WORKS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-12 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-2xl font-bold mb-8"
            style={{ color: BRAND_COLORS.navy }}
          >
            How it works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 border border-slate-200">
              <div
                className="w-12 h-12 flex items-center justify-center mb-4"
                style={{ backgroundColor: `${BRAND_COLORS.navy}10` }}
              >
                <ClipboardCheck className="w-6 h-6" style={{ color: BRAND_COLORS.navy }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: BRAND_COLORS.navy }}>
                1. Diagnose
              </h3>
              <p className="text-slate-600 text-sm">
                Answer 97 questions across 9 FP&A objectives. Takes about 45 minutes.
                Your responses reveal maturity gaps and critical risks.
              </p>
            </div>

            <div className="bg-white p-6 border border-slate-200">
              <div
                className="w-12 h-12 flex items-center justify-center mb-4"
                style={{ backgroundColor: `${BRAND_COLORS.navy}10` }}
              >
                <Target className="w-6 h-6" style={{ color: BRAND_COLORS.navy }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: BRAND_COLORS.navy }}>
                2. Prioritize
              </h3>
              <p className="text-slate-600 text-sm">
                See your maturity level, benchmark against targets, and identify
                high-impact improvements with our Priority Matrix.
              </p>
            </div>

            <div className="bg-white p-6 border border-slate-200">
              <div
                className="w-12 h-12 flex items-center justify-center mb-4"
                style={{ backgroundColor: `${BRAND_COLORS.navy}10` }}
              >
                <BarChart3 className="w-6 h-6" style={{ color: BRAND_COLORS.navy }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: BRAND_COLORS.navy }}>
                3. Act
              </h3>
              <p className="text-slate-600 text-sm">
                Build an action plan with timelines and owners. Generate an executive
                report to align stakeholders and drive change.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CTA */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: BRAND_COLORS.navy }}
          >
            Ready to assess your FP&A function?
          </h2>
          <p className="text-slate-600 mb-8 max-w-xl mx-auto">
            The diagnosis and action plan phase of a consulting engagement—compressed
            into hours, at a fraction of the cost.
          </p>
          <Link
            to={isAuthenticated ? '/select-pillar' : '/login'}
            className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: BRAND_COLORS.navy }}
          >
            Start Assessment
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
    </div>
  );
}
