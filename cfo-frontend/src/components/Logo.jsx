// src/components/Logo.jsx
// CFO LENS AI logo component

import React from 'react';

// Brand colors extracted from logo
export const BRAND_COLORS = {
  navy: '#1a365d',
  gold: '#c9a227',
  lightBlue: '#94a3b8',
};

// Icon only (the geometric lens with diamond)
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
      {/* Top-left L-bracket */}
      <path
        d="M5 5 L5 40 L15 40 L15 15 L40 15 L40 5 Z"
        fill={BRAND_COLORS.navy}
      />
      {/* Top-right L-bracket */}
      <path
        d="M95 5 L60 5 L60 15 L85 15 L85 40 L95 40 Z"
        fill={BRAND_COLORS.navy}
      />
      {/* Bottom-left L-bracket */}
      <path
        d="M5 95 L5 60 L15 60 L15 85 L40 85 L40 95 Z"
        fill={BRAND_COLORS.navy}
      />
      {/* Bottom-right L-bracket */}
      <path
        d="M95 95 L60 95 L60 85 L85 85 L85 60 L95 60 Z"
        fill={BRAND_COLORS.navy}
      />
      {/* Inner top-left bracket */}
      <path
        d="M25 25 L25 45 L32 45 L32 32 L45 32 L45 25 Z"
        fill={BRAND_COLORS.navy}
      />
      {/* Inner top-right bracket */}
      <path
        d="M75 25 L55 25 L55 32 L68 32 L68 45 L75 45 Z"
        fill={BRAND_COLORS.navy}
      />
      {/* Inner bottom-left bracket */}
      <path
        d="M25 75 L25 55 L32 55 L32 68 L45 68 L45 75 Z"
        fill={BRAND_COLORS.navy}
      />
      {/* Inner bottom-right bracket */}
      <path
        d="M75 75 L55 75 L55 68 L68 68 L68 55 L75 55 Z"
        fill={BRAND_COLORS.navy}
      />
      {/* Center diamond */}
      <path
        d="M50 35 L65 50 L50 65 L35 50 Z"
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
