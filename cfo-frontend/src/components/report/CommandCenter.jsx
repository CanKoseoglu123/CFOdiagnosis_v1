// src/components/report/CommandCenter.jsx
// VS-28: Command Center - Actions/Initiatives list with controls

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';

// Timeline options
const TIMELINE_OPTIONS = [
  { value: null, label: 'Select timeline...' },
  { value: '6m', label: '6 months' },
  { value: '12m', label: '12 months' },
  { value: '24m', label: '24 months' }
];

// Objective display names
const OBJECTIVE_NAMES = {
  'obj_budget_discipline': 'Budget Discipline',
  'obj_financial_controls': 'Financial Controls',
  'obj_performance_monitoring': 'Performance Monitoring',
  'obj_forecasting_agility': 'Forecasting Agility',
  'obj_driver_based_planning': 'Driver-Based Planning',
  'obj_scenario_modeling': 'Scenario Modeling',
  'obj_strategic_influence': 'Strategic Influence',
  'obj_decision_support': 'Decision Support',
  'obj_operational_excellence': 'Operational Excellence'
};

export default function CommandCenter({
  viewMode,
  gaps,
  initiatives,
  objectives,
  actionPlan,
  onActionToggle,
  onTimelineChange,
  onOwnerChange
}) {
  // Expand/collapse state for groups
  const [expandedGroups, setExpandedGroups] = useState(new Set(['all']));

  function toggleGroup(groupId) {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  // Render based on view mode
  if (viewMode === 'initiatives') {
    return (
      <InitiativesView
        initiatives={initiatives}
        gaps={gaps}
        actionPlan={actionPlan}
        expandedGroups={expandedGroups}
        toggleGroup={toggleGroup}
        onActionToggle={onActionToggle}
        onTimelineChange={onTimelineChange}
        onOwnerChange={onOwnerChange}
      />
    );
  }

  return (
    <ActionsView
      gaps={gaps}
      objectives={objectives}
      actionPlan={actionPlan}
      expandedGroups={expandedGroups}
      toggleGroup={toggleGroup}
      onActionToggle={onActionToggle}
      onTimelineChange={onTimelineChange}
      onOwnerChange={onOwnerChange}
    />
  );
}

// ========== ACTIONS VIEW (grouped by objective) ==========

function ActionsView({
  gaps,
  objectives,
  actionPlan,
  expandedGroups,
  toggleGroup,
  onActionToggle,
  onTimelineChange,
  onOwnerChange
}) {
  // Group gaps by objective
  const gapsByObjective = {};
  objectives.forEach(obj => {
    gapsByObjective[obj.id] = gaps.filter(g => g.objective_id === obj.id);
  });

  // Filter to only objectives with gaps
  const objectivesWithGaps = objectives.filter(obj => gapsByObjective[obj.id].length > 0);

  return (
    <div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
      <div className="px-4 py-2 border-b border-slate-200 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700">
          Actions by Objective
        </h3>
      </div>

      <div className="divide-y divide-slate-200">
        {objectivesWithGaps.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No gaps identified. Great job!
          </div>
        ) : (
          objectivesWithGaps.map(obj => (
            <ObjectiveGroup
              key={obj.id}
              objective={obj}
              gaps={gapsByObjective[obj.id]}
              actionPlan={actionPlan}
              isExpanded={expandedGroups.has(obj.id) || expandedGroups.has('all')}
              onToggle={() => toggleGroup(obj.id)}
              onActionToggle={onActionToggle}
              onTimelineChange={onTimelineChange}
              onOwnerChange={onOwnerChange}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ObjectiveGroup({
  objective,
  gaps,
  actionPlan,
  isExpanded,
  onToggle,
  onActionToggle,
  onTimelineChange,
  onOwnerChange
}) {
  const selectedCount = gaps.filter(g => actionPlan[g.id]).length;
  const objName = OBJECTIVE_NAMES[objective.id] || objective.name || objective.id;

  return (
    <div>
      {/* Group Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
        <span className="font-semibold text-slate-700 flex-1 text-left">
          {objName}
        </span>
        <span className="text-sm text-slate-500">
          {selectedCount}/{gaps.length} selected
        </span>
      </button>

      {/* Gap Items */}
      {isExpanded && (
        <div className="bg-slate-50 border-t border-slate-200">
          {gaps.map(gap => (
            <ActionRow
              key={gap.id}
              question={gap}
              isSelected={!!actionPlan[gap.id]}
              timeline={actionPlan[gap.id]?.timeline}
              owner={actionPlan[gap.id]?.assigned_owner}
              onToggle={(selected) => onActionToggle(gap.id, selected)}
              onTimelineChange={(t) => onTimelineChange(gap.id, t)}
              onOwnerChange={(o) => onOwnerChange(gap.id, o)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ========== INITIATIVES VIEW (grouped by initiative) ==========

function InitiativesView({
  initiatives,
  gaps,
  actionPlan,
  expandedGroups,
  toggleGroup,
  onActionToggle,
  onTimelineChange,
  onOwnerChange
}) {
  // Group gaps by initiative
  const gapsByInitiative = {};
  initiatives.forEach(init => {
    gapsByInitiative[init.id] = gaps.filter(g => g.initiative_id === init.id);
  });

  // Filter to only initiatives with gaps
  const initiativesWithGaps = initiatives.filter(init => gapsByInitiative[init.id].length > 0);

  return (
    <div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
      <div className="px-4 py-2 border-b border-slate-200 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700">
          Actions by Initiative
        </h3>
      </div>

      <div className="divide-y divide-slate-200">
        {initiativesWithGaps.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No gaps identified. Great job!
          </div>
        ) : (
          initiativesWithGaps.map(init => (
            <InitiativeGroup
              key={init.id}
              initiative={init}
              gaps={gapsByInitiative[init.id]}
              actionPlan={actionPlan}
              isExpanded={expandedGroups.has(init.id) || expandedGroups.has('all')}
              onToggle={() => toggleGroup(init.id)}
              onActionToggle={onActionToggle}
              onTimelineChange={onTimelineChange}
              onOwnerChange={onOwnerChange}
            />
          ))
        )}
      </div>
    </div>
  );
}

function InitiativeGroup({
  initiative,
  gaps,
  actionPlan,
  isExpanded,
  onToggle,
  onActionToggle,
  onTimelineChange,
  onOwnerChange
}) {
  const selectedCount = gaps.filter(g => actionPlan[g.id]).length;

  return (
    <div>
      {/* Group Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
        <div className="flex-1 text-left">
          <div className="font-semibold text-slate-700">{initiative.title}</div>
          <div className="text-xs text-slate-500 mt-0.5">{initiative.description}</div>
        </div>
        <span className="text-sm text-slate-500">
          {selectedCount}/{gaps.length} selected
        </span>
      </button>

      {/* Gap Items */}
      {isExpanded && (
        <div className="bg-slate-50 border-t border-slate-200">
          {gaps.map(gap => (
            <ActionRow
              key={gap.id}
              question={gap}
              isSelected={!!actionPlan[gap.id]}
              timeline={actionPlan[gap.id]?.timeline}
              owner={actionPlan[gap.id]?.assigned_owner}
              onToggle={(selected) => onActionToggle(gap.id, selected)}
              onTimelineChange={(t) => onTimelineChange(gap.id, t)}
              onOwnerChange={(o) => onOwnerChange(gap.id, o)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ========== SHARED ACTION ROW ==========

function ActionRow({
  question,
  isSelected,
  timeline,
  owner,
  onToggle,
  onTimelineChange,
  onOwnerChange
}) {
  const [showOwnerInput, setShowOwnerInput] = useState(false);
  const [ownerDraft, setOwnerDraft] = useState(owner || '');

  function handleOwnerBlur() {
    setShowOwnerInput(false);
    if (ownerDraft !== owner) {
      onOwnerChange(ownerDraft || null);
    }
  }

  return (
    <div className={`px-4 py-3 flex items-start gap-3 border-b border-slate-200 last:border-b-0 ${
      isSelected ? 'bg-blue-50' : ''
    }`}>
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => onToggle(e.target.checked)}
        className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />

      {/* Action Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          {question.is_critical && (
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <div className="text-sm font-medium text-slate-700">
              {question.expert_action?.title || question.text}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {question.expert_action?.recommendation || question.help}
            </div>
            {question.expert_action?.type && (
              <span className={`inline-block mt-1 px-1.5 py-0.5 text-[10px] font-medium rounded ${
                question.expert_action.type === 'quick_win' ? 'bg-green-100 text-green-700' :
                question.expert_action.type === 'structural' ? 'bg-blue-100 text-blue-700' :
                question.expert_action.type === 'behavioral' ? 'bg-purple-100 text-purple-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {question.expert_action.type.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls (only show when selected) */}
      {isSelected && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Timeline Dropdown */}
          <select
            value={timeline || ''}
            onChange={(e) => onTimelineChange(e.target.value || null)}
            className="text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {TIMELINE_OPTIONS.map(opt => (
              <option key={opt.value || 'null'} value={opt.value || ''}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Owner Field */}
          {showOwnerInput ? (
            <input
              type="text"
              value={ownerDraft}
              onChange={(e) => setOwnerDraft(e.target.value)}
              onBlur={handleOwnerBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleOwnerBlur()}
              placeholder="Owner name..."
              autoFocus
              className="text-xs border border-slate-300 rounded px-2 py-1 w-28 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <button
              onClick={() => {
                setOwnerDraft(owner || '');
                setShowOwnerInput(true);
              }}
              className="text-xs text-slate-500 hover:text-slate-700 border border-dashed border-slate-300 rounded px-2 py-1 min-w-[80px] text-left"
            >
              {owner || 'Add owner...'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
