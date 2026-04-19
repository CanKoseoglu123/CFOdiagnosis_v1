// src/pages/PlatformPage.jsx
// Platform page - The methodology that powers all diagnostics

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo, LogoIcon, BRAND_COLORS } from '../components/Logo';
import PublicNav from '../components/PublicNav';
import {
  ArrowRight,
  Building2,
  Search,
  Swords,
  ChevronRight,
} from 'lucide-react';
import PageSEO from '../components/PageSEO';
import Footer from '../components/Footer';

const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'CFO Lens AI',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'AI-powered FP&A maturity diagnostic platform with 97-question assessment, industry benchmarks, and executive reporting.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free tier with 2 objectives. Pro tier unlocks all 9 objectives.',
  },
};

export default function PlatformPage() {
  const { isAuthenticated, user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <PageSEO
        title="FP&A Diagnostic Platform"
        description="FP&A diagnostic platform with deterministic scoring, context-aware benchmarks, root-cause gap analysis, War Room action planning, and executive PDF reports."
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Platform', path: '/platform' }]}
        path="/platform"
        schemas={[softwareAppSchema]}
      />
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* NAVIGATION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <PublicNav ctaLabel="Get Started Free" />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HERO */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <p
              className="text-sm font-medium tracking-wide uppercase mb-4"
              style={{ color: BRAND_COLORS.gold }}
            >
              The Platform
            </p>
            <h1
              className="text-4xl sm:text-5xl font-bold mb-6"
              style={{ color: BRAND_COLORS.navy }}
            >
              FP&A Diagnostic Platform
            </h1>
            <p
              className="text-xl font-medium mb-2"
              style={{ color: BRAND_COLORS.gold }}
            >
              One methodology. Every corner of finance.
            </p>
            <p className="text-xl text-slate-600 leading-relaxed">
              The same diagnostic rigor consultants use—applied systematically 
              across FP&A, Accounting, Treasury, and beyond. Context-aware benchmarks, 
              root-cause analysis, and a simulation engine that stays with you.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* THREE PHASES */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: BRAND_COLORS.navy }}
            >
              From context to action plan
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Three phases. The diagnostic methodology of a consulting engagement—compressed into hours.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Phase 1: Profile */}
            <div className="bg-white border border-slate-200 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-12 h-12 flex items-center justify-center"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Phase 1</p>
                  <h3 className="text-lg font-bold text-slate-800">Profile</h3>
                </div>
              </div>
              <p className="text-slate-600 mb-4">
                We learn your financial character—size, ownership, margin profile, leverage situation. 
                A PE-backed company has different priorities than a family business.
              </p>
              <p className="text-sm text-slate-500">
                Benchmarks calibrated to a company like yours. Not a generic template.
              </p>
            </div>

            {/* Phase 2: Diagnose */}
            <div className="bg-white border border-slate-200 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-12 h-12 flex items-center justify-center"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Phase 2</p>
                  <h3 className="text-lg font-bold text-slate-800">Diagnose</h3>
                </div>
              </div>
              <p className="text-slate-600 mb-4">
                Structured assessment against a clear maturity model. Each question maps to one 
                capability—no ambiguity, no overlap. Gaps tagged by root cause.
              </p>
              <p className="text-sm text-slate-500">
                People, Process, Technology, Data. The path forward depends on understanding why.
              </p>
            </div>

            {/* Phase 3: Plan */}
            <div className="bg-white border border-slate-200 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-12 h-12 flex items-center justify-center"
                  style={{ backgroundColor: BRAND_COLORS.gold }}
                >
                  <Swords className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Phase 3</p>
                  <h3 className="text-lg font-bold text-slate-800">Plan</h3>
                </div>
              </div>
              <p className="text-slate-600 mb-4">
                The War Room turns your diagnosis into a sequenced roadmap. Select initiatives, 
                commit to timelines, watch projected maturity shift in real time.
              </p>
              <p className="text-sm text-slate-500">
                Walk away with a board-ready Executive Report—not a dashboard screenshot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* THE WAR ROOM - HERO FEATURE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p
                className="text-sm font-medium tracking-wide uppercase mb-3"
                style={{ color: BRAND_COLORS.gold }}
              >
                The Differentiator
              </p>
              <h2
                className="text-3xl font-bold mb-6"
                style={{ color: BRAND_COLORS.navy }}
              >
                The War Room
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                This is what consultants don't leave behind.
              </p>
              <div className="space-y-4 text-slate-600">
                <p>
                  Your diagnostic results feed directly into a prioritized initiative list, 
                  scored by impact and complexity. High-impact, low-complexity items surface first.
                </p>
                <p>
                  Select an initiative, commit to a timeline, and see your projected maturity 
                  shift instantly. You're not staring at a static report—you're building a 
                  transformation roadmap you can defend.
                </p>
                <p>
                  And it stays live. Revisit the model as conditions change. Reprioritize 
                  on the fly. Keep the roadmap current.
                </p>
              </div>
            </div>

            <div
              className="p-8 border-l-4"
              style={{ 
                borderColor: BRAND_COLORS.gold, 
                backgroundColor: `${BRAND_COLORS.navy}05` 
              }}
            >
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Initiative selected</p>
                  <p className="font-semibold text-slate-800">Implement driver-based forecasting</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Timeline committed</p>
                  <p className="font-semibold text-slate-800">12 months</p>
                </div>
                <div
                  className="h-px w-full"
                  style={{ backgroundColor: BRAND_COLORS.gold }}
                />
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Projected maturity shift</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-slate-400">2.4</span>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                    <span
                      className="text-2xl font-bold"
                      style={{ color: BRAND_COLORS.navy }}
                    >
                      3.1
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MATURITY JOURNEY */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: BRAND_COLORS.navy }}
            >
              The maturity journey
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Every finance function evolves through three stages. The diagnostic shows you 
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
                <p
                  className="text-sm font-medium uppercase tracking-wide mb-2"
                  style={{ color: BRAND_COLORS.gold }}
                >
                  Stage 1
                </p>
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
                  Are variances explained with substance?
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
                <p
                  className="text-sm font-medium uppercase tracking-wide mb-2"
                  style={{ color: BRAND_COLORS.gold }}
                >
                  Stage 2
                </p>
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
                <p
                  className="text-sm font-medium uppercase tracking-wide mb-2"
                  style={{ color: BRAND_COLORS.gold }}
                >
                  Stage 3
                </p>
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
                  When did Finance last shape a decision?
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* WHERE WE'RE HEADED */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <p
              className="text-sm font-medium tracking-wide uppercase mb-3"
              style={{ color: BRAND_COLORS.gold }}
            >
              The Roadmap
            </p>
            <h2
              className="text-3xl font-bold mb-6"
              style={{ color: BRAND_COLORS.navy }}
            >
              FP&A is just the beginning
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              The full CFO Lens platform will extend the same methodology across the entire 
              finance function—Accounting & Close, Treasury, Tax, Team Development, Risk & Compliance, 
              and more. Same rigor. Same path from diagnosis to action.
            </p>
            <p className="text-slate-500">
              The FP&A Diagnostic is live now. More modules coming soon.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CTA */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section
        className="py-20 px-6"
        style={{ backgroundColor: BRAND_COLORS.navy }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">
            Ready to see where you stand?
          </h2>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
            The diagnosis and action-planning phase of a consulting engagement—compressed 
            into hours, at a fraction of the cost—with a simulation tool consultants don't leave behind.
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

      <Footer variant="minimal" />
    </div>
  );
}
