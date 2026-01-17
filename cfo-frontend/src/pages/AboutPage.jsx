// src/pages/AboutPage.jsx
// About page - The problem, the vision, and who it's for

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo, LogoIcon, BRAND_COLORS } from '../components/Logo';
import {
  ArrowRight,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Quote,
} from 'lucide-react';

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
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <p
              className="text-sm font-medium tracking-wide uppercase mb-4"
              style={{ color: BRAND_COLORS.gold }}
            >
              Why We Built This
            </p>
            <h1
              className="text-4xl sm:text-5xl font-bold mb-6"
              style={{ color: BRAND_COLORS.navy }}
            >
              The Trap Every Finance Leader Knows
            </h1>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* THE PROBLEM */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
              <p>
                You know something isn't working. You feel it in the variance explanations
                that take three days, the forecasts nobody trusts, the rolling reforecasts
                that never roll.
              </p>

              <p>
                Your team is stuck in reactive mode—closing the books, answering ad-hoc requests,
                firefighting—with no time to step back and address the underlying issues.
              </p>

              <p className="font-medium text-slate-800">
                And that's the trap.
              </p>

              <p>
                You can't improve the function while you're running the function. There's always
                a board deck due, a reforecast cycle starting, a headcount question from the CEO.
                The strategic work—diagnosing what needs to change, building a case for investment,
                sequencing the improvements—gets pushed to "next quarter." Every quarter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* THE OLD WAY */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-12 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2
                className="text-2xl font-bold mb-6"
                style={{ color: BRAND_COLORS.navy }}
              >
                Until now, the path forward has been consultants.
              </h2>
              <p className="text-slate-600 mb-4">
                Six-figure engagements and months of work just to produce a diagnosis
                and recommendations. Large enterprises can justify that investment.
                Most companies can't.
              </p>
              <p className="text-slate-600">
                And here's what nobody talks about: the diagnostic phase of any consulting
                engagement follows the same structure. The questions are predictable.
                The gaps are common. The prioritization frameworks are well-established.
              </p>
            </div>

            <div className="flex items-center justify-center">
              <div
                className="p-8 border-l-4"
                style={{ borderColor: BRAND_COLORS.gold, backgroundColor: `${BRAND_COLORS.navy}05` }}
              >
                <Quote className="w-8 h-8 mb-4" style={{ color: BRAND_COLORS.gold }} />
                <p className="text-lg text-slate-700 italic">
                  "Companies were paying premium rates for consultants to rediscover the same
                  insights, project after project. Meanwhile, finance leaders at smaller
                  organizations couldn't access these frameworks at all."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* THE VISION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <LogoIcon size={48} className="mx-auto mb-6" />
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: BRAND_COLORS.navy }}
            >
              Diagnostic intelligence for finance leaders everywhere.
            </h2>
            <p className="text-lg text-slate-600">
              What large enterprises get from top-tier consulting firms, we're making
              accessible to finance leaders everywhere—at a fraction of the cost,
              in a fraction of the time.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div
                className="w-12 h-12 mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${BRAND_COLORS.navy}10` }}
              >
                <Clock className="w-6 h-6" style={{ color: BRAND_COLORS.navy }} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Hours, Not Months</h3>
              <p className="text-sm text-slate-600">
                Complete a rigorous diagnostic in a single session.
                Get your action plan the same day.
              </p>
            </div>

            <div className="text-center p-6">
              <div
                className="w-12 h-12 mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${BRAND_COLORS.navy}10` }}
              >
                <Users className="w-6 h-6" style={{ color: BRAND_COLORS.navy }} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Built by Finance</h3>
              <p className="text-sm text-slate-600">
                Created by finance leaders who've run these transformations.
                The methodology is battle-tested.
              </p>
            </div>

            <div className="text-center p-6">
              <div
                className="w-12 h-12 mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${BRAND_COLORS.navy}10` }}
              >
                <ArrowRight className="w-6 h-6" style={{ color: BRAND_COLORS.navy }} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Yours to Keep</h3>
              <p className="text-sm text-slate-600">
                The War Room stays live. Revisit the model as conditions change.
                Reprioritize on the fly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* WHO IT'S FOR */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-2xl font-bold mb-8 text-center"
            style={{ color: BRAND_COLORS.navy }}
          >
            Who This Is For
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white border border-slate-200 p-6">
              <div
                className="text-sm font-medium uppercase tracking-wide mb-4"
                style={{ color: BRAND_COLORS.gold }}
              >
                Primary
              </div>
              <h3 className="font-semibold text-slate-800 mb-3">
                CFOs and VP-level finance leaders
              </h3>
              <p className="text-slate-600 text-sm">
                At companies with real FP&A complexity—multiple business units, outgrown spreadsheets,
                rolling forecasts that don't roll. Companies that face sophisticated challenges
                but don't have the budget for six-figure consulting engagements.
              </p>
              <p className="text-sm text-slate-500 mt-3 italic">
                You know who you are.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6">
              <div
                className="text-sm font-medium uppercase tracking-wide mb-4"
                style={{ color: BRAND_COLORS.gold }}
              >
                Secondary
              </div>
              <h3 className="font-semibold text-slate-800 mb-3">
                Finance leaders at larger enterprises
              </h3>
              <p className="text-slate-600 text-sm">
                Who need a fast, credible way to benchmark their function or build an internal
                business case before requesting transformation budget from leadership.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HONEST EXPECTATIONS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-2xl font-bold mb-8 text-center"
            style={{ color: BRAND_COLORS.navy }}
          >
            Setting Expectations
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Works Best When */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                This works best when
              </h3>
              <ul className="space-y-3 text-slate-600 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  You involve multiple stakeholders (not just one person's opinion)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  Your team is ready to confront uncomfortable truths
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  You're committed to acting on the roadmap, not just producing a report
                </li>
              </ul>
            </div>

            {/* What It's Not */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-slate-400" />
                What this isn't
              </h3>
              <ul className="space-y-3 text-slate-600 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">•</span>
                  Validation that everything is fine (if that's what you want, this will disappoint)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">•</span>
                  Execution—this is diagnosis and planning, not implementation
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">•</span>
                  A replacement for hands-on transformation work (that's still yours to lead)
                </li>
              </ul>
            </div>
          </div>

          <p className="text-center text-slate-500 text-sm mt-8 max-w-2xl mx-auto">
            The platform equips you with clarity on what to improve and in what order.
            When you need hands-on support, you'll be able to scope that engagement far more effectively.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* THE PITCH */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section
        className="py-20 px-6"
        style={{ backgroundColor: BRAND_COLORS.navy }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">
            Consultants give you cover.
            <br />
            <span style={{ color: BRAND_COLORS.gold }}>CFO Lens gives you clarity.</span>
          </h2>

          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
            You already sense there are gaps in your finance function. What you need is a
            structured way to see them clearly, understand how you compare to companies like yours,
            prioritize what matters most, simulate the path forward, and build a case for investment
            that leadership will fund.
          </p>

          <Link
            to={isAuthenticated ? '/select-pillar' : '/login'}
            className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: BRAND_COLORS.gold, color: BRAND_COLORS.navy }}
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
