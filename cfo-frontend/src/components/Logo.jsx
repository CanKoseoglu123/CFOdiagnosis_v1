// src/components/Logo.jsx
// CFO LENS AI logo component

import React from 'react';

// Brand colors extracted from logo
export const BRAND_COLORS = {
  navy: '#1e3a5f',
  gold: '#c9a050',
  lightBlue: '#7b8fa3',
};

// Icon only (the geometric squares with diamond)
export function LogoIcon({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top-left square */}
      <path
        d="M8 8 L42 8 L42 42 L8 42 Z"
        fill="none"
        stroke={BRAND_COLORS.navy}
        strokeWidth="6"
      />
      {/* Top-right square */}
      <path
        d="M58 8 L92 8 L92 42 L58 42 Z"
        fill="none"
        stroke={BRAND_COLORS.navy}
        strokeWidth="6"
      />
      {/* Bottom-left square */}
      <path
        d="M8 58 L42 58 L42 92 L8 92 Z"
        fill="none"
        stroke={BRAND_COLORS.navy}
        strokeWidth="6"
      />
      {/* Bottom-right square */}
      <path
        d="M58 58 L92 58 L92 92 L58 92 Z"
        fill="none"
        stroke={BRAND_COLORS.navy}
        strokeWidth="6"
      />
      {/* Center diamond */}
      <path
        d="M50 30 L70 50 L50 70 L30 50 Z"
        fill={BRAND_COLORS.gold}
      />
    </svg>
  );
}

// Full logo with text
export function Logo({ size = 'md', className = '' }) {
  const sizes = {
    sm: { icon: 32, text: 'text-lg', ai: 'text-lg' },
    md: { icon: 40, text: 'text-2xl', ai: 'text-2xl' },
    lg: { icon: 56, text: 'text-3xl', ai: 'text-3xl' },
    xl: { icon: 72, text: 'text-4xl', ai: 'text-4xl' },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon size={s.icon} />
      <div className="flex items-baseline gap-1.5">
        <span
          className={`font-bold tracking-tight ${s.text}`}
          style={{ color: BRAND_COLORS.navy }}
        >
          CFO LENS
        </span>
        <span
          className={`font-light ${s.ai}`}
          style={{ color: BRAND_COLORS.lightBlue }}
        >
          AI
        </span>
      </div>
    </div>
  );
}

export default Logo;
