/**
 * MobileDesktopHint
 *
 * One-time-per-session popup shown to mobile users on the report page,
 * recommending they switch to desktop or landscape mode.
 */

import React, { useState } from 'react';
import { X, Monitor } from 'lucide-react';
import { BRAND_COLORS } from '../Logo';

const STORAGE_KEY = 'report-desktop-hint-dismissed';

export default function MobileDesktopHint() {
  const [visible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1024 && !sessionStorage.getItem(STORAGE_KEY);
  });
  const [open, setOpen] = useState(visible);

  if (!open) return null;

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={dismiss} />

      <div className="relative bg-white rounded-sm border border-slate-200 max-w-sm w-full mx-4 p-6">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div
          className="w-12 h-12 rounded-sm flex items-center justify-center mb-4"
          style={{ backgroundColor: `${BRAND_COLORS.navy}15` }}
        >
          <Monitor className="w-6 h-6" style={{ color: BRAND_COLORS.navy }} />
        </div>

        <h2
          className="text-xl font-bold mb-2"
          style={{ color: BRAND_COLORS.navy }}
        >
          Best Viewed on Desktop
        </h2>

        <p className="text-slate-600 mb-6">
          This report contains detailed charts and data tables designed for larger screens.
          For the best experience, switch to a desktop device or rotate to landscape mode.
        </p>

        <button
          onClick={dismiss}
          className="w-full py-2.5 px-4 rounded-sm font-medium text-white transition-colors"
          style={{ backgroundColor: BRAND_COLORS.navy }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
