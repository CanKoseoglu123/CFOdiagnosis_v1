/**
 * WelcomeModal
 *
 * Shown on IntroPage after first run creation.
 * Two variants: 'free' (limitation notice) and 'paid' (thank-you).
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Info, CheckCircle, ArrowRight } from 'lucide-react';
import { BRAND_COLORS } from '../Logo';

export default function WelcomeModal({ isOpen, onClose, variant = 'free' }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const isFree = variant === 'free';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-sm border border-slate-200 max-w-md w-full mx-4 p-6">
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
          style={{ backgroundColor: isFree ? `${BRAND_COLORS.gold}20` : '#dcfce720' }}
        >
          {isFree ? (
            <Info className="w-6 h-6" style={{ color: BRAND_COLORS.gold }} />
          ) : (
            <CheckCircle className="w-6 h-6 text-green-600" />
          )}
        </div>

        {/* Title */}
        <h2
          className="text-xl font-bold mb-2"
          style={{ color: BRAND_COLORS.navy }}
        >
          {isFree ? 'Welcome to the Free Diagnostic' : 'Welcome to CFO Lens Pro'}
        </h2>

        {/* Body */}
        <p className="text-slate-600 mb-6">
          {isFree
            ? "You'll complete 2 objectives (Budget Discipline and Strategic Influence) with a limited results view. For the full 9-objective assessment with benchmarks, PDF reports, and War Room planning, upgrade to Pro."
            : 'Thank you for subscribing. You have full access to all 9 objectives, industry benchmarks, executive PDF reports, and the War Room action planning tool.'}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          {isFree ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: BRAND_COLORS.navy }}
              >
                Got it
              </button>
              <button
                onClick={() => { onClose(); navigate('/pricing'); }}
                className="flex-1 py-2.5 px-4 border border-slate-300 rounded-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                Upgrade to Pro
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
              style={{ backgroundColor: BRAND_COLORS.navy }}
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
