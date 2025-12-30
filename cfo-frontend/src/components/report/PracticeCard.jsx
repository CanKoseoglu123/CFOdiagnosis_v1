// src/components/report/PracticeCard.jsx
// VS-33: Priority Matrix - Individual practice card

import React from 'react';

const statusStyles = {
  complete: 'bg-emerald-500 text-white',
  partial: 'bg-emerald-300 text-emerald-900',
  gap: 'bg-red-500 text-white',
};

export default function PracticeCard({ practice }) {
  const style = statusStyles[practice.status] || statusStyles.gap;

  // Build tooltip content
  const tooltip = [
    practice.objective_name,
    `Level ${practice.level}`,
    `Importance: ${practice.importance}`,
    practice.has_critical ? '(Critical)' : ''
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
