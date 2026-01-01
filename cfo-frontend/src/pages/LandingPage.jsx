// src/pages/LandingPage.jsx
// Modern landing page inspired by Mollie.com

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo, LogoIcon, BRAND_COLORS } from '../components/Logo';
import {
  BarChart3,
  Brain,
  Target,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, user, signOut, loading } = useAuth();

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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="sm" />

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-500 hidden sm:block">
                  {user?.email}
                </span>
                <Link
                  to="/assess"
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  Dashboard
                </Link>
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
                  className="px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all hover:shadow-lg"
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
      {/* HERO SECTION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 mb-8">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">
              AI-Powered Finance Diagnostics
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl font-bold tracking-tight mb-6"
            style={{ color: BRAND_COLORS.navy }}
          >
            Unlock Your FP&A
            <br />
            <span style={{ color: BRAND_COLORS.gold }}>Full Potential</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Assess your finance function maturity in minutes. Get AI-powered insights
            and a personalized roadmap to transform your FP&A capabilities.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? '/assess' : '/login'}
              className="group flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white rounded-lg transition-all hover:shadow-xl"
              style={{ backgroundColor: BRAND_COLORS.navy }}
            >
              Start Free Assessment
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>No credit card required</span>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-slate-100">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-4">
              Trusted by finance leaders
            </p>
            <div className="flex items-center justify-center gap-8 text-slate-300">
              <span className="text-lg font-semibold">Fortune 500</span>
              <span className="text-lg font-semibold">PE-Backed</span>
              <span className="text-lg font-semibold">High-Growth</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FEATURES SECTION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ color: BRAND_COLORS.navy }}
            >
              How It Works
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A structured approach to evaluating and improving your finance function
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-6"
                style={{ backgroundColor: `${BRAND_COLORS.navy}10` }}
              >
                <BarChart3 className="w-6 h-6" style={{ color: BRAND_COLORS.navy }} />
              </div>
              <h3
                className="text-xl font-semibold mb-3"
                style={{ color: BRAND_COLORS.navy }}
              >
                Assess Maturity
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Answer 48 questions across budgeting, forecasting, and strategic planning
                to benchmark your current state against industry standards.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-6"
                style={{ backgroundColor: `${BRAND_COLORS.gold}20` }}
              >
                <Brain className="w-6 h-6" style={{ color: BRAND_COLORS.gold }} />
              </div>
              <h3
                className="text-xl font-semibold mb-3"
                style={{ color: BRAND_COLORS.navy }}
              >
                AI-Powered Insights
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Our AI analyzes your responses to identify critical gaps, hidden strengths,
                and prioritized opportunities tailored to your context.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-6"
                style={{ backgroundColor: '#E3FCEF' }}
              >
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <h3
                className="text-xl font-semibold mb-3"
                style={{ color: BRAND_COLORS.navy }}
              >
                Actionable Roadmap
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Get a prioritized action plan with specific initiatives, timelines, and
                expected outcomes to guide your transformation journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VALUE PROPS SECTION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <div>
              <h2
                className="text-3xl sm:text-4xl font-bold mb-6"
                style={{ color: BRAND_COLORS.navy }}
              >
                Built for Modern
                <br />
                Finance Teams
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Whether you're a CFO at a PE-backed company, an FP&A leader at a
                fast-growing startup, or a finance director at an enterprise, our
                diagnostic adapts to your unique context.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Zap, text: 'Complete assessment in under 15 minutes' },
                  { icon: Shield, text: 'Enterprise-grade security & privacy' },
                  { icon: TrendingUp, text: 'Benchmarked against 500+ organizations' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${BRAND_COLORS.gold}20` }}
                    >
                      <item.icon className="w-4 h-4" style={{ color: BRAND_COLORS.gold }} />
                    </div>
                    <span className="text-slate-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative">
              <div
                className="absolute -inset-4 rounded-2xl opacity-10"
                style={{ backgroundColor: BRAND_COLORS.navy }}
              />
              <div className="relative bg-white p-8 rounded-xl border border-slate-200 shadow-lg">
                {/* Mini dashboard preview */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <LogoIcon size={24} />
                    <span className="font-semibold text-slate-700">Your Report</span>
                  </div>
                  <span className="text-xs text-slate-400">Live Preview</span>
                </div>

                {/* Score display */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div
                      className="text-2xl font-bold"
                      style={{ color: BRAND_COLORS.navy }}
                    >
                      72%
                    </div>
                    <div className="text-xs text-slate-500">Score</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">L3</div>
                    <div className="text-xs text-slate-500">Level</div>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">12</div>
                    <div className="text-xs text-slate-500">Actions</div>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-3">
                  {['Budget Foundation', 'Forecasting', 'Strategic Planning'].map((name, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{name}</span>
                        <span className="text-slate-400">{[85, 68, 72][i]}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${[85, 68, 72][i]}%`,
                            backgroundColor: BRAND_COLORS.navy,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FINAL CTA SECTION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section
        className="py-20 px-6"
        style={{ backgroundColor: BRAND_COLORS.navy }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Finance Function?
          </h2>
          <p className="text-lg text-slate-300 mb-10">
            Join hundreds of finance leaders who have used CFO Lens AI to identify
            gaps and accelerate their transformation journey.
          </p>
          <Link
            to={isAuthenticated ? '/assess' : '/login'}
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold rounded-lg transition-all hover:shadow-xl"
            style={{
              backgroundColor: BRAND_COLORS.gold,
              color: BRAND_COLORS.navy,
            }}
          >
            Start Your Assessment
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FOOTER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} CFO Lens AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
