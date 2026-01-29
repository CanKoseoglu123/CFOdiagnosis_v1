/**
 * UpgradeModal
 *
 * Modal shown when user hits free tier limits.
 * Displays value props and subscribe button.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Lock, ArrowRight } from 'lucide-react';
import { BRAND_COLORS } from '../Logo';
import { supabase } from '../../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'https://cfodiagnosisv1-production.up.railway.app';

export default function UpgradeModal({ isOpen, onClose, trigger = 'objective' }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  // Handle subscribe click
  async function handleSubscribe() {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        // Not logged in, redirect to pricing page
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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Context-specific messaging
  const messages = {
    objective: {
      title: 'Upgrade to Access All Objectives',
      description: 'This objective is part of the full diagnostic. Upgrade to Pro to unlock all 9 objectives.',
    },
    pdf: {
      title: 'Upgrade to Export PDF',
      description: 'PDF export is a Pro feature. Upgrade to download executive-ready reports.',
    },
    warroom: {
      title: 'Upgrade to Access War Room',
      description: 'The War Room action planning tool is a Pro feature. Upgrade to build your 90-day roadmap.',
    },
    default: {
      title: 'Upgrade to Pro',
      description: 'Unlock the full CFO Lens experience with all features.',
    },
  };

  const { title, description } = messages[trigger] || messages.default;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-sm shadow-xl max-w-md w-full mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div
          className="w-12 h-12 rounded-sm flex items-center justify-center mb-4"
          style={{ backgroundColor: `${BRAND_COLORS.gold}20` }}
        >
          <Lock className="w-6 h-6" style={{ color: BRAND_COLORS.gold }} />
        </div>

        {/* Title */}
        <h2
          className="text-xl font-bold mb-2"
          style={{ color: BRAND_COLORS.navy }}
        >
          {title}
        </h2>

        {/* Description */}
        <p className="text-slate-600 mb-6">
          {description}
        </p>

        {/* Benefits */}
        <ul className="space-y-2 mb-6">
          <li className="flex items-center gap-2 text-sm text-slate-700">
            <Check className="w-4 h-4" style={{ color: BRAND_COLORS.gold }} />
            All 9 strategic objectives
          </li>
          <li className="flex items-center gap-2 text-sm text-slate-700">
            <Check className="w-4 h-4" style={{ color: BRAND_COLORS.gold }} />
            Industry benchmarks
          </li>
          <li className="flex items-center gap-2 text-sm text-slate-700">
            <Check className="w-4 h-4" style={{ color: BRAND_COLORS.gold }} />
            PDF executive report
          </li>
          <li className="flex items-center gap-2 text-sm text-slate-700">
            <Check className="w-4 h-4" style={{ color: BRAND_COLORS.gold }} />
            War Room action planning
          </li>
        </ul>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-slate-300 rounded-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: BRAND_COLORS.navy }}
          >
            {loading ? 'Loading...' : (
              <>
                Upgrade
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Price note */}
        <p className="text-center text-xs text-slate-500 mt-4">
          €299/year
        </p>
      </div>
    </div>
  );
}
