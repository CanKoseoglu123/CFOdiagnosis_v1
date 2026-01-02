// src/pages/SelectPillarPage.jsx
// Pillar selection page - user chooses which diagnostic to run
// Only FP&A is active, all others coming soon

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo, BRAND_COLORS } from '../components/Logo';
import { supabase } from '../lib/supabase';
import {
  Calculator,
  ShoppingCart,
  Receipt,
  ShieldCheck,
  TrendingDown,
  LineChart,
  Landmark,
  ClipboardCheck,
  Users,
  ArrowRight,
  Clock,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

// Pillar definitions
const PILLARS = [
  {
    id: 'r2r',
    title: 'Accounting Operations',
    subtitle: 'R2R',
    description: 'Assess your Record-to-Report process maturity across close discipline, reconciliations, and controls.',
    icon: Calculator,
    available: false,
  },
  {
    id: 'p2p',
    title: 'Procurement & Spend Management',
    subtitle: 'P2P',
    description: 'Evaluate your Procure-to-Pay processes, vendor management, and spend control maturity.',
    icon: ShoppingCart,
    available: false,
  },
  {
    id: 'o2c',
    title: 'Revenue & Cash Collection',
    subtitle: 'O2C',
    description: 'Assess your Order-to-Cash cycle, billing accuracy, and receivables management.',
    icon: Receipt,
    available: false,
  },
  {
    id: 'controls',
    title: 'Data, Controls & Compliance',
    subtitle: null,
    description: 'Evaluate your internal controls, compliance frameworks, and data governance practices.',
    icon: ShieldCheck,
    available: false,
  },
  {
    id: 'efficiency',
    title: 'Efficiency & Cost Discipline',
    subtitle: null,
    description: 'Assess your cost management, process efficiency, and value optimization capabilities.',
    icon: TrendingDown,
    available: false,
  },
  {
    id: 'fpa',
    title: 'Financial Planning & Analysis',
    subtitle: 'FP&A',
    description: 'Evaluate your planning, forecasting, and business partnering capabilities for strategic decision support.',
    icon: LineChart,
    available: true, // Only FP&A is active
  },
  {
    id: 'liquidity',
    title: 'Liquidity & Capital Stewardship',
    subtitle: null,
    description: 'Assess your cash management, working capital optimization, and capital allocation processes.',
    icon: Landmark,
    available: false,
  },
  {
    id: 'cadence',
    title: 'Accountability & Cadence',
    subtitle: null,
    description: 'Evaluate your governance rhythms, decision-making processes, and performance accountability.',
    icon: ClipboardCheck,
    available: false,
  },
  {
    id: 'people',
    title: 'People & Infrastructure',
    subtitle: null,
    description: 'Assess your talent, organizational capabilities, and enabling infrastructure maturity.',
    icon: Users,
    available: false,
  },
];

export default function SelectPillarPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingPillar, setLoadingPillar] = useState(null);

  async function handlePillarClick(pillar) {
    if (!pillar.available) return;

    setLoading(true);
    setLoadingPillar(pillar.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        navigate('/login');
        return;
      }

      // Create a new diagnostic run
      const res = await fetch(`${API_URL}/diagnostic-runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to create diagnostic run');
      }

      const run = await res.json();
      // Navigate to intro page with the new run
      navigate(`/run/${run.id}/intro`);
    } catch (err) {
      console.error('Error creating run:', err);
      alert('Failed to start assessment. Please try again.');
    } finally {
      setLoading(false);
      setLoadingPillar(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            <span>~25 minutes per assessment</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-28 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ color: BRAND_COLORS.navy }}
            >
              CFO Diagnostic <span style={{ color: BRAND_COLORS.gold }}>Assessment</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Select a pillar to begin your maturity assessment. Each pillar evaluates specific
              capabilities through multiple-choice questions and AI-powered insights.
            </p>
          </div>

          {/* Pillar Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              const isLoading = loadingPillar === pillar.id;

              return (
                <div
                  key={pillar.id}
                  className={`
                    relative bg-white border transition-all
                    ${pillar.available
                      ? 'border-slate-300 hover:border-slate-400 hover:shadow-md cursor-pointer'
                      : 'border-slate-200 cursor-not-allowed'
                    }
                  `}
                  onClick={() => handlePillarClick(pillar)}
                >
                  {/* Badge */}
                  <div className="absolute top-4 right-4">
                    {pillar.available ? (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: '#ecfdf5',
                          color: '#059669',
                        }}
                      >
                        Available Now
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: `${BRAND_COLORS.gold}15`,
                          color: BRAND_COLORS.gold,
                        }}
                      >
                        Coming Soon
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 pt-14">
                    {/* Icon */}
                    <div
                      className="w-10 h-10 flex items-center justify-center mb-4 rounded"
                      style={{
                        backgroundColor: pillar.available
                          ? `${BRAND_COLORS.navy}10`
                          : `${BRAND_COLORS.navy}06`,
                      }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{
                          color: pillar.available ? BRAND_COLORS.navy : '#64748b',
                        }}
                      />
                    </div>

                    {/* Title */}
                    <h3
                      className="font-semibold mb-1"
                      style={{
                        color: pillar.available ? BRAND_COLORS.navy : '#475569',
                      }}
                    >
                      {pillar.title}
                      {pillar.subtitle && (
                        <span className="text-slate-400 font-normal"> – {pillar.subtitle}</span>
                      )}
                    </h3>

                    {/* Description */}
                    <p className={`text-sm mb-4 leading-relaxed ${pillar.available ? 'text-slate-500' : 'text-slate-400'}`}>
                      {pillar.description}
                    </p>

                    {/* CTA */}
                    {pillar.available && (
                      <button
                        className="inline-flex items-center gap-1 text-sm font-medium transition-colors disabled:opacity-50"
                        style={{ color: BRAND_COLORS.navy }}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          'Starting...'
                        ) : (
                          <>
                            Begin Assessment
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="mt-12 text-center">
            <p className="text-sm text-slate-500">
              More pillars coming soon. Each assessment provides a comprehensive maturity score,
              gap analysis, and prioritized action plan.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
