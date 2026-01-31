// src/pages/LandingPage.jsx
// Landing page - problem-focused, no overselling

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Logo, LogoIcon, BRAND_COLORS } from '../components/Logo';
import PublicNav from '../components/PublicNav';
import { supabase } from '../lib/supabase';
import {
  ArrowRight,
  Check,
} from 'lucide-react';
import FeedbackButton from '../components/FeedbackButton';
import ImageCarousel from '../components/ImageCarousel';

// Image arrays for each step carousel
const STEP_IMAGES = {
  step1: [
    '/images/landing/step1/a.png',
    '/images/landing/step1/b.png',
    '/images/landing/step1/c.png',
  ],
  step2: [
    '/images/landing/step2/a.png',
    '/images/landing/step2/b.png',
    '/images/landing/step2/c.png',
  ],
  step3: [
    '/images/landing/step3/a.png',
    '/images/landing/step3/b.png',
    '/images/landing/step3/c.png',
    '/images/landing/step3/d.png',
  ],
  step4: [
    '/images/landing/step4/a.png',
    '/images/landing/step4/b.png',
    '/images/landing/step4/c.png',
    '/images/landing/step4/f.png',
  ],
  step5: [
    '/images/landing/step5/a.png',
    '/images/landing/step5/b.png',
    '/images/landing/step5/c.png',
    '/images/landing/step5/d.png',
    '/images/landing/step5/g.png',
  ],
};

const API_URL = import.meta.env.VITE_API_URL;

