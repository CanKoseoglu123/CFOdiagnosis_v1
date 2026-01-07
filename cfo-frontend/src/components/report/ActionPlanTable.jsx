// src/components/report/ActionPlanTable.jsx
// VS-45: Action Plan table for Executive Report
// Full-page action plan with repeating headers for print

import React from 'react';

/**
 * ActionPlanTable - Full action plan table grouped by objective
 *
 * @param {Object} props
 * @param {Array} props.commitmentRegister - Actions grouped by objective
 * @param {Object} props.actionCounts - Action counts by timeline
 */
export default function ActionPlanTable({
  commitmentRegister,
  actionCounts
}) {
  // Group actions by owner for accountability summary
  const actionsByOwner = React.useMemo(() => {
    const byOwner = {};
    commitmentRegister.forEach(group => {
      group.actions.forEach(action => {
        const owner = action.owner || 'Unassigned';
        if (!byOwner[owner]) {
          byOwner[owner] = { count: 0, critical: 0 };
        }
        byOwner[owner].count++;
        if (action.isCritical) byOwner[owner].critical++;
      });
    });
    return Object.entries(byOwner).sort((a, b) => b[1].count - a[1].count);
  }, [commitmentRegister]);

  if (commitmentRegister.length === 0) {
    return (
      <div className="border border-slate-300 p-8 text-center bg-slate-50">
        <div className="text-slate-400 text-lg mb-2">No Actions Committed</div>
        <div className="text-sm text-slate-500">
          Use the Action Planning tab to select and schedule improvement actions.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Accountability Summary + Timeline Distribution */}
      <div className="grid grid-cols-2 gap-4">
        {/* Accountability Summary */}
        <div className="border border-slate-300 p-2 bg-slate-50">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Accountability Summary
          </div>
          <div className="space-y-2">
            {actionsByOwner.map(([owner, data]) => (
              <div key={owner} className="flex items-center justify-between text-sm">
                <span className={`text-slate-700 ${owner === 'Unassigned' ? 'italic text-slate-500' : ''}`}>
                  {owner}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">{data.count}</span>
                  {data.critical > 0 && (
                    <span className="text-xs text-red-600">({data.critical} critical)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Distribution */}
        <div className="border border-slate-300 p-2 bg-slate-50">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Timeline Distribution
          </div>
          <div className="space-y-2">
            {/* 6 months */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">6 Months</span>
                <span className="font-semibold text-slate-700">{actionCounts['6m']}</span>
              </div>
              <div className="h-2 bg-slate-200 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-600"
                  style={{ width: `${actionCounts.total ? (actionCounts['6m'] / actionCounts.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            {/* 12 months */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">12 Months</span>
                <span className="font-semibold text-slate-700">{actionCounts['12m']}</span>
              </div>
              <div className="h-2 bg-slate-200 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${actionCounts.total ? (actionCounts['12m'] / actionCounts.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            {/* 24 months */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">24 Months</span>
                <span className="font-semibold text-slate-700">{actionCounts['24m']}</span>
              </div>
              <div className="h-2 bg-slate-200 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-400"
                  style={{ width: `${actionCounts.total ? (actionCounts['24m'] / actionCounts.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Action Plan Table */}
      <div className="border border-slate-300">
        <table className="w-full text-sm action-plan-table">
          {/* thead displays on every printed page */}
          <thead className="bg-slate-100">
            <tr className="border-b border-slate-300">
              <th className="text-left px-3 py-2 font-semibold text-slate-700">Action</th>
              <th className="text-center px-3 py-2 font-semibold text-slate-700 w-32">Owner</th>
              <th className="text-center px-3 py-2 font-semibold text-slate-700 w-24">Timeline</th>
              <th className="text-center px-3 py-2 font-semibold text-slate-700 w-20">Critical</th>
            </tr>
          </thead>
          <tbody>
            {commitmentRegister.map(group => (
              <React.Fragment key={group.objectiveId}>
                {/* Objective Header */}
                <tr className="bg-slate-50 objective-header">
                  <td colSpan={4} className="px-3 py-2 text-xs font-bold text-slate-600 uppercase tracking-wide">
                    {group.objectiveName}
                  </td>
                </tr>
                {/* Actions */}
                {group.actions.map((action, idx) => (
                  <tr
                    key={action.id}
                    className={`border-b border-slate-200 ${action.isCritical ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-3 py-2 text-slate-700 pl-6">
                      {idx + 1}. {action.title}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600">
                      {action.owner || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600">
                      {action.timeline ? (
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          action.timeline === '6m' ? 'bg-blue-100 text-blue-700' :
                          action.timeline === '12m' ? 'bg-blue-50 text-blue-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {action.timeline.replace('m', ' mo')}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {action.isCritical ? (
                        <span className="text-red-600 font-bold">●</span>
                      ) : (
                        <span className="text-slate-300">○</span>
                      )}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>



      {/* Print Styles for Action Plan Table */}
      <style>{`
        /* Ensure thead repeats on each printed page */
        @media print {
          .action-plan-table thead {
            display: table-header-group;
          }
          .action-plan-table tbody {
            display: table-row-group;
          }
          /* Keep objective headers with their first action */
          .action-plan-table .objective-header {
            break-after: avoid;
          }
          /* Avoid splitting rows */
          .action-plan-table tr {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
