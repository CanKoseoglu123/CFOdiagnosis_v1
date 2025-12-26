// src/components/ChapterHeader.jsx
// Unified chapter-style header for Assessment and Report pages
// Dark background, declarative content only (no KPIs, tabs, or controls)

import EnterpriseCanvas from './EnterpriseCanvas';

export default function ChapterHeader({
  label,           // e.g. "Theme 1 of 3" or "FP&A DIAGNOSTIC"
  title,           // Main heading
  description,     // Optional one-line description
  mode = 'report'  // EnterpriseCanvas mode: 'setup' | 'assessment' | 'report'
}) {
  return (
    <div className="bg-slate-700 text-white py-5">
      <EnterpriseCanvas mode={mode}>
        {label && (
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            {label}
          </div>
        )}
        <h1 className="text-xl font-bold mb-1">{title}</h1>
        {description && (
          <p className="text-sm text-slate-300">
            {description}
          </p>
        )}
      </EnterpriseCanvas>
    </div>
  );
}
