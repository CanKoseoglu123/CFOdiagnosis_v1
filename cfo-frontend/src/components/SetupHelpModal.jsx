// src/components/SetupHelpModal.jsx
// VS-47: Help popup for setup pages - auto-shows on mount, follows FeedbackButton modal pattern

import React, { useState } from 'react';
import { X } from 'lucide-react';

/**
 * SetupHelpModal - Auto-showing help modal for setup pages
 *
 * @param {string} title - Modal header title
 * @param {string} mainText - Primary explanation text (what & expectations)
 * @param {string} whyTitle - "Why" section heading (e.g., "Why we ask:")
 * @param {string} whyText - Explanation of why we ask this information
 */
export default function SetupHelpModal({ title, mainText, whyTitle, whyText }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            {title}
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Main text - what & expectations */}
          <p className="text-sm text-slate-700 leading-relaxed">
            {mainText}
          </p>

          {/* Why section - smaller, explanatory */}
          <div className="bg-slate-50 border border-slate-200 rounded p-4">
            <p className="text-xs font-semibold text-slate-600 mb-1">
              {whyTitle}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              {whyText}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-slate-200">
          <button
            onClick={() => setIsOpen(false)}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
