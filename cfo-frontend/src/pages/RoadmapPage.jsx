/**
 * RoadmapPage
 *
 * Public page showing the live FP&A Diagnostic and upcoming finance modules,
 * with a waitlist form to capture email + module interest via Supabase.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo, BRAND_COLORS } from '../components/Logo';
import PublicNav from '../components/PublicNav';
import PageSEO from '../components/PageSEO';
import { supabase } from '../lib/supabase';
import {
  ArrowRight,
  Check,
  BookOpen,
  Landmark,
  Calculator,
  Users,
  Shield,
  Database,
  Brain,
  TrendingUp,
} from 'lucide-react';

const FPA_DIAGNOSTIC_FEATURES = [
  'Structured assessment against benchmarks for companies like yours',
  'Prioritized action plan scored by impact and complexity',
  'Simulation tool to model your path forward',
  'Executive report you can hand to leadership',
];

const MODULES = [
  {
    id: 'accounting_close',
    name: 'Accounting & Close',
    subtitle: 'R2R \u00B7 AP \u00B7 AR',
    description:
      'Month-end takes too long. Cash collection is reactive. Vendor payments are manual and error-prone. Three assessments, one integrated view.',
    phase: 1,
    status: 'next',
    icon: BookOpen,
  },
  {
    id: 'treasury_cash',
    name: 'Treasury & Cash Management',
    subtitle: null,
    description:
      "Cash visibility is a spreadsheet exercise. Working capital is \"managed\" reactively. Banking relationships haven't been reviewed in years.",
    phase: 1,
    status: 'planned',
    icon: Landmark,
  },
  {
    id: 'tax',
    name: 'Tax',
    subtitle: null,
    description:
      "Compliance is a scramble. Planning is ad hoc. Transfer pricing documentation wouldn't survive scrutiny.",
    phase: 2,
    status: 'planned',
    icon: Calculator,
  },
  {
    id: 'finance_team',
    name: 'Finance Team & Organization',
    subtitle: null,
    description:
      "The org chart evolved by accident. Talent gaps are obvious but undefined. Development plans don't exist.",
    phase: 2,
    status: 'planned',
    icon: Users,
  },
  {
    id: 'risk_compliance',
    name: 'Risk & Compliance',
    subtitle: null,
    description:
      "Internal controls aren't documented \u2014 or aren't followed. Audit prep is a scramble every year. Nobody owns enterprise risk, so nobody manages it.",
    phase: 2,
    status: 'planned',
    icon: Shield,
  },
  {
    id: 'data_systems',
    name: 'Data & Systems',
    subtitle: null,
    description:
      'No single source of truth. Finance and ops don\'t reconcile. Every report starts with "let me pull the data" \u2014 and takes hours.',
    phase: 3,
    status: 'planned',
    icon: Database,
  },
  {
    id: 'ai_readiness',
    name: 'AI Readiness',
    subtitle: null,
    description:
      "Everyone's talking about AI in finance. You don't know where to start, what's realistic, or whether it's worth it yet.",
    phase: 3,
    status: 'planned',
    icon: Brain,
  },
  {
    id: 'value_creation',
    name: 'Value Creation',
    subtitle: null,
    description:
      "Finance reports the past. The business makes decisions without you. You're a scorekeeper, not a strategic partner.",
    phase: 3,
    status: 'planned',
    icon: TrendingUp,
  },
];

const PHASES = [
  { number: 1, name: 'Foundation', label: 'Core finance operations' },
  { number: 2, name: 'Optimization', label: 'Process & governance' },
  { number: 3, name: 'Transformation', label: 'Strategic & forward-looking' },
];

const WAITLIST_MODULES = [
  { id: 'fpa', label: 'FP&A', phase: null },
  ...MODULES.map((m) => ({ id: m.id, label: m.name, phase: m.phase })),
];

function StatusBadge({ status }) {
  if (status === 'live') {
    return (
      <span
        className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
        style={{ backgroundColor: BRAND_COLORS.gold, color: '#fff' }}
      >
        Live
      </span>
    );
  }
  if (status === 'next') {
    return (
      <span
        className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
        style={{ backgroundColor: BRAND_COLORS.navy }}
      >
        Next
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-slate-300">
      Planned
    </span>
  );
}

export default function RoadmapPage() {
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [selectedModules, setSelectedModules] = useState([]);
  const [honeypot, setHoneypot] = useState('');
  const [submitState, setSubmitState] = useState('idle'); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');

  function toggleModule(id) {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Honeypot check
    if (honeypot) return;

    if (!email.trim()) return;

    setSubmitState('submitting');
    setErrorMsg('');

    try {
      const { error } = await supabase.rpc('upsert_roadmap_waitlist', {
        p_email: email.trim().toLowerCase(),
        p_modules: selectedModules,
      });

      if (error) throw error;
      setSubmitState('success');
    } catch (err) {
      console.error('Waitlist submission error:', err);
      setSubmitState('error');
      setErrorMsg('Something went wrong. Please try again.');
    }
  }

  return (
    <>
      <PageSEO
        title="Product Roadmap — Finance Diagnostic Modules"
        description="Diagnostic intelligence for the entire finance function. See what's live, what's coming next, and join the waitlist."
        path="/roadmap"
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Roadmap', path: '/roadmap' }]}
      />
      <PublicNav />

      <main className="pt-16">
        {/* ─── Hero ─── */}
        <section className="py-20 px-6" style={{ backgroundColor: `${BRAND_COLORS.navy}08` }}>
          <div className="max-w-4xl mx-auto text-center">
            <p
              className="text-xs font-bold uppercase tracking-[0.2em] mb-4"
              style={{ color: BRAND_COLORS.gold }}
            >
              Product Roadmap
            </p>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6"
              style={{ color: BRAND_COLORS.navy }}
            >
              One Platform. Every Finance Function. Diagnosed.
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-12">
              What top-tier consulting firms deliver in six-figure engagements, we're making
              accessible to finance leaders everywhere&nbsp;&mdash; starting with FP&A, expanding
              across every area the CFO owns.
            </p>

            {/* Phase progress indicator */}
            <div className="flex items-center justify-center gap-0 max-w-md mx-auto">
              {PHASES.map((phase, i) => (
                <div key={phase.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-3.5 h-3.5 rounded-full border-2"
                      style={
                        i === 0
                          ? { backgroundColor: BRAND_COLORS.gold, borderColor: BRAND_COLORS.gold }
                          : i === 1
                            ? { backgroundColor: 'transparent', borderColor: BRAND_COLORS.navy }
                            : { backgroundColor: 'transparent', borderColor: '#94a3b8' }
                      }
                    />
                    <span
                      className="text-[11px] font-semibold mt-2"
                      style={{ color: i === 0 ? BRAND_COLORS.gold : i === 1 ? BRAND_COLORS.navy : '#94a3b8' }}
                    >
                      {phase.name}
                    </span>
                  </div>
                  {i < PHASES.length - 1 && (
                    <div
                      className="h-px w-16 sm:w-24 mx-2 mb-5"
                      style={{ backgroundColor: i === 0 ? BRAND_COLORS.navy : '#cbd5e1' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FP&A Live — Full-width navy band ─── */}
        <section className="py-16 px-6" style={{ backgroundColor: BRAND_COLORS.navy }}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <span
                className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white rounded-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <span
                  className="pulse-dot inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: BRAND_COLORS.gold }}
                />
                Live Now
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              FP&A Diagnostic
            </h2>

            <p className="text-slate-300 mb-6 leading-relaxed max-w-2xl">
              You feel it in the variance explanations that take three days. The forecasts nobody
              trusts. The rolling reforecasts that never roll.
            </p>

            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
              What you get
            </h3>
            <ul className="space-y-2 mb-6">
              {FPA_DIAGNOSTIC_FEATURES.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: BRAND_COLORS.gold }} />
                  {item}
                </li>
              ))}
            </ul>

            <p className="text-sm font-medium text-slate-400 mb-6">
              Hours, not months. Hundreds, not six figures.
            </p>

            <Link
              to={isAuthenticated ? '/dashboard' : '/login?mode=signup'}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: BRAND_COLORS.gold, color: BRAND_COLORS.navy }}
            >
              Start Your Diagnostic
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ─── Timeline Phases ─── */}
        <section className="py-16 px-6" style={{ backgroundColor: `${BRAND_COLORS.navy}05` }}>
          <div className="max-w-5xl mx-auto">
            <h2
              className="text-2xl sm:text-3xl font-bold mb-4"
              style={{ color: BRAND_COLORS.navy }}
            >
              What's Coming
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-2xl mb-12">
              Same methodology. Same rigor. Same path from diagnosis to action&nbsp;&mdash; across
              every area the CFO owns.
            </p>

            <div className="space-y-14">
              {PHASES.map((phase) => {
                const phaseModules = MODULES.filter((m) => m.phase === phase.number);
                if (phaseModules.length === 0) return null;

                return (
                  <div key={phase.number}>
                    {/* Phase header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: BRAND_COLORS.gold, color: '#fff' }}
                      >
                        {phase.number}
                      </div>
                      <div>
                        <h3
                          className="text-lg font-bold"
                          style={{ color: BRAND_COLORS.navy }}
                        >
                          {phase.name}
                        </h3>
                        <p className="text-sm text-slate-500">{phase.label}</p>
                      </div>
                    </div>

                    {/* Module cards */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {phaseModules.map((mod) => {
                        const Icon = mod.icon;
                        return (
                          <div
                            key={mod.id}
                            className="border border-slate-200 bg-white p-5"
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2.5">
                                <Icon
                                  className="w-4 h-4 flex-shrink-0"
                                  style={{ color: BRAND_COLORS.navy }}
                                />
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-800">
                                    {mod.name}
                                  </h4>
                                  {mod.subtitle && (
                                    <span className="text-[11px] text-slate-400">{mod.subtitle}</span>
                                  )}
                                </div>
                              </div>
                              <StatusBadge status={mod.status} />
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed">
                              {mod.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── Social Proof Band ─── */}
        <section className="py-12 px-6" style={{ backgroundColor: `${BRAND_COLORS.navy}0A` }}>
          <div className="max-w-3xl mx-auto text-center">
            <p
              className="text-lg sm:text-xl font-semibold mb-2"
              style={{ color: BRAND_COLORS.navy }}
            >
              Join finance leaders shaping the future of CFO diagnostics
            </p>
            <p className="text-sm text-slate-500">
              Early supporters get priority access and founding member pricing.
            </p>
          </div>
        </section>

        {/* ─── Waitlist Form ─── */}
        <section className="py-16 px-6">
          <div className="max-w-2xl mx-auto">
            <p
              className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
              style={{ color: BRAND_COLORS.gold }}
            >
              Get Early Access
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold mb-3"
              style={{ color: BRAND_COLORS.navy }}
            >
              Which modules matter most to you?
            </h2>
            <p className="text-slate-600 mb-8">
              Select the areas you care about. You'll get priority access and founding member
              pricing when they launch.
            </p>

            {submitState === 'success' ? (
              <div className="border border-slate-200 p-8 text-center">
                <Check className="w-8 h-8 mx-auto mb-3" style={{ color: BRAND_COLORS.gold }} />
                <p className="text-lg font-semibold text-slate-800 mb-1">You're on the list.</p>
                <p className="text-sm text-slate-500">
                  We'll reach out when the modules you selected are ready.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Honeypot - hidden from real users */}
                <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="waitlist-email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    id="waitlist-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-4 py-2.5 border border-slate-300 text-sm focus:outline-none focus:border-slate-500 transition-colors"
                  />
                </div>

                <fieldset>
                  <legend className="text-sm font-medium text-slate-700 mb-3">
                    Select all that apply
                  </legend>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {WAITLIST_MODULES.map((mod) => (
                      <label
                        key={mod.id}
                        className={`flex items-center gap-2.5 px-3 py-2.5 border text-sm cursor-pointer transition-colors ${
                          selectedModules.includes(mod.id)
                            ? 'border-slate-400 bg-slate-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedModules.includes(mod.id)}
                          onChange={() => toggleModule(mod.id)}
                          className="accent-slate-700"
                        />
                        <span className="text-slate-700">
                          {mod.label}
                          {mod.phase && (
                            <span className="text-slate-400 text-xs ml-1">
                              &middot; Phase {mod.phase}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {submitState === 'error' && (
                  <p className="text-sm text-red-600">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={submitState === 'submitting'}
                  className="px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  {submitState === 'submitting' ? 'Joining...' : 'Join the Waitlist'}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* ─── Closing Quote ─── */}
        <section className="py-16 px-6" style={{ backgroundColor: `${BRAND_COLORS.navy}05` }}>
          <div className="max-w-3xl mx-auto text-center">
            <blockquote className="text-lg sm:text-xl text-slate-600 italic leading-relaxed">
              "You already know something isn't working. We're building the tools to see it
              clearly&nbsp;&mdash; across the entire finance function."
            </blockquote>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer
          className="py-12 px-6 border-t border-slate-200"
          style={{ backgroundColor: `${BRAND_COLORS.navy}05` }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              <div className="sm:col-span-2">
                <Logo size="sm" />
                <p className="text-sm text-slate-500 mt-4 max-w-md">
                  The diagnosis and action plan phase of a consulting engagement&mdash;compressed
                  into hours, at a fraction of the cost.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-4">Product</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to="/platform" className="text-sm text-slate-500 hover:text-slate-700">
                      Platform
                    </Link>
                  </li>
                  <li>
                    <Link to="/roadmap" className="text-sm text-slate-500 hover:text-slate-700">
                      Roadmap
                    </Link>
                  </li>
                  <li>
                    <Link to="/pricing" className="text-sm text-slate-500 hover:text-slate-700">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link to="/blog" className="text-sm text-slate-500 hover:text-slate-700">
                      Blog
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-4">Company</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to="/about" className="text-sm text-slate-500 hover:text-slate-700">
                      About
                    </Link>
                  </li>
                  <li>
                    <a href="mailto:support@cfolens.ai" className="text-sm text-slate-500 hover:text-slate-700">
                      Contact
                    </a>
                  </li>
                  <li>
                    <Link to="/terms" className="text-sm text-slate-500 hover:text-slate-700">
                      Terms
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="text-sm text-slate-500 hover:text-slate-700">
                      Privacy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-500">
                &copy; {new Date().getFullYear()} CFO Lens AI. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
