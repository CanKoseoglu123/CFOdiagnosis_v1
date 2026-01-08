import React, { useMemo } from 'react';
import personasData from '../../../../src/data/personas.json';

const OBJECTIVE_ORDER = [
  'obj_budget_discipline',
  'obj_financial_controls',
  'obj_performance_monitoring',
  'obj_forecasting_agility',
  'obj_driver_based_planning',
  'obj_scenario_modeling',
  'obj_strategic_influence',
  'obj_decision_support',
  'obj_operational_excellence'
];

const CHART_HEIGHT = 200;

const LEVEL_TICKS = [0, 1, 2, 3, 4];

function splitLabel(label = '') {
  const words = String(label).split(' ').filter(Boolean);
  if (words.length <= 1) return [label, ''];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

function formatLevel(value, fallback = '-') {
  if (value === null || value === undefined) return fallback;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return fallback;
  return `L${numeric % 1 === 0 ? numeric : numeric.toFixed(1)}`;
}

function ObjectiveBar({ label, achieved, target, projected, isTotal, importance, showProjected }) {
  const achievedHeight = Math.max(0, (achieved / 4) * CHART_HEIGHT);
  const targetOffset = target === null || target === undefined
    ? null
    : Math.max(0, (Number(target) / 4) * CHART_HEIGHT);
  const projectedHeight = projected === null || projected === undefined
    ? null
    : Math.max(0, (Number(projected) / 4) * CHART_HEIGHT);
  const extensionHeight = projectedHeight !== null
    ? Math.max(0, projectedHeight - achievedHeight)
    : 0;
  const [line1, line2] = splitLabel(label);
  const barColor = isTotal ? 'bg-[#103b6d]' : 'bg-[#0b2d5b]';
  const labelColor = isTotal ? 'text-slate-800 font-semibold' : 'text-slate-700';
  const markerClass = importance === 5
    ? 'bg-red-500'
    : importance === 4
      ? 'bg-amber-500'
      : null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-16 h-[200px] flex items-end justify-center">
        <div
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-6 ${barColor}`}
          style={{ height: `${achievedHeight}px` }}
        />
        {showProjected && extensionHeight > 0 && (
          <div
            className="absolute left-1/2 -translate-x-1/2 w-6"
            style={{
              bottom: `${achievedHeight}px`,
              height: `${extensionHeight}px`,
              backgroundColor: 'rgba(11, 45, 91, 0.18)',
              backgroundImage: 'repeating-linear-gradient(135deg, rgba(11, 45, 91, 0.6) 0 1px, rgba(11, 45, 91, 0.12) 1px 3px)'
            }}
          />
        )}
        {targetOffset !== null && (
          <div
            className="absolute left-1/2 -translate-x-1/2 w-7 h-2 bg-orange-500"
            style={{ bottom: `${targetOffset - 2}px` }}
          />
        )}
        {markerClass && (
          <div
            className={`absolute left-1/2 -translate-x-1/2 bottom-2 w-2.5 h-2.5 rounded-full ${markerClass}`}
          />
        )}
      </div>
      <div className={`text-sm text-center leading-snug max-w-[120px] min-h-[36px] ${labelColor}`}>
        <span className="block">{line1}</span>
        <span className="block">{line2}</span>
      </div>
    </div>
  );
}

export default function BenchmarkTab({
  report,
  spec,
  benchmarkData,
  includeCommittedActions = false,
  projectedTargets = {},
  projectedTotal = null,
  showPracticeDetails = true
}) {
  const objectives = spec?.objectives || [];
  const practices = spec?.practices || [];

  const objectiveMap = useMemo(() => {
    const map = new Map();
    objectives.forEach((obj) => {
      map.set(obj.id, obj);
    });
    return map;
  }, [objectives]);

  const objectiveTargets = useMemo(() => {
    const targets = benchmarkData?.targets?.objectiveTargets || [];
    return new Map(targets.map((t) => [t.objective_id, t.adjustedTarget]));
  }, [benchmarkData]);

  const practiceTargets = useMemo(() => {
    const targets = benchmarkData?.targets?.practiceTargets || [];
    return new Map(targets.map((t) => [t.practice_id, t]));
  }, [benchmarkData]);

  const achievedObjectives = benchmarkData?.achieved?.objectiveLevels || {};
  const achievedPractices = benchmarkData?.achieved?.practiceLevels || {};

  const orderedObjectives = OBJECTIVE_ORDER
    .map((id) => objectiveMap.get(id))
    .filter(Boolean);

  const practicesByObjective = useMemo(() => {
    const groups = {};
    practices.forEach((practice) => {
      if (!groups[practice.objective_id]) {
        groups[practice.objective_id] = [];
      }
      groups[practice.objective_id].push(practice);
    });
    return groups;
  }, [practices]);

  const persona = benchmarkData?.persona || report?.targets?.persona || 'Unknown';
  const modifiers = benchmarkData?.targets?.modifiersApplied || [];
  const personaDetails = personasData?.personas?.[persona] || null;
  const commentary = benchmarkData?.commentary || null;
  const importanceMap = report?.calibration?.importance_map || {};
  const targetValues = Array.from(objectiveTargets.values())
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));
  const achievedValues = orderedObjectives
    .map((objective) => Number(achievedObjectives[objective.id]))
    .filter((value) => !Number.isNaN(value));
  const totalAchieved = report?.maturity_v2?.actual_level
    ?? report?.maturity?.achieved_level
    ?? (achievedValues.length > 0 ? Math.min(...achievedValues) : 0);
  const totalTarget = targetValues.length > 0 ? Math.min(...targetValues) : null;
  const chartObjectives = [
    { id: 'total_company', name: 'Total Company' },
    ...orderedObjectives
  ];
  const commentaryByObjective = useMemo(() => {
    const notes = commentary?.objectives || [];
    return new Map(notes.map((note) => [note.objective_id, note.commentary]));
  }, [commentary]);

  return (
    <div className="space-y-4">
      <div className="border border-slate-300 bg-white rounded-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
              Maturity Benchmark
            </h2>
            <div className="text-sm text-slate-500 mt-1">
              Maturity bars with target markers for each objective.
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-[#0b2d5b]" />
              <span>Maturity</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-2 bg-orange-500" />
              <span>Target</span>
            </div>
            {includeCommittedActions && (
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-2 border border-slate-200"
                  style={{
                    backgroundColor: 'rgba(11, 45, 91, 0.18)',
                    backgroundImage: 'repeating-linear-gradient(135deg, rgba(11, 45, 91, 0.6) 0 1px, rgba(11, 45, 91, 0.12) 1px 3px)'
                  }}
                />
                <span>With committed actions</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>High priority</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Critical priority</span>
            </div>
          </div>
        </div>
        <div className="px-4 pb-4 pt-8">
        <div className="grid grid-cols-[60px_1fr] gap-5">
          <div className="relative h-[200px] text-sm text-slate-400">
            {LEVEL_TICKS.map((tick) => {
              const offset = (tick / 4) * CHART_HEIGHT;
              return (
                <div
                  key={tick}
                  className="absolute left-0 right-0 flex items-center gap-2 translate-y-1/2 benchmark-axis-tick"
                  style={{ bottom: `${offset}px` }}
                >
                  <span className="w-8 text-right">{tick === 0 ? '' : `L${tick}`}</span>
                  <div className="h-px w-3 bg-slate-300" />
                </div>
              );
            })}
          </div>
          <div
            className="relative h-[200px] benchmark-chart"
          >
            {LEVEL_TICKS.map((tick) => {
              const offset = (tick / 4) * CHART_HEIGHT;
              return (
                <div
                  key={tick}
                  className="absolute left-0 right-0 border-t border-slate-200/80"
                  style={{ bottom: `${offset}px` }}
                />
              );
            })}
            <div className="flex items-end gap-8 px-2">
              {chartObjectives.map((objective) => {
                const isTotal = objective.id === 'total_company';
                const achieved = isTotal
                  ? totalAchieved
                  : achievedObjectives[objective.id] ?? 0;
                const target = isTotal
                  ? totalTarget
                  : objectiveTargets.get(objective.id);
                const projected = isTotal
                  ? projectedTotal
                  : projectedTargets[objective.id];
                const importance = isTotal ? null : importanceMap[objective.id];
                return (
                  <ObjectiveBar
                    key={objective.id}
                    label={objective.name}
                    achieved={achieved}
                    target={target}
                    projected={projected}
                    isTotal={isTotal}
                    importance={importance}
                    showProjected={includeCommittedActions}
                  />
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-slate-200 pt-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Benchmark Target Methodology
          </div>
          <div className="text-sm text-slate-600 mt-2 leading-relaxed">
            Targets reflect persona-specific maturity expectations, calibrated by company context
            modifiers. Practice targets inherit objective targets and are capped by practice maximums
            to keep recommendations realistic.
          </div>
        </div>
        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Persona
          </div>
          <div className="text-sm text-slate-600 mt-2 leading-relaxed">
            <span className="font-semibold text-slate-800">
              {personaDetails?.name || persona}
            </span>
            {personaDetails?.tagline && (
              <>
                {' '}
                <span className="text-slate-600">{personaDetails.tagline}</span>
              </>
            )}
            {personaDetails?.description && (
              <>
                {' '}
                {personaDetails.description}
              </>
            )}
          </div>
          {modifiers.length > 0 && (
            <div className="text-xs text-slate-500 mt-2">
              Modifiers applied: {modifiers.join(', ')}
            </div>
          )}
        </div>
      </div>
      </div>

      {showPracticeDetails && (
        <div className="border border-slate-300 bg-white rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
              Practice level details
            </h2>
            <div className="text-sm text-slate-500 mt-1">Practices grouped by objective.</div>
          </div>
          <div className="divide-y divide-slate-200">
            {orderedObjectives.map((objective) => {
              const objectivePractices = practicesByObjective[objective.id] || [];
              const objectiveAchieved = achievedObjectives[objective.id] ?? 0;
              const objectiveTarget = objectiveTargets.get(objective.id);
              const objectiveGap = objectiveTarget !== undefined
                ? Math.max(0, Number(objectiveTarget) - Number(objectiveAchieved))
                : null;
              const objectiveCommentary = commentaryByObjective.get(objective.id);
              return (
                <div key={objective.id} className="p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="border border-slate-200">
                      <div className="grid grid-cols-[1fr_repeat(4,_80px)] gap-2 px-3 py-2 text-sm font-semibold text-slate-600 bg-slate-50">
                        <div className="leading-tight">
                          <span className="block">&nbsp;</span>
                          <span className="block">Objective / Practice</span>
                        </div>
                        <div className="text-center leading-tight">
                          <span className="block">Current</span>
                          <span className="block">Level</span>
                        </div>
                        <div className="text-center leading-tight">
                          <span className="block">Max</span>
                          <span className="block">Level</span>
                        </div>
                        <div className="text-center leading-tight">
                          <span className="block">Target</span>
                          <span className="block">Level</span>
                        </div>
                        <div className="text-center leading-tight">
                          <span className="block">&nbsp;</span>
                          <span className="block">Gap</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-[1fr_repeat(4,_80px)] gap-2 px-3 py-2 text-sm font-bold text-slate-700 uppercase tracking-wide border-t border-slate-200 bg-slate-100">
                        <div>{objective.name}</div>
                        <div className="text-center">{formatLevel(objectiveAchieved)}</div>
                        <div className="text-center">{formatLevel(4)}</div>
                        <div className="text-center">{formatLevel(objectiveTarget)}</div>
                        <div className="text-center text-amber-700">
                          {objectiveGap !== null ? objectiveGap.toFixed(1) : '-'}
                        </div>
                      </div>
                      <div className="divide-y divide-slate-200">
                        {objectivePractices.map((practice) => {
                          const achieved = achievedPractices[practice.id] ?? 0;
                          const practiceTarget = practiceTargets.get(practice.id);
                          const maxLevel = practiceTarget?.practiceMax ?? 4;
                          const target = practiceTarget?.target;
                          return (
                            <div
                              key={practice.id}
                              className="grid grid-cols-[1fr_repeat(4,_80px)] gap-2 px-3 py-2 text-sm text-slate-600 bg-white"
                            >
                              <div className="pr-3">{practice.title}</div>
                              <div className="text-center">{formatLevel(achieved)}</div>
                              <div className="text-center">{formatLevel(maxLevel)}</div>
                              <div className="text-center">{formatLevel(target)}</div>
                              <div className="text-center text-slate-300">-</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Commentary
                      </div>
                      <div className="text-sm text-slate-700 leading-relaxed">
                        {objectiveCommentary || 'No commentary available for this objective.'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
