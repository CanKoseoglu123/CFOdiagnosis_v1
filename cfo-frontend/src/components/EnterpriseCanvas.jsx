// components/EnterpriseCanvas.jsx
// Canonical page container for Enterprise Layout System
// THREE width modes only: setup, assessment, report
// Centers content, applies padding, NO visual styling

/**
 * EnterpriseCanvas - Single source of truth for page widths
 *
 * Width modes:
 *   setup      → max-w-6xl (1152px) - Company/Pillar setup forms
 *   assessment → max-w-6xl (1152px) - Question pages
 *   report     → max-w-7xl (1280px) - Report pages (wider for data density)
 *
 * @param {'setup' | 'assessment' | 'report'} mode - Width mode
 * @param {string} className - Additional CSS classes (use sparingly)
 * @param {ReactNode} children - Page content
 */
export default function EnterpriseCanvas({
  mode = 'setup',
  className = '',
  children
}) {
  // Width class based on mode
  const widthClass = mode === 'report' ? 'max-w-7xl' : 'max-w-6xl';

  return (
    <div className={`mx-auto px-6 ${widthClass} ${className}`.trim()}>
      {children}
    </div>
  );
}
