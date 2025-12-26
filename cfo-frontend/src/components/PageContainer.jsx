// components/PageContainer.jsx
// Reusable container implementing "Option A" centering from Gartner Enterprise design system
// Centers content horizontally with consistent padding and max-width constraints

import './PageContainer.css';

/**
 * PageContainer - Wraps page content with consistent centering and constraints
 *
 * @param {string} variant - 'default' (1152px) or 'wide' (1280px)
 * @param {boolean} flush - If true, removes vertical padding (for page headers)
 * @param {string} className - Additional CSS classes
 * @param {ReactNode} children - Page content
 *
 * Usage:
 *   <PageContainer>Standard page content</PageContainer>
 *   <PageContainer variant="wide">Wide page content</PageContainer>
 *   <PageContainer flush>Header without vertical padding</PageContainer>
 */
export default function PageContainer({
  variant = 'default',
  flush = false,
  className = '',
  children
}) {
  const classes = [
    'page-container',
    variant === 'wide' ? 'page-container--wide' : 'page-container--default',
    flush ? 'page-container--flush' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
}