export default function LandingPage() {
  const { isAuthenticated, user, signOut, loading } = useAuth();
  const { isPaid } = useSubscription();
  const navigate = useNavigate();

  // Authenticated non-paying users go to pricing; paid users go to /start
  const ctaDest = isAuthenticated ? (isPaid ? '/start' : '/pricing') : '/login?mode=signup';
  const [incompleteRun, setIncompleteRun] = useState(null);
  const [dismissedResume, setDismissedResume] = useState(false);

  // Track which step card is currently focused (for viewport-aware carousel rotation)
  const [activeStep, setActiveStep] = useState(1); // Default to step 1, not null
  const stepRefs = useRef([]);
  const visibilityRatios = useRef({}); // Track each card's visibility

  // Intersection Observer for step focus tracking
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: [0, 0.25, 0.5, 0.75, 1], // Multiple thresholds for smoother updates
    };

    const handleIntersection = (entries) => {
      // Update visibility ratios for changed entries
      entries.forEach((entry) => {
        const step = parseInt(entry.target.dataset.step, 10);
        visibilityRatios.current[step] = entry.intersectionRatio;
      });

      // Find the card with highest visibility among ALL tracked cards
      let bestStep = 1;
      let maxRatio = 0;

      Object.entries(visibilityRatios.current).forEach(([step, ratio]) => {
        if (ratio > maxRatio) {
          maxRatio = ratio;
          bestStep = parseInt(step, 10);
        }
      });

      // Only update if something is visible
      if (maxRatio > 0) {
        setActiveStep(bestStep);
      }
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    // Observe all step cards
    stepRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  // Ref setter for step cards
  const setStepRef = useCallback((index) => (el) => {
    stepRefs.current[index] = el;
  }, []);

  // Check for incomplete runs on mount (smart resume)
  React.useEffect(() => {
    if (!isAuthenticated) return;

    async function checkIncompleteRuns() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const res = await fetch(`${API_URL}/diagnostic-runs`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (res.ok) {
          const runs = await res.json();
          // Find most recent in-progress run
          const inProgress = runs.find(r => r.status === 'in_progress');
          if (inProgress) {
            setIncompleteRun(inProgress);
          }
        }
      } catch (err) {
        console.error('Error checking incomplete runs:', err);
      }
    }

    checkIncompleteRuns();
  }, [isAuthenticated]);

  // Handle resume button click
  function handleResumeClick() {
    if (!incompleteRun) return;

    // Use the computed resume_path if available
    if (incompleteRun.resume_path) {
      navigate(incompleteRun.resume_path);
    } else {
      // Fallback: go to dashboard
      navigate('/dashboard');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* NAVIGATION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <PublicNav
        ctaLabel="Get Started"
        ctaTo={ctaDest}
        ctaState={isAuthenticated ? undefined : { from: { pathname: '/pricing' } }}
        authLabel="My Reports"
        authTo="/dashboard"
      />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HERO - Above the Fold */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-10">
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

            <p className="text-base text-slate-600 mb-4 leading-relaxed">
              Variance explanations that take three days. Forecasts nobody trusts.
              Rolling reforecasts that never roll. The strategic work keeps getting
              pushed to "next quarter." Every quarter.
            </p>

            <p className="text-base text-slate-600 mb-6 leading-relaxed">
              You already know your FP&A function has gaps. You need a
              structured way to articulate them clearly, prioritize what to fix,
              and get it done.
            </p>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed font-medium">
              Spend 30 minutes to diagnose your FP&A maturity and build a prioritized action plan to improve it.
            </p>

            <Link
              to={ctaDest}
              state={isAuthenticated ? undefined : { from: { pathname: '/pricing' } }}
              className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: BRAND_COLORS.navy }}
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HOW IT WORKS - Product Showcase */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          {/* Big Bold Title with Subtext */}
          <div className="mb-16">
            <h2
              className="text-4xl sm:text-5xl font-bold mb-4"
              style={{ color: BRAND_COLORS.navy }}
            >
              Introducing CFO Lens
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl">
              Five steps to bring your FP&A function into focus, identify the gaps, and build an action plan to close them.
            </p>
          </div>

          {/* Step 1 - Text Left, Image Right */}
          <div
            ref={setStepRef(1)}
            data-step="1"
            className="flex flex-col md:flex-row mb-16 border border-slate-200 bg-white"
          >
            <div
              className="md:w-1/3 p-8 flex flex-col border-b md:border-b-0 md:border-r border-slate-200"
              style={{ backgroundColor: `${BRAND_COLORS.navy}12` }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                  style={{ backgroundColor: BRAND_COLORS.gold }}
                >
                  1
                </div>
                <h3 className="text-lg font-semibold" style={{ color: BRAND_COLORS.navy }}>
                  Company Context
                </h3>
              </div>
              <p className="text-sm text-slate-500">
                Understanding the specifics of your company
              </p>
              <div className="border-t border-slate-200 mt-auto pt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-700">Tailored benchmarks</p>
                  <p className="text-xs text-slate-500">
                    We compare you against companies your size, in your industry.
                  </p>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs font-medium text-slate-700">Relevant recommendations</p>
                  <p className="text-xs text-slate-500">
                    Pain points shape which actions get prioritized.
                  </p>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs font-medium text-slate-700">Personalized reports</p>
                  <p className="text-xs text-slate-500">
                    Your company profile flows into the executive summary.
                  </p>
                </div>
              </div>
            </div>
            <div
              className="md:w-2/3 aspect-video border-l-4 overflow-hidden"
              style={{ borderLeftColor: BRAND_COLORS.gold }}
            >
              <ImageCarousel
                images={STEP_IMAGES.step1}
                interval={3000}
                className="w-full h-full"
                isActive={activeStep === 1}
              />
            </div>
          </div>

          {/* Step 2 - Text Left, Image Right */}
          <div
            ref={setStepRef(2)}
            data-step="2"
            className="flex flex-col md:flex-row mb-16 border border-slate-200 bg-white"
          >
            <div
              className="md:w-1/3 p-8 flex flex-col border-b md:border-b-0 md:border-r border-slate-200"
              style={{ backgroundColor: `${BRAND_COLORS.navy}12` }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                  style={{ backgroundColor: BRAND_COLORS.gold }}
                >
                  2
                </div>
                <h3 className="text-lg font-semibold" style={{ color: BRAND_COLORS.navy }}>
                  Diagnostic Assessment
                </h3>
              </div>
              <p className="text-sm text-slate-500">
                Practitioner-curated questions across FP&A
              </p>
              <div className="border-t border-slate-200 mt-auto pt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-700">No ambiguity</p>
                  <p className="text-xs text-slate-500">
                    Binary yes/no answers—no "it depends." You know or you don't.
                  </p>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs font-medium text-slate-700">Comprehensive coverage</p>
                  <p className="text-xs text-slate-500">
                    From budgeting to strategic planning. Plus your priorities to focus results.
                  </p>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs font-medium text-slate-700">~30 minutes</p>
                  <p className="text-xs text-slate-500">
                    Fast enough to finish in one sitting.
                  </p>
                </div>
              </div>
            </div>
            <div
              className="md:w-2/3 aspect-video border-l-4 overflow-hidden"
              style={{ borderLeftColor: BRAND_COLORS.gold }}
            >
              <ImageCarousel
                images={STEP_IMAGES.step2}
                interval={3000}
                className="w-full h-full"
                isActive={activeStep === 2}
              />
            </div>
          </div>

          {/* Step 3 - Text Left, Image Right */}
          <div
            ref={setStepRef(3)}
            data-step="3"
            className="flex flex-col md:flex-row mb-16 border border-slate-200 bg-white"
          >
            <div
              className="md:w-1/3 p-8 flex flex-col border-b md:border-b-0 md:border-r border-slate-200"
              style={{ backgroundColor: `${BRAND_COLORS.navy}12` }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                  style={{ backgroundColor: BRAND_COLORS.gold }}
                >
                  3
                </div>
                <h3 className="text-lg font-semibold" style={{ color: BRAND_COLORS.navy }}>
                  Results & Benchmarks
                </h3>
              </div>
              <p className="text-sm text-slate-500">
                Scoring your maturity against peer companies
              </p>
              <div className="border-t border-slate-200 mt-auto pt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-700">Maturity level</p>
                  <p className="text-xs text-slate-500">
                    See where you stand: Emerging, Defined, Managed, or Optimized.
                  </p>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs font-medium text-slate-700">Detailed breakdown</p>
                  <p className="text-xs text-slate-500">
                    See strengths and gaps across objectives and practices.
                  </p>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs font-medium text-slate-700">Peer comparison</p>
                  <p className="text-xs text-slate-500">
                    Understand how you compare to similar companies.
                  </p>
                </div>
              </div>
            </div>
            <div
              className="md:w-2/3 aspect-video border-l-4 overflow-hidden"
              style={{ borderLeftColor: BRAND_COLORS.gold }}
            >
              <ImageCarousel
                images={STEP_IMAGES.step3}
                interval={3000}
                className="w-full h-full"
                isActive={activeStep === 3}
              />
            </div>
          </div>

          {/* Step 4 - Text Left, Image Right */}
          <div
            ref={setStepRef(4)}
            data-step="4"
            className="flex flex-col md:flex-row mb-16 border border-slate-200 bg-white"
          >
            <div
              className="md:w-1/3 p-8 flex flex-col border-b md:border-b-0 md:border-r border-slate-200"
              style={{ backgroundColor: `${BRAND_COLORS.navy}12` }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                  style={{ backgroundColor: BRAND_COLORS.gold }}
                >
                  4
                </div>
                <h3 className="text-lg font-semibold" style={{ color: BRAND_COLORS.navy }}>
                  War Room
                </h3>
              </div>
              <p className="text-sm text-slate-500">
                The highlight — turn insights into action
              </p>
              <div className="border-t border-slate-200 mt-auto pt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-700">Guided wizards</p>
                  <p className="text-xs text-slate-500">
                    Step-by-step guidance to decide what to prioritize and why.
                  </p>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs font-medium text-slate-700">Assign owners</p>
                  <p className="text-xs text-slate-500">
                    Attach names and deadlines so initiatives actually get done.
                  </p>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs font-medium text-slate-700">Track progress</p>
                  <p className="text-xs text-slate-500">
                    Watch your projected maturity shift as you commit to changes.
                  </p>
                </div>
              </div>
            </div>
            <div
              className="md:w-2/3 aspect-video border-l-4 overflow-hidden"
              style={{ borderLeftColor: BRAND_COLORS.gold }}
            >
              <ImageCarousel
                images={STEP_IMAGES.step4}
                interval={3000}
                className="w-full h-full"
                isActive={activeStep === 4}
              />
            </div>
          </div>

          {/* Step 5 - Text Left, Image Right */}
          <div
            ref={setStepRef(5)}
            data-step="5"
            className="flex flex-col md:flex-row border border-slate-200 bg-white"
          >
            <div
              className="md:w-1/3 p-8 flex flex-col border-b md:border-b-0 md:border-r border-slate-200"
              style={{ backgroundColor: `${BRAND_COLORS.navy}12` }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                  style={{ backgroundColor: BRAND_COLORS.gold }}
                >
                  5
                </div>
                <h3 className="text-lg font-semibold" style={{ color: BRAND_COLORS.navy }}>
                  Executive Report
                </h3>
              </div>
              <p className="text-sm text-slate-500">
                Board-ready PDF you can present Monday
              </p>
              <div className="border-t border-slate-200 mt-auto pt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-700">Executive summary</p>
                  <p className="text-xs text-slate-500">
                    One-page overview for leadership. No fluff.
                  </p>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs font-medium text-slate-700">Full diagnostic</p>
                  <p className="text-xs text-slate-500">
                    Scores, gaps, and root causes—all documented.
                  </p>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs font-medium text-slate-700">Action roadmap</p>
                  <p className="text-xs text-slate-500">
                    Your committed initiatives with timelines and owners.
                  </p>
                </div>
              </div>
            </div>
            <div
              className="md:w-2/3 aspect-video border-l-4 overflow-hidden"
              style={{ borderLeftColor: BRAND_COLORS.gold }}
            >
              <ImageCarousel
                images={STEP_IMAGES.step5}
                interval={3000}
                className="w-full h-full bg-slate-100"
                objectFit="contain"
                isActive={activeStep === 5}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* WHAT YOU GET - Value Props */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl font-bold mb-12 text-center"
            style={{ color: BRAND_COLORS.navy }}
          >
            What You Walk Away With
          </h2>

          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {/* Card 1 - Maturity Score */}
            <div
              className="bg-white border border-slate-200 p-6 border-l-4"
              style={{ borderLeftColor: BRAND_COLORS.gold }}
            >
              <h3
                className="font-bold text-lg mb-3"
                style={{ color: BRAND_COLORS.navy }}
              >
                Maturity Score
              </h3>
              <p className="text-slate-600">
                See where you stand across 8 FP&A themes. Gaps tagged by root cause:
                People, Process, Technology, or Data.
              </p>
            </div>

            {/* Card 2 - Prioritized Actions */}
            <div
              className="bg-white border border-slate-200 p-6 border-l-4"
              style={{ borderLeftColor: BRAND_COLORS.gold }}
            >
              <h3
                className="font-bold text-lg mb-3"
                style={{ color: BRAND_COLORS.navy }}
              >
                Prioritized Actions
              </h3>
              <p className="text-slate-600">
                Know what to fix first and what can wait. Initiatives ranked by
                impact and complexity.
              </p>
            </div>

            {/* Card 3 - Executive Report */}
            <div
              className="bg-white border border-slate-200 p-6 border-l-4"
              style={{ borderLeftColor: BRAND_COLORS.gold }}
            >
              <h3
                className="font-bold text-lg mb-3"
                style={{ color: BRAND_COLORS.navy }}
              >
                Executive Report
              </h3>
              <p className="text-slate-600">
                A board-ready PDF you can present Monday. Full diagnosis,
                actions, and projected outcomes.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              to={ctaDest}
              state={isAuthenticated ? undefined : { from: { pathname: '/pricing' } }}
              className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: BRAND_COLORS.navy }}
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FINAL CTA - Navy Background */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section
        className="py-20 px-6"
        style={{ backgroundColor: BRAND_COLORS.navy }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">
            Ready to see where you stand?
          </h2>

          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Start your diagnostic today. Free to begin.
            Premium features available when you're ready.
          </p>

          <Link
            to={ctaDest}
            state={isAuthenticated ? undefined : { from: { pathname: '/pricing' } }}
            className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold transition-all hover:opacity-90 mb-8"
            style={{ backgroundColor: BRAND_COLORS.gold, color: BRAND_COLORS.navy }}
          >
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Trust Badges */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" style={{ color: BRAND_COLORS.gold }} />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" style={{ color: BRAND_COLORS.gold }} />
              <span>Results in one session</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" style={{ color: BRAND_COLORS.gold }} />
              <span>Export to PDF anytime</span>
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Logo & Tagline */}
            <div className="sm:col-span-2">
              <Logo size="sm" />
              <p className="text-sm text-slate-500 mt-4 max-w-md">
                The diagnosis and action plan phase of a consulting engagement—compressed
                into hours, at a fraction of the cost.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/platform" className="text-sm text-slate-500 hover:text-slate-700">
                    Platform
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

            {/* Company Links */}
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

      {/* Feedback Button */}
      <FeedbackButton currentPage="landing" />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SMART RESUME BANNER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {incompleteRun && !dismissedResume && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-xl w-full px-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-4 flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">
                Continue your assessment?
              </p>
              <p className="text-sm text-slate-500">
                {incompleteRun.company_name || 'Your assessment'} is {incompleteRun.assessment_progress_pct || 0}% complete
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDismissedResume(true)}
                className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700"
              >
                Dismiss
              </button>
              <button
                onClick={handleResumeClick}
                className="px-4 py-1.5 text-sm font-medium text-white rounded"
                style={{ backgroundColor: BRAND_COLORS.navy }}
              >
                Resume
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
