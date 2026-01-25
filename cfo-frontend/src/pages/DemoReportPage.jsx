/**
 * DemoReportPage
 *
 * Sample executive report for free users to preview what they'll get.
 * Shows structure with scores visible but action recommendations blurred.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo, BRAND_COLORS } from '../components/Logo';
import { useSubscription } from '../context/SubscriptionContext';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  Lock,
  Check,
  ArrowRight,
  TrendingUp,
  Target,
  AlertTriangle,
  FileText,
  BarChart3,
} from 'lucide-react';
import {
  DEMO_COMPANY,
  DEMO_SCORES,
  DEMO_BENCHMARKS,
  DEMO_PRIORITIES,
  DEMO_MATURITY_JOURNEY,
  DEMO_CRITICAL_GAPS,
} from '../data/demoReportData';

const API_URL = import.meta.env.VITE_API_URL || 'https://cfodiagnosisv1-production.up.railway.app';

// Level colors
function getLevelColor(level) {
  const colors = {
    1: '#ef4444', // red
    2: '#f59e0b', // amber
    3: '#22c55e', // green
    4: '#0ea5e9', // blue
  };
  return colors[level] || colors[2];
}

// Score bar component
function ScoreBar({ score, level }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, backgroundColor: getLevelColor(level) }}
        />
      </div>
      <span className="text-sm font-semibold text-slate-700 w-10">{score}%</span>
    </div>
  );
}

// Blurred overlay component
function BlurOverlay({ children, title }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        navigate('/pricing');
        return;
      }

      const res = await fetch(`${API_URL}/api/billing/checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        navigate('/pricing');
      }
    } catch {
      navigate('/pricing');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
        <div className="text-center p-6">
          <Lock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <h4 className="font-semibold text-slate-800 mb-2">{title}</h4>
          <p className="text-sm text-slate-600 mb-4 max-w-xs">
            Upgrade to Pro to see detailed action recommendations and export PDF reports.
          </p>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded transition-colors"
            style={{ backgroundColor: BRAND_COLORS.navy }}
          >
            {loading ? 'Loading...' : 'Upgrade to Pro'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DemoReportPage() {
  const { isPaid } = useSubscription();
  const navigate = useNavigate();

  // If user is paid, redirect to their actual reports
  if (isPaid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">You have Pro access</h2>
          <p className="text-slate-600 mb-4">You can view your actual reports instead of this demo.</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded"
            style={{ backgroundColor: BRAND_COLORS.navy }}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-slate-500 hover:text-slate-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Logo size="sm" />
          </div>

          <div className="flex items-center gap-3">
            <span
              className="px-3 py-1 text-xs font-semibold rounded-full"
              style={{ backgroundColor: `${BRAND_COLORS.gold}20`, color: BRAND_COLORS.gold }}
            >
              SAMPLE REPORT
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Company Header */}
        <div className="bg-white border border-slate-200 rounded-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1
                className="text-2xl font-bold mb-1"
                style={{ color: BRAND_COLORS.navy }}
              >
                {DEMO_COMPANY.name}
              </h1>
              <p className="text-slate-600">
                {DEMO_COMPANY.industry} | {DEMO_COMPANY.size} | {DEMO_COMPANY.country}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Overall Score</div>
              <div
                className="text-4xl font-bold"
                style={{ color: getLevelColor(DEMO_SCORES.overall.level) }}
              >
                {DEMO_SCORES.overall.score}%
              </div>
              <div className="text-sm text-slate-600">
                Level {DEMO_SCORES.overall.level}: {DEMO_SCORES.overall.levelName}
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Scores (Visible) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Theme Scores */}
            <div className="bg-white border border-slate-200 rounded-sm p-6">
              <h2
                className="text-lg font-semibold mb-4 flex items-center gap-2"
                style={{ color: BRAND_COLORS.navy }}
              >
                <BarChart3 className="w-5 h-5" />
                Objective Scores
              </h2>

              <div className="space-y-6">
                {DEMO_SCORES.themes.map(theme => (
                  <div key={theme.id}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-slate-800">{theme.name}</h3>
                      <span className="text-sm font-semibold" style={{ color: getLevelColor(theme.level) }}>
                        {theme.score}%
                      </span>
                    </div>
                    <div className="space-y-2 pl-4 border-l-2 border-slate-100">
                      {theme.objectives.map(obj => (
                        <div key={obj.id} className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">{obj.name}</span>
                          <div className="w-32">
                            <ScoreBar score={obj.score} level={obj.level} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Benchmarks */}
            <div className="bg-white border border-slate-200 rounded-sm p-6">
              <h2
                className="text-lg font-semibold mb-4 flex items-center gap-2"
                style={{ color: BRAND_COLORS.navy }}
              >
                <TrendingUp className="w-5 h-5" />
                Industry Benchmarks
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded">
                  <div className="text-sm text-slate-600 mb-1">{DEMO_BENCHMARKS.industry.name}</div>
                  <div className="text-2xl font-bold text-slate-800">
                    Top {100 - DEMO_BENCHMARKS.industry.percentile}%
                  </div>
                  <div className="text-sm text-slate-500">
                    vs. industry average of {DEMO_BENCHMARKS.industry.average}%
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded">
                  <div className="text-sm text-slate-600 mb-1">{DEMO_BENCHMARKS.size.name}</div>
                  <div className="text-2xl font-bold text-slate-800">
                    Top {100 - DEMO_BENCHMARKS.size.percentile}%
                  </div>
                  <div className="text-sm text-slate-500">
                    vs. size cohort average of {DEMO_BENCHMARKS.size.average}%
                  </div>
                </div>
              </div>
            </div>

            {/* Critical Gaps - Visible */}
            <div className="bg-white border border-slate-200 rounded-sm p-6">
              <h2
                className="text-lg font-semibold mb-4 flex items-center gap-2"
                style={{ color: BRAND_COLORS.navy }}
              >
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Critical Gaps
              </h2>

              <div className="space-y-4">
                {DEMO_CRITICAL_GAPS.map(gap => (
                  <div key={gap.id} className="p-4 bg-amber-50 border border-amber-200 rounded">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-slate-800">{gap.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded">
                        {gap.level}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{gap.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Blurred Actions */}
          <div className="space-y-6">
            {/* Maturity Journey - Visible */}
            <div className="bg-white border border-slate-200 rounded-sm p-6">
              <h2
                className="text-lg font-semibold mb-4 flex items-center gap-2"
                style={{ color: BRAND_COLORS.navy }}
              >
                <Target className="w-5 h-5" />
                Maturity Journey
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Today</span>
                  <span className="font-semibold">{DEMO_MATURITY_JOURNEY.today}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">6 Months</span>
                  <span className="font-semibold text-blue-600">{DEMO_MATURITY_JOURNEY.month6}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">12 Months</span>
                  <span className="font-semibold text-blue-600">{DEMO_MATURITY_JOURNEY.month12}%</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-sm text-slate-600">Target Level</span>
                  <span className="font-semibold text-green-600">
                    L{DEMO_MATURITY_JOURNEY.targetLevel}: {DEMO_MATURITY_JOURNEY.targetLevelName}
                  </span>
                </div>
              </div>
            </div>

            {/* Priority Actions - Blurred */}
            <BlurOverlay title="Action Recommendations">
              <div className="bg-white border border-slate-200 rounded-sm p-6">
                <h2
                  className="text-lg font-semibold mb-4 flex items-center gap-2"
                  style={{ color: BRAND_COLORS.navy }}
                >
                  <FileText className="w-5 h-5" />
                  Priority Actions
                </h2>

                <div className="space-y-3">
                  {DEMO_PRIORITIES.slice(0, 3).map(priority => (
                    <div
                      key={priority.id}
                      className="p-3 border border-slate-200 rounded"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                          {priority.priority}
                        </span>
                        <span className="text-xs text-slate-500">{priority.objective}</span>
                      </div>
                      <p className="text-sm text-slate-700">{priority.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </BlurOverlay>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 bg-white border border-slate-200 rounded-sm p-8 text-center">
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: BRAND_COLORS.navy }}
          >
            Ready to get your full report?
          </h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Complete the full diagnostic to receive your personalized executive report with
            actionable recommendations tailored to your organization.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded transition-colors"
              style={{ backgroundColor: BRAND_COLORS.navy }}
            >
              Upgrade to Pro
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/dashboard"
              className="text-sm font-medium text-slate-600 hover:text-slate-800"
            >
              Continue with Free Tier
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
