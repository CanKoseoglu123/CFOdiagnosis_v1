// src/components/Logo.jsx
// CFO LENS AI logo component - uses official branding images

import React from 'react';

// Brand colors from official logo
export const BRAND_COLORS = {
  navy: '#1a365d',
  gold: '#c9a050',
  lightBlue: '#94a3b8',
};

// Logo variants available
const LOGO_VARIANTS = {
  horizontal: '/Logo horizontal.png',
  vertical: '/Logo Vertical.png',
  circle: '/Logo verticle circle.png',
};

// Icon only (uses circular badge version cropped, or vertical for cleaner icon)
export function LogoIcon({ size = 40, className = '' }) {
  return (
    <img
      src={LOGO_VARIANTS.circle}
      alt="CFO Lens AI"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}

// Full logo with text - uses horizontal image
export function Logo({ size = 'md', className = '', variant = 'horizontal' }) {
  const sizes = {
    sm: { height: 28 },
    md: { height: 36 },
    lg: { height: 48 },
    xl: { height: 64 },
  };

  const s = sizes[size] || sizes.md;
  const src = LOGO_VARIANTS[variant] || LOGO_VARIANTS.horizontal;

  return (
    <img
      src={src}
      alt="CFO Lens AI"
      height={s.height}
      className={`object-contain ${className}`}
      style={{ height: s.height }}
    />
  );
}

export default Logo;
