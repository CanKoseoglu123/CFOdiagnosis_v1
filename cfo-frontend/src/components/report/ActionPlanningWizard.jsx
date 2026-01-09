// src/components/report/ActionPlanningWizard.jsx
// VS-46: Action Planning Wizard - Guided action selection through curated lenses

import React, { useState, useMemo, useCallback } from 'react';
import { X, Target, Star, Zap, AlertTriangle, Unlock, Check, ChevronRight, ChevronDown } from 'lucide-react';
import {
  filterByPainPoints,
  filterByPriorities,
  filterQuickWins,
  filterCriticalRisks,
  filterUnlockLevel,
  getPainPointLabels,
  getAddressedPainPoints,
  isQuickWin,
  sortByRelevance,
  formatImpact,
  formatComplexity,
  getImpactColor,
  getComplexityColor,
  groupByPainPoint,
  groupByPriorityObjective
} from '../../utils/wizardUtils';

// Tab configuration - clean slate enterprise style
const TABS = [
  {
    id: 'painPoints',
    label: 'Pain Points',
    icon: Target
  },
  {
    id: 'priorities',
    label: 'Priorities',
    icon: Star
  },
  {
    id: 'quickWins',
    label: 'Quick Wins',
    icon: Zap
  },
  {
    id: 'criticalRisks',
    label: 'Critical Risks',
    icon: AlertTriangle
  },
  {
    id: 'unlockLevel',
    label: 'Unlock Level',
    icon: Unlock
  }
];

