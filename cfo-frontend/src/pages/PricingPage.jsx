/**
 * PricingPage
 *
 * Shows subscription pricing and handles checkout flow.
 * Features geo-based pricing (EUR for EU, USD otherwise).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Logo, BRAND_COLORS } from '../components/Logo';
import PublicNav from '../components/PublicNav';
import { supabase } from '../lib/supabase';
import {
  Check,
  X,
  ArrowRight,
  Zap,
  FileText,
  BarChart3,
  Target,
  Shield,
  Clock,
} from 'lucide-react';
import PageSEO from '../components/PageSEO';

const FAQ_ITEMS = [
  {
    question: 'What is an FP&A maturity assessment?',
    answer: 'An FP&A maturity assessment evaluates how advanced your Financial Planning and Analysis function is across key capabilities like budgeting, forecasting, scenario modeling, and strategic influence. It identifies gaps between your current state and best practice, providing a clear roadmap for improvement.',
  },
  {
    question: 'How long does the diagnostic take?',
    answer: 'Most CFOs complete the full 97-question diagnostic in 60 to 90 minutes. The questions are binary (yes/no) and organized by objective, so progress is steady and transparent.',
  },
  {
    question: 'How is this different from hiring a consultant?',
    answer: 'A traditional FP&A maturity assessment by a consulting firm costs six figures and takes months. CFO Lens delivers comparable diagnostic depth in hours at a fraction of the cost, using a deterministic scoring engine calibrated to your industry, size, and persona.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards via Stripe. EU customers can pay in EUR, others pay in USD.',
  },
  {
    question: 'Can I try before I buy?',
    answer: 'Yes. The free tier gives you access to 2 objectives so you can experience the diagnostic before upgrading.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer: 'Your diagnostic data is retained. You can still view your results but won\'t be able to access premium features or start new full assessments.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map(item => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

const API_URL = import.meta.env.VITE_API_URL || 'https://cfodiagnosisv1-production.up.railway.app';

// Helper: find or create a diagnostic run, then return its ID
async function findOrCreateRun() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  const headers = { Authorization: `Bearer ${session.access_token}` };

  // Check for existing draft/in-progress run
  const listRes = await fetch(`${API_URL}/diagnostic-runs`, { headers });
  if (listRes.ok) {
    const runs = await listRes.json();
    const active = runs.find(r =>
      r.status === 'created' || r.status === 'in_progress' || r.status === 'draft'
    );
    if (active) return active.id;
  }

  // Create new run
  const createRes = await fetch(`${API_URL}/diagnostic-runs`, {
    method: 'POST',
    headers,
  });
  if (!createRes.ok) throw new Error('Failed to create diagnostic run');
  const newRun = await createRes.json();
  return newRun.id;
}

export default function PricingPage() {
  const { isAuthenticated, user } = useAuth();
  const { isPaid, tier, isLoading: subLoading, refreshSubscription } = useSubscription();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [freeLoading, setFreeLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollAttempts = useRef(0);

  // Check for checkout result from URL
  const checkoutResult = searchParams.get('checkout');

  // Fetch pricing info
  useEffect(() => {
    async function fetchPricing() {
      if (!isAuthenticated) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const res = await fetch(`${API_URL}/api/billing/prices`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setPricing(data);
        }
      } catch (err) {
        console.error('Error fetching pricing:', err);
      }
    }

    fetchPricing();
  }, [isAuthenticated]);

  // Handle checkout success: poll subscription, create run, redirect to intro
  useEffect(() => {
    if (checkoutResult !== 'success' || !isAuthenticated) return;

    // Clear query param immediately
    searchParams.delete('checkout');
    setSearchParams(searchParams, { replace: true });

    const maxAttempts = 3;
    const interval = setInterval(async () => {
      pollAttempts.current += 1;
      await refreshSubscription();

      if (pollAttempts.current >= maxAttempts) {
        clearInterval(interval);
        // Redirect regardless — webhook may still be processing
        try {
          const runId = await findOrCreateRun();
          navigate(`/run/${runId}/intro?source=paid`, { replace: true });
        } catch (err) {
          console.error('Run creation after checkout failed:', err);
          navigate('/dashboard', { replace: true });
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Handle free tier button click
  async function handleFreeTier() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }

    setFreeLoading(true);
    try {
      const runId = await findOrCreateRun();
      navigate(`/run/${runId}/intro?source=free`, { replace: true });
    } catch (err) {
      console.error('Free run creation failed:', err);
      navigate('/dashboard', { replace: true });
    } finally {
      setFreeLoading(false);
    }
  }

  // Handle subscribe button click
  async function handleSubscribe() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const res = await fetch(`${API_URL}/api/billing/checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = await res.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Get display price
  const displayPrice = pricing?.annual?.formatted || '$349';
  const currency = pricing?.currency || 'usd';

  return (
    <div className="min-h-screen bg-white">
      <PageSEO
        title="Pricing — FP&A Assessment Plans"
        description="Free FP&A diagnostic with 2 objectives. Pro tier unlocks all 9 objectives, industry benchmarks, War Room action planning, and executive PDF reports."
        path="/pricing"
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Pricing', path: '/pricing' }]}
        schemas={[faqSchema]}
      />
      {/* Navigation */}
      <PublicNav authTo="/dashboard" />

      {/* Success/Cancel Messages */}
      {checkoutResult === 'success' && (
        <div className="bg-green-50 border-b border-green-200 px-6 py-4 mt-16">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">
              Welcome to CFO Lens Pro! Your subscription is now active.
            </span>
            <Link to="/dashboard" className="ml-auto text-green-700 font-medium hover:underline">
              Go to Dashboard
            </Link>
          </div>
        </div>
      )}

      {checkoutResult === 'cancelled' && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 mt-16">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <X className="w-5 h-5 text-amber-600" />
            <span className="text-amber-800 font-medium">
              Checkout cancelled. No charges were made.
            </span>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className="text-4xl font-bold mb-4"
            style={{ color: BRAND_COLORS.navy }}
          >
            Unlock Your Full FP&A Diagnostic
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Comprehensive assessment across all 9 objectives.
            Actionable recommendations. Executive-ready PDF reports.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Free Tier */}
          <div className="border border-slate-200 rounded-sm p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Free Tier</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-800">$0</span>
                <span className="text-slate-500">/forever</span>
              </div>
            </div>

            <p className="text-slate-600 mb-6">
              Try the diagnostic with 2 objectives to see how it works.
            </p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">2 objectives</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-slate-300 mt-0.5 flex-shrink-0" />
                <span className="text-slate-400">Industry & size benchmarks</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-slate-300 mt-0.5 flex-shrink-0" />
                <span className="text-slate-400">PDF executive report</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-slate-300 mt-0.5 flex-shrink-0" />
                <span className="text-slate-400">War Room action planning</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-slate-300 mt-0.5 flex-shrink-0" />
                <span className="text-slate-400">AI-powered recommendations</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-slate-300 mt-0.5 flex-shrink-0" />
                <span className="text-slate-400">Unlimited reassessments for one year</span>
              </li>
            </ul>

            <button
              onClick={handleFreeTier}
              disabled={freeLoading}
              className="block w-full text-center py-3 px-4 border border-slate-300 rounded-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {freeLoading ? 'Starting...' : (isAuthenticated ? 'Start Free Diagnostic' : 'Explore the Diagnostic')}
            </button>
          </div>

          {/* Pro Tier */}
          <div
            className="border-2 rounded-sm p-8 relative"
            style={{ borderColor: BRAND_COLORS.gold }}
          >
            {/* Badge */}
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-medium text-white rounded-sm"
              style={{ backgroundColor: BRAND_COLORS.gold }}
            >
              Full Access
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Pro</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold" style={{ color: BRAND_COLORS.navy }}>
                  {displayPrice}
                </span>
              </div>
              {currency === 'eur' && (
                <p className="text-sm text-slate-500 mt-1">VAT included where applicable</p>
              )}
            </div>

            <p className="text-slate-600 mb-6">
              Complete diagnostic with all features unlocked.
            </p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: BRAND_COLORS.gold }} />
                <span className="text-slate-700">All 9 objectives</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: BRAND_COLORS.gold }} />
                <span className="text-slate-700">Industry & size benchmarks</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: BRAND_COLORS.gold }} />
                <span className="text-slate-700">PDF executive report</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: BRAND_COLORS.gold }} />
                <span className="text-slate-700">War Room action planning</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: BRAND_COLORS.gold }} />
                <span className="text-slate-700">AI-powered recommendations</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: BRAND_COLORS.gold }} />
                <span className="text-slate-700">Unlimited reassessments for one year</span>
              </li>
            </ul>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm">
                {error}
              </div>
            )}

            {isPaid ? (
              <div className="text-center py-3 px-4 bg-green-50 border border-green-200 rounded-sm text-green-700 font-medium">
                You have Pro access
              </div>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={loading || subLoading}
                className="block w-full text-center py-3 px-4 rounded-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: BRAND_COLORS.navy }}
              >
                {loading ? 'Redirecting to checkout...' : 'Get Pro Access'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl font-bold text-center mb-12"
            style={{ color: BRAND_COLORS.navy }}
          >
            What You Get with Pro
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-sm flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${BRAND_COLORS.navy}10` }}
              >
                <Target className="w-6 h-6" style={{ color: BRAND_COLORS.navy }} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">9 Strategic Objectives</h3>
              <p className="text-slate-600 text-sm">
                Comprehensive coverage of FP&A capabilities across foundation, future, and intelligence.
              </p>
            </div>

            <div className="text-center">
              <div
                className="w-12 h-12 rounded-sm flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${BRAND_COLORS.navy}10` }}
              >
                <BarChart3 className="w-6 h-6" style={{ color: BRAND_COLORS.navy }} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Industry Benchmarks</h3>
              <p className="text-slate-600 text-sm">
                See how your FP&A function compares to peers in your industry and company size.
              </p>
            </div>

            <div className="text-center">
              <div
                className="w-12 h-12 rounded-sm flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${BRAND_COLORS.navy}10` }}
              >
                <FileText className="w-6 h-6" style={{ color: BRAND_COLORS.navy }} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Executive PDF Report</h3>
              <p className="text-slate-600 text-sm">
                Board-ready report with scores, gaps, and prioritized action recommendations.
              </p>
            </div>

            <div className="text-center">
              <div
                className="w-12 h-12 rounded-sm flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${BRAND_COLORS.navy}10` }}
              >
                <Zap className="w-6 h-6" style={{ color: BRAND_COLORS.navy }} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">War Room</h3>
              <p className="text-slate-600 text-sm">
                Interactive action planning wizard to turn insights into an actionable roadmap.
              </p>
            </div>

            <div className="text-center">
              <div
                className="w-12 h-12 rounded-sm flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${BRAND_COLORS.navy}10` }}
              >
                <Shield className="w-6 h-6" style={{ color: BRAND_COLORS.navy }} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Critical Gate Analysis</h3>
              <p className="text-slate-600 text-sm">
                Identifies foundational gaps that must be addressed before advancing maturity.
              </p>
            </div>

            <div className="text-center">
              <div
                className="w-12 h-12 rounded-sm flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${BRAND_COLORS.navy}10` }}
              >
                <Clock className="w-6 h-6" style={{ color: BRAND_COLORS.navy }} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Annual Access</h3>
              <p className="text-slate-600 text-sm">
                Re-run assessments anytime to track progress and adjust priorities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-2xl font-bold text-center mb-12"
            style={{ color: BRAND_COLORS.navy }}
          >
            Questions
          </h2>

          <div className="space-y-6">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className={i < FAQ_ITEMS.length - 1 ? 'border-b border-slate-200 pb-6' : 'pb-6'}>
                <h3 className="font-semibold text-slate-800 mb-2">{item.question}</h3>
                <p className="text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-6 border-t border-slate-200">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: BRAND_COLORS.navy }}
          >
            Ready to upgrade your FP&A function?
          </h2>
          <p className="text-slate-600 mb-8">
            Join CFOs who use CFO Lens to identify gaps and build action plans.
          </p>
          {!isPaid && (
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-sm font-medium text-white transition-colors"
              style={{ backgroundColor: BRAND_COLORS.navy }}
            >
              Get Pro Access
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
