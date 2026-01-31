// src/components/report/OwnerAssignmentPanel.jsx
// Progressive Wizard Step 4 - Assign owners to selected actions
// Includes bulk assignment and owner suggestions from previous entries

import React, { useState, useMemo } from 'react';
import { AlertCircle, User, Zap, ChevronDown } from 'lucide-react';
import { isQuickWin } from '../../utils/wizardUtils';

const TIMELINE_LABELS = {
  '6m': '6 Months',
  '12m': '12 Months',
  '24m': '24 Months'
};

export default function OwnerAssignmentPanel({
  gaps,
  selectedActions,
  timelines,
  owners,
  onOwnerChange,
  onBulkOwnerAssign
}) {
  const [bulkOwner, setBulkOwner] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter to selected actions only
  const selectedGaps = gaps.filter(g => selectedActions.has(g.id));

  // Get unique owners for suggestions
  const existingOwners = useMemo(() => {
    const ownerSet = new Set();
    owners.forEach(owner => {
      if (owner && owner.trim()) {
        ownerSet.add(owner.trim());
      }
    });
    return Array.from(ownerSet).sort();
  }, [owners]);

  // Group by timeline for organization
  const grouped = {
    '6m': selectedGaps.filter(g => timelines.get(g.id) === '6m'),
    '12m': selectedGaps.filter(g => timelines.get(g.id) === '12m'),
    '24m': selectedGaps.filter(g => timelines.get(g.id) === '24m'),
    unassigned: selectedGaps.filter(g => !timelines.get(g.id))
  };

  const assignedCount = selectedGaps.filter(g => owners.get(g.id)?.trim()).length;
  const unassignedOwnerCount = selectedGaps.filter(g => !owners.get(g.id)?.trim()).length;
  const totalCount = selectedGaps.length;

  const handleBulkAssign = () => {
    if (bulkOwner.trim()) {
      onBulkOwnerAssign(bulkOwner.trim());
      setBulkOwner('');
      setShowSuggestions(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with bulk assign */}
      <div className="px-3 py-2 lg:px-6 lg:py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between mb-2 lg:mb-3">
          <div>
            <h3 className="text-sm lg:text-base font-semibold text-slate-800">
              Assign Owners
            </h3>
            <p className="text-sm text-slate-600 mt-1 hidden lg:block">
              Designate who is responsible for each action. Use bulk assign for efficiency.
            </p>
          </div>
        </div>

        {/* Bulk assign controls */}
        {unassignedOwnerCount > 0 && (
          <div className="p-3 bg-white border border-slate-200 rounded-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 whitespace-nowrap">
                Apply to {unassignedOwnerCount} without owner:
              </span>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={bulkOwner}
                  onChange={(e) => setBulkOwner(e.target.value)}
                  onFocus={() => existingOwners.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBulkAssign()}
                  placeholder="Enter owner name..."
                  className="w-full text-sm border border-slate-300 rounded-sm px-3 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                {/* Suggestions dropdown */}
                {showSuggestions && existingOwners.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-sm shadow-lg z-10 max-h-32 overflow-y-auto">
                    {existingOwners.map(owner => (
                      <button
                        key={owner}
                        onMouseDown={() => {
                          setBulkOwner(owner);
                          setShowSuggestions(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        {owner}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleBulkAssign}
                disabled={!bulkOwner.trim()}
                className="px-4 py-1.5 text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-2 lg:p-4">
        {totalCount === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-sm">No actions selected</p>
            <p className="text-xs text-slate-400 mt-1">
              Go back to select actions first.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Group by timeline */}
            {['6m', '12m', '24m', 'unassigned'].map(key => {
              const actions = grouped[key];
              if (actions.length === 0) return null;

              return (
                <OwnerGroup
                  key={key}
                  label={key === 'unassigned' ? 'No Timeline Set' : TIMELINE_LABELS[key]}
                  actions={actions}
                  owners={owners}
                  onOwnerChange={onOwnerChange}
                  existingOwners={existingOwners}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with progress - hidden on mobile */}
      <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 hidden lg:block">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">
            Assigned: <strong className={assignedCount === totalCount ? 'text-emerald-600' : ''}>{assignedCount}</strong>/{totalCount} owner{totalCount !== 1 ? 's' : ''}
          </span>
          {unassignedOwnerCount > 0 && (
            <span className="text-xs text-amber-600">
              {unassignedOwnerCount} need owner
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function OwnerGroup({ label, actions, owners, onOwnerChange, existingOwners }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const assignedCount = actions.filter(a => owners.get(a.id)?.trim()).length;

  return (
    <div className="border border-slate-200 rounded-sm overflow-hidden">
      {/* Group header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center gap-2 bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-colors"
      >
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="text-xs text-slate-500 ml-auto">
          {assignedCount}/{actions.length} assigned
        </span>
      </button>

      {/* Actions */}
      {isExpanded && (
        <div className="bg-white divide-y divide-slate-100">
          {actions.map(action => (
            <OwnerActionRow
              key={action.id}
              action={action}
              currentOwner={owners.get(action.id) || ''}
              onOwnerChange={(value) => onOwnerChange(action.id, value)}
              existingOwners={existingOwners}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OwnerActionRow({ action, currentOwner, onOwnerChange, existingOwners }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const quickWin = isQuickWin(action);
  const isCritical = action.is_critical;

  return (
    <div className="px-4 py-3 flex items-center gap-4">
      {/* Action info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isCritical && (
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
          {quickWin && (
            <Zap className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
          )}
          <span className="text-sm font-medium text-slate-700 truncate">
            {action.expert_action?.title || action.text}
          </span>
        </div>
      </div>

      {/* Owner input with suggestions */}
      <div className="relative w-40 flex-shrink-0">
        <div className="relative">
          <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={currentOwner}
            onChange={(e) => onOwnerChange(e.target.value)}
            onFocus={() => existingOwners.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Owner..."
            className="w-full text-sm border border-slate-300 rounded-sm pl-8 pr-3 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {/* Suggestions dropdown */}
        {showSuggestions && existingOwners.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-sm shadow-lg z-10 max-h-32 overflow-y-auto">
            {existingOwners
              .filter(owner => owner.toLowerCase().includes(currentOwner.toLowerCase()))
              .slice(0, 5)
              .map(owner => (
                <button
                  key={owner}
                  onMouseDown={() => {
                    onOwnerChange(owner);
                    setShowSuggestions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {owner}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
