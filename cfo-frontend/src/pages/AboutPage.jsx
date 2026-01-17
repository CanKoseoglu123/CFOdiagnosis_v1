// src/pages/AboutPage.jsx
// About page - matches Blog page style

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo, BRAND_COLORS } from '../components/Logo';
import { ArrowRight } from 'lucide-react';

export default function AboutPage() {
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
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
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
                className="px-3 py-2 text-sm font-medium transition-colors"
                style={{ color: BRAND_COLORS.navy }}
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
            About Us
          </h1>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STORY */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: BRAND_COLORS.navy }}
            >
              Built by Finance Leaders, for Finance Leaders
            </h2>

            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                After years of running FP&A transformations at companies of all sizes,
                we noticed a pattern: the diagnostic phase of any consulting engagement
                follows the same structure. The questions are predictable. The gaps are
                common. The prioritization frameworks are well-established.
              </p>

              <p>
                Yet companies were paying premium rates for consultants to rediscover
                the same insights, project after project. Meanwhile, finance leaders
                at smaller organizations couldn't access these frameworks at all.
              </p>

              <p>
                CFO Lens changes that. We've codified the diagnostic methodology into
                a structured assessment that any finance leader can complete in under
                an hour. You get the same rigorous analysis, the same prioritization
                frameworks, and the same actionable roadmap—without the six-figure
                consulting bill.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MISSION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-12 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: BRAND_COLORS.navy }}
            >
              Our Mission
            </h2>

            <p className="text-lg text-slate-600 leading-relaxed">
              To democratize access to world-class finance diagnostics, giving every
              organization—regardless of size or budget—the tools to build a
              high-performing FP&A function.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CTA */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div>
              <h3
                className="text-xl font-semibold mb-2"
                style={{ color: BRAND_COLORS.navy }}
              >
                Want to learn more?
              </h3>
              <p className="text-slate-600">
                Explore our blog or start your assessment today.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-slate-300 hover:bg-slate-50 transition-colors"
                style={{ color: BRAND_COLORS.navy }}
              >
                Read Our Blog
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={isAuthenticated ? '/select-pillar' : '/request-access'}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ backgroundColor: BRAND_COLORS.navy }}
              >
                {isAuthenticated ? 'Start Assessment' : 'Request Access'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
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