export default function ActionPlanningWizard({
  isOpen,
  onClose,
  gaps,
  practices,
  objectives,
  report,
  actionPlan,
  onApplySelections
}) {
  const [activeTab, setActiveTab] = useState('painPoints');

  // Extract context from report
  const painPoints = report?.context?.pillar?.pain_points || [];
  const importanceMap = report?.calibration?.importance_map || {};
  const cappedBy = report?.maturity_v2?.capped_by || [];
  const currentLevel = report?.maturity_v2?.actual_level ?? 1;

  // Initialize wizard selections from current actionPlan
  const [wizardSelections, setWizardSelections] = useState(() =>
    new Set(Object.keys(actionPlan || {}))
  );

  // Track original selections for untick warnings
  const [originalSelections] = useState(() =>
    new Set(Object.keys(actionPlan || {}))
  );

  // Filter gaps for each tab
  const tabData = useMemo(() => {
    return {
      painPoints: sortByRelevance(filterByPainPoints(gaps, painPoints)),
      priorities: sortByRelevance(filterByPriorities(gaps, importanceMap, practices)),
      quickWins: sortByRelevance(filterQuickWins(gaps)),
      criticalRisks: sortByRelevance(filterCriticalRisks(gaps)),
      unlockLevel: sortByRelevance(filterUnlockLevel(gaps, cappedBy))
    };
  }, [gaps, painPoints, importanceMap, practices, cappedBy]);

  // Grouped data for Pain Points and Priorities tabs
  const groupedData = useMemo(() => ({
    painPoints: groupByPainPoint(gaps, painPoints),
    priorities: groupByPriorityObjective(gaps, importanceMap, practices, objectives)
  }), [gaps, painPoints, importanceMap, practices, objectives]);

  // Get counts for badge display
  const tabCounts = useMemo(() => ({
    painPoints: tabData.painPoints.length,
    priorities: tabData.priorities.length,
    quickWins: tabData.quickWins.length,
    criticalRisks: tabData.criticalRisks.length,
    unlockLevel: tabData.unlockLevel.length
  }), [tabData]);

  // Handle action toggle with warning
  const handleToggle = useCallback((questionId) => {
    if (wizardSelections.has(questionId)) {
      // Deselecting - warn only if it was originally in actionPlan
      if (originalSelections.has(questionId)) {
        if (!window.confirm("This action is in your plan. Removing it will delete it from your action plan.")) {
          return;
        }
      }
      setWizardSelections(prev => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    } else {
      setWizardSelections(prev => new Set([...prev, questionId]));
    }
  }, [wizardSelections, originalSelections]);

  // Select all in current tab
  const handleSelectAll = useCallback(() => {
    const currentActions = tabData[activeTab] || [];
    setWizardSelections(prev => {
      const next = new Set(prev);
      currentActions.forEach(q => next.add(q.id));
      return next;
    });
  }, [activeTab, tabData]);

  // Clear all in current tab
  const handleClearAll = useCallback(() => {
    const currentActions = tabData[activeTab] || [];
    const hasOriginalSelections = currentActions.some(q => originalSelections.has(q.id));

    if (hasOriginalSelections) {
      if (!window.confirm("Some of these actions are in your plan. Clearing will remove them from your action plan.")) {
        return;
      }
    }

    setWizardSelections(prev => {
      const next = new Set(prev);
      currentActions.forEach(q => next.delete(q.id));
      return next;
    });
  }, [activeTab, tabData, originalSelections]);

  // Handle close and apply selections
  const handleApply = useCallback(() => {
    const added = [...wizardSelections].filter(id => !originalSelections.has(id));
    const removed = [...originalSelections].filter(id => !wizardSelections.has(id));

    onApplySelections({
      selections: wizardSelections,
      added,
      removed,
      total: wizardSelections.size
    });
  }, [wizardSelections, originalSelections, onApplySelections]);

  // Get high priority objective names for display
  const highPriorityObjectives = useMemo(() => {
    return Object.entries(importanceMap)
      .filter(([, importance]) => importance >= 4)
      .map(([objId, importance]) => {
        const obj = objectives.find(o => o.id === objId);
        return {
          id: objId,
          name: obj?.title || obj?.name || objId,
          level: importance === 5 ? 'Critical' : 'High'
        };
      });
  }, [importanceMap, objectives]);

  // Get tab header content
  const getTabHeader = (tabId) => {
    switch (tabId) {
      case 'painPoints':
        if (painPoints.length === 0) {
          return {
            title: 'Address Your Pain Points',
            subtitle: 'No pain points were selected during setup.'
          };
        }
        return {
          title: 'Address Your Pain Points',
          subtitle: `You mentioned: ${getPainPointLabels(painPoints).join(', ')}`
        };
      case 'priorities':
        if (highPriorityObjectives.length === 0) {
          return {
            title: 'Focus on Your Priorities',
            subtitle: 'No objectives were rated High or Critical.'
          };
        }
        return {
          title: 'Focus on Your Priorities',
          subtitle: `You rated ${highPriorityObjectives.map(o => `${o.name} (${o.level})`).join(', ')} as priorities.`
        };
      case 'quickWins':
        return {
          title: 'Quick Wins',
          subtitle: 'Low complexity, high impact actions you can start immediately.'
        };
      case 'criticalRisks':
        return {
          title: 'Address Critical Risks',
          subtitle: 'Critical questions that remain unanswered pose significant risk.'
        };
      case 'unlockLevel':
        if (currentLevel >= 4) {
          return {
            title: `You're at Level 4 - Optimized`,
            subtitle: 'Congratulations! You\'ve reached the highest maturity level. Focus on continuous improvement.'
          };
        }
        if (cappedBy.length === 0) {
          return {
            title: `Unlock Level ${currentLevel + 1}`,
            subtitle: 'No specific blockers identified. Focus on overall score improvement.'
          };
        }
        return {
          title: `Unlock Level ${currentLevel + 1}`,
          subtitle: `${cappedBy.length} critical gap${cappedBy.length > 1 ? 's' : ''} blocking your progression.`
        };
      default:
        return { title: '', subtitle: '' };
    }
  };

  if (!isOpen) return null;

  const currentActions = tabData[activeTab] || [];
  const selectedInTab = currentActions.filter(q => wizardSelections.has(q.id)).length;
  const tabHeader = getTabHeader(activeTab);
  const activeTabConfig = TABS.find(t => t.id === activeTab);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl border border-slate-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Action Planning Wizard</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Build your action plan based on what matters most to you
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-2 bg-white overflow-x-auto">
          {TABS.map(tab => {
            const count = tabCounts[tab.id];
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'text-slate-800 border-slate-800'
                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                  isActive ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Tab Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-base font-semibold text-slate-800">
              {tabHeader.title}
            </h3>
            <p className="text-sm text-slate-600 mt-1">{tabHeader.subtitle}</p>
          </div>

          {/* Actions List */}
          <div className="flex-1 overflow-y-auto p-4">
            {currentActions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  {activeTabConfig && <activeTabConfig.icon className="w-6 h-6 text-slate-400" />}
                </div>
                <p className="text-sm">Nothing to show here</p>
                <p className="text-xs text-slate-400 mt-1">
                  {activeTab === 'painPoints' && 'Select pain points during setup to see relevant actions.'}
                  {activeTab === 'priorities' && 'Rate objectives as High or Critical to see priority actions.'}
                  {activeTab === 'quickWins' && 'All quick wins have been addressed.'}
                  {activeTab === 'criticalRisks' && 'No critical questions are failing.'}
                  {activeTab === 'unlockLevel' && 'No specific blockers for level progression.'}
                </p>
              </div>
            ) : activeTab === 'painPoints' && groupedData.painPoints.length > 0 ? (
              // Grouped view for Pain Points
              <div className="space-y-4">
                {groupedData.painPoints.map(group => (
                  <GroupedSection
                    key={group.painPoint.value}
                    title={group.painPoint.label}
                    subtitle={`${group.actions.length} action${group.actions.length !== 1 ? 's' : ''}`}
                    actions={group.actions}
                    wizardSelections={wizardSelections}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            ) : activeTab === 'priorities' && groupedData.priorities.length > 0 ? (
              // Grouped view for Priorities
              <div className="space-y-4">
                {groupedData.priorities.map(group => (
                  <GroupedSection
                    key={group.objective.id}
                    title={group.objective.name}
                    subtitle={`${group.objective.importanceLabel} Priority - ${group.actions.length} action${group.actions.length !== 1 ? 's' : ''}`}
                    actions={group.actions}
                    wizardSelections={wizardSelections}
                    onToggle={handleToggle}
                    badge={group.objective.importanceLabel}
                    badgeColor={group.objective.importance === 5 ? 'bg-amber-500 text-white' : 'bg-slate-400 text-white'}
                  />
                ))}
              </div>
            ) : (
              // Flat view for other tabs
              <div className="space-y-2">
                {currentActions.map(question => (
                  <ActionCard
                    key={question.id}
                    question={question}
                    isSelected={wizardSelections.has(question.id)}
                    onToggle={handleToggle}
                    showPainPoints={activeTab === 'painPoints'}
                    painPoints={painPoints}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                Selected: <strong>{selectedInTab}</strong> of {currentActions.length} in this tab
              </span>
              <span className="text-sm text-slate-400">|</span>
              <span className="text-sm text-slate-600">
                Total selected: <strong>{wizardSelections.size}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              {currentActions.length > 0 && (
                <>
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
                  >
                    Clear All
                  </button>
                </>
              )}
              <button
                onClick={handleApply}
                className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-sm hover:bg-slate-900 transition-colors flex items-center gap-2"
              >
                Apply & Close
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== GROUPED SECTION COMPONENT ==========
// Mirrors CapabilitySection from MaturityFootprintGrid
function GroupedSection({ title, subtitle, actions, wizardSelections, onToggle, badge, badgeColor }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const selectedCount = actions.filter(a => wizardSelections.has(a.id)).length;

  return (
    <div>
      {/* Section header - matches CapabilitySection style */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-slate-600 text-white px-3 py-2 rounded-t flex items-center gap-2 hover:bg-slate-700 transition-colors"
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
        <span className="text-sm font-semibold">{title}</span>
        {badge && (
          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${badgeColor}`}>
            {badge}
          </span>
        )}
        <span className="text-xs opacity-75 ml-auto">
          {selectedCount}/{actions.length} selected
        </span>
      </button>

      {/* Actions list - matches CapabilitySection content area */}
      {isExpanded && (
        <div className="border border-t-0 border-slate-200 rounded-b p-2 bg-white">
          <div className="flex flex-col gap-1.5">
            {actions.map(question => (
              <ActionCard
                key={question.id}
                question={question}
                isSelected={wizardSelections.has(question.id)}
                onToggle={onToggle}
                compact
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ========== ACTION CARD COMPONENT ==========
// Mirrors PracticeTileV2 from MaturityFootprintGrid
function ActionCard({ question, isSelected, onToggle, showPainPoints, painPoints, compact }) {
  const quickWin = isQuickWin(question);
  const addressedPains = showPainPoints ? getAddressedPainPoints(question, painPoints) : [];
  const isCritical = question.is_critical;

  // Colors matching PracticeTileV2 pattern
  let bgColor, borderColor, textColor;
  if (isSelected) {
    bgColor = isCritical ? 'bg-emerald-100' : 'bg-emerald-50';
    borderColor = 'border-emerald-300';
    textColor = 'text-emerald-800';
  } else {
    bgColor = isCritical ? 'bg-amber-50' : 'bg-white';
    borderColor = isCritical ? 'border-amber-200' : 'border-slate-200';
    textColor = isCritical ? 'text-amber-800' : 'text-slate-700';
  }

  return (
    <div
      onClick={() => onToggle(question.id)}
      className={`${bgColor} border ${borderColor} rounded px-3 py-2 cursor-pointer hover:opacity-90 transition-all`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
          isSelected
            ? 'bg-emerald-600 border-emerald-600'
            : 'border-slate-300 bg-white'
        }`}>
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2">
            {isCritical && (
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            )}
            <span className={`text-sm font-medium ${textColor}`}>
              {question.expert_action?.title || question.text}
            </span>
          </div>

          {/* Recommendation (hide in compact mode) */}
          {!compact && question.expert_action?.recommendation && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {question.expert_action.recommendation}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${getImpactColor(question.impact)}`}>
              Impact: {formatImpact(question.impact)}
            </span>
            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${getComplexityColor(question.complexity)}`}>
              Complexity: {formatComplexity(question.complexity)}
            </span>
            {quickWin && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-700 text-white flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" />
                Quick Win
              </span>
            )}
            {addressedPains.length > 0 && (
              <span className="text-[10px] text-slate-400">
                Addresses: {getPainPointLabels(addressedPains).join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
