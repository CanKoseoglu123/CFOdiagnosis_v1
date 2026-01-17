// src/components/report/PracticeCard.jsx
// VS-33: Priority Matrix - Individual practice card
// Colors aligned with ObjectivesPracticesOverview (navy blue theme)

import React from 'react';

// Navy blue color scheme matching ObjectivesPracticesOverview
const statusStyles = {
  complete: 'bg-[#003366] text-white',      // Dark navy - proven
  partial: 'bg-[#336699] text-white',       // Medium blue - partial
  gap: 'bg-[#6699CC] text-white',           // Light blue - gap
  not_assessed: 'bg-slate-200 text-slate-500 border border-slate-300 border-dashed',  // Muted gray with dashed border
};

export default function PracticeCard({ practice }) {
  const style = statusStyles[practice.status] || statusStyles.gap;
  const isNotAssessed = practice.status === 'not_assessed';

  // Build tooltip content
  const tooltip = [
    isNotAssessed ? 'Not Assessed (all questions marked N/A)' : null,
    practice.objective_name,
    `Level ${practice.level}`,
    `Importance: ${practice.importance}`,
    practice.has_critical && !isNotAssessed ? '(Critical)' : ''
  ].filter(Boolean).join(' | ');

  return (
    <div
      className={`px-2 py-1.5 rounded text-xs font-medium ${style} cursor-default`}
      title={tooltip}
    >
      {practice.name}
    </div>
  );
}
