// cfo-frontend/src/components/report/OverviewSection.jsx
// VS-32a: Single overview section display component

import React from 'react';

/**
 * Displays a single AI-generated overview section
 * @param {Object} section - The section data
 * @param {string} section.id - Section identifier
 * @param {string} section.title - Section title
 * @param {string} section.content - Section prose content
 * @param {'prose'|'bullets'} section.format - Display format
 * @param {string[]} [section.bullets] - Bullet points (if format is 'bullets')
 * @param {string[]} section.evidence_ids - Evidence IDs cited
 */
export default function OverviewSection({ section }) {
  if (!section) return null;

  return (
    <div className="bg-white border border-slate-200 rounded p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{section.title}</h3>

      {section.format === 'prose' ? (
        <p className="text-slate-600 text-sm leading-relaxed">{section.content}</p>
      ) : (
        <>
          {section.content && (
            <p className="text-slate-600 text-sm mb-2">{section.content}</p>
          )}
          {section.bullets && section.bullets.length > 0 && (
            <ul className="space-y-1">
              {section.bullets.map((bullet, i) => (
                <li key={i} className="text-sm text-slate-600 flex gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {section.evidence_ids && section.evidence_ids.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Sources: {section.evidence_ids.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
