// src/components/report/MaturityFootprintGrid.jsx
// VS-23: Maturity Footprint Grid - Enterprise design system compliant
// VS-27: Added Objectives & Practices Overview
// VS-35: Redesigned Capability Footprint - Proven/Opportunities groups, color for critical

import React from 'react';
import { Target, CheckCircle, AlertTriangle } from 'lucide-react';
import ObjectivesPracticesOverview from './ObjectivesPracticesOverview';

// ═══════════════════════════════════════════════════════════════════════════
// VS-35: PRACTICE TILE for Proven/Opportunities layout
// ═══════════════════════════════════════════════════════════════════════════

function PracticeTileV2({ practice, state }) {
  // VS-35: Critical uses different background color instead of icon
  const isCritical = practice.is_critical;

  // Background colors based on state and critical
  let bgColor = 'bg-white';
  let textColor = 'text-slate-700';
  let borderColor = 'border-slate-200';

  if (state === 'proven') {
    bgColor = isCritical ? 'bg-emerald-100' : 'bg-emerald-50';
    borderColor = 'border-emerald-300';
    textColor = 'text-emerald-800';
  } else if (state === 'partial') {
    bgColor = isCritical ? 'bg-amber-100' : 'bg-amber-50';
    borderColor = 'border-amber-300';
    textColor = 'text-amber-800';
  } else {
    // Gap / not_proven
    bgColor = isCritical ? 'bg-red-100' : 'bg-slate-50';
    borderColor = isCritical ? 'border-red-300' : 'border-slate-200';
    textColor = isCritical ? 'text-red-800' : 'text-slate-600';
  }

  return (
    <div
      className={`
        ${bgColor} border ${borderColor} rounded px-2 py-1.5
        min-w-[100px] max-w-[160px] flex-shrink-0
      `}
    >
      <div className="flex items-center justify-between gap-1">
        <span className={`text-xs font-medium truncate ${textColor}`}>
          {practice.title}
        </span>
        <span className="text-[9px] text-slate-400 flex-shrink-0">L{practice.level}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FOCUS NEXT - Priority gaps to address
// ═══════════════════════════════════════════════════════════════════════════

function FocusNextRow({ item, rank }) {
  // VS-35: Use color for critical instead of icon
  const isCritical = item.is_critical;
  const bgColor = isCritical ? 'bg-red-50' : 'bg-white';
  const borderColor = isCritical ? 'border-red-200' : 'border-slate-200';

  return (
    <div className={`flex items-center gap-3 py-2 px-3 ${bgColor} border ${borderColor} rounded-sm`}>
      {/* Rank */}
      <div className={`w-6 h-6 ${isCritical ? 'bg-red-700' : 'bg-slate-800'} text-white rounded-sm flex items-center justify-center flex-shrink-0`}>
        <span className="text-xs font-bold">{rank}</span>
      </div>

      {/* Title */}
      <span className={`flex-1 text-sm font-medium ${isCritical ? 'text-red-800' : 'text-slate-700'}`}>
        {item.title}
      </span>

      {/* Level badge */}
      <span className="text-xs text-slate-500">
        L{item.level}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VS-35: CAPABILITY SECTION - Proven or Opportunities
// ═══════════════════════════════════════════════════════════════════════════

function CapabilitySection({ title, practices, type, icon: Icon, headerBg }) {
  if (!practices || practices.length === 0) return null;

  return (
    <div className="flex-1">
      {/* Section header */}
      <div className={`${headerBg} text-white px-3 py-2 rounded-t flex items-center gap-2`}>
        {Icon && <Icon className="w-4 h-4" />}
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs opacity-75 ml-auto">{practices.length} practices</span>
      </div>

      {/* Practices list */}
      <div className="border border-t-0 border-slate-200 rounded-b p-2 bg-white">
        <div className="flex flex-wrap gap-1.5">
          {practices.map(practice => (
            <PracticeTileV2
              key={practice.id}
              practice={practice}
              state={practice.evidence_state}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VS-35: LEGEND for new design
// ═══════════════════════════════════════════════════════════════════════════

function Legend() {
  return (
    <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-3">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-emerald-50 border border-emerald-300 rounded" />
        <span>Proven</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-amber-50 border border-amber-300 rounded" />
        <span>Partial</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-slate-50 border border-slate-200 rounded" />
        <span>Gap</span>
      </div>
      <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
        <div className="w-4 h-4 bg-red-100 border border-red-300 rounded" />
        <span>Critical (darker shade)</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function MaturityFootprintGrid({ levels, focusNext, summaryText, objectiveScores = {} }) {
  // VS-35: Flatten all practices and split into Proven vs Opportunities
  const allPractices = [];
  (levels || []).forEach(level => {
    (level.practices || []).forEach(practice => {
      allPractices.push({
        ...practice,
        level: practice.level || level.level
      });
    });
  });

  // Split into groups
  const provenPractices = allPractices.filter(p => p.evidence_state === 'proven');
  const opportunityPractices = allPractices.filter(p =>
    p.evidence_state === 'partial' || p.evidence_state === 'not_proven'
  );

  // Sort by level (L1 first within each group)
  provenPractices.sort((a, b) => (a.level || 1) - (b.level || 1));
  opportunityPractices.sort((a, b) => {
    // Critical first, then by level
    if (a.is_critical && !b.is_critical) return -1;
    if (!a.is_critical && b.is_critical) return 1;
    return (a.level || 1) - (b.level || 1);
  });

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SUMMARY INSIGHT */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {summaryText && (
        <div className="bg-white border border-slate-300 rounded-sm p-4">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate leading-relaxed">
              {summaryText}
            </p>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* OBJECTIVES & PRACTICES OVERVIEW (VS-27) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <ObjectivesPracticesOverview levels={levels} objectiveScores={objectiveScores} />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VS-35: CAPABILITY FOOTPRINT - Proven / Opportunities layout */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
            Capability Footprint
          </h2>
        </div>

        {/* Two-column layout: Proven | Opportunities */}
        <div className="p-4">
          <div className="flex gap-4">
            {/* Proven Column */}
            <CapabilitySection
              title="Proven"
              practices={provenPractices}
              type="proven"
              icon={CheckCircle}
              headerBg="bg-emerald-600"
            />

            {/* Opportunities Column */}
            <CapabilitySection
              title="Opportunities"
              practices={opportunityPractices}
              type="opportunity"
              icon={AlertTriangle}
              headerBg="bg-amber-600"
            />
          </div>

          {/* Legend */}
          <Legend />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PRIORITY GAPS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {focusNext && focusNext.length > 0 && (
        <div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">
              Priority Gaps
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {focusNext.map((item, idx) => (
              <FocusNextRow key={item.id} item={item} rank={idx + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
