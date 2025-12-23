// src/components/report/StrategicRoadmap.jsx

import React, { useState } from 'react';
import { AlertTriangle, Lock, ChevronDown, ChevronRight, Zap, TrendingUp } from 'lucide-react';
// Assuming Gartner colors are configured in tailwind.config.js

export default function StrategicRoadmap({ initiatives }) {
  // Filter actions by priority
  const p1Initiatives = initiatives.filter(i => i.priority === 'P1');
  const roadmapInitiatives = initiatives.filter(i => ['P2', 'P3'].includes(i.priority));

  const [activeTab, setActiveTab] = useState('P2');

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Strategic Roadmap & Triage
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Prioritized actions to unlock maturity and optimize performance.
        </p>
      </div>

      {/* ZONE 1: THE RED ZONE (P1 BLOCKERS) */}
      {/* "Fair but Firm": These are expanded by default because they are holding the user back */}
      {p1Initiatives.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 bg-red-100 rounded-sm">
              <Lock className="w-3 h-3 text-red-700" />
            </div>
            <h3 className="text-sm font-bold text-navy uppercase">
              Critical Maturity Blockers (Unlock Level {p1Initiatives[0].actions[0].impact})
            </h3>
          </div>

          {p1Initiatives.map(initiative => (
            <div key={initiative.id} className="bg-red-50 border border-red-200 rounded-sm overflow-hidden">
              {/* Header is darker red to denote urgency */}
              <div className="px-4 py-3 border-b border-red-200 bg-red-100/50 flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-red-900">{initiative.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-red-700 font-medium">
                      {initiative.actions.length} Critical Action{initiative.actions.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-white/60 text-red-800 text-[10px] font-bold uppercase tracking-wide rounded-sm border border-red-200">
                  P1: Unlock
                </span>
              </div>

              {/* Action Body - ALWAYS EXPANDED for P1 */}
              <div className="p-4 space-y-4">
                {initiative.actions.map(action => (
                  <div key={action.question_id} className="flex gap-3">
                    <div className="mt-0.5 min-w-[16px]">
                       <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      {/* The "Why": Linking evidence to the cap */}
                      <p className="text-xs text-red-700 mb-1 font-medium">
                        Blocker: You answered "NO" to <span className="italic">"{action.title}"</span>
                      </p>
                      {/* The "What": The Recommendation (Exposed!) */}
                      <p className="text-sm text-navy font-semibold">
                        {action.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ZONE 2: THE ROADMAP (P2/P3 OPTIMIZATION) */}
      {/* Standard "Gartner" Tabbed Interface for non-critical items */}
      <div className="bg-white border border-slate-300 rounded-sm mt-6">
        <div className="border-b border-slate-300 px-2 flex gap-4">
          {['P2', 'P3'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2
                ${activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-navy'}
              `}
            >
              {tab === 'P2' ? <Zap className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              {tab === 'P2' ? 'Optimize (P2)' : 'Future (P3)'}
            </button>
          ))}
        </div>

        <div className="p-0">
          {roadmapInitiatives
            .filter(i => i.priority === activeTab)
            .map(initiative => (
              <div key={initiative.id} className="border-b border-slate-100 last:border-0">
                {/* Standard Collapsible Row for Roadmap Items */}
                <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 text-left group">
                  <div>
                    <span className="text-sm font-medium text-navy group-hover:text-primary transition-colors">
                      {initiative.title}
                    </span>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {initiative.actions.length} actions · {initiative.theme_id}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              </div>
          ))}

          {/* Empty State handling */}
          {roadmapInitiatives.filter(i => i.priority === activeTab).length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">
              No actions in this category.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
