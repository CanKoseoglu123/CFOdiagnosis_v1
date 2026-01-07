import React, { useMemo } from 'react';

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

const CHART_HEIGHT = 160;

function ObjectiveBar({ label, achieved, target }) {
  const achievedHeight = Math.max(0, (achieved / 4) * CHART_HEIGHT);
  const targetOffset = target ? Math.max(0, (target / 4) * CHART_HEIGHT) : null;
  const gap = target ? Math.max(0, target - achieved) : null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-14 h-[160px] border border-slate-200 bg-slate-50">
        <div
          className="absolute bottom-0 left-0 right-0 bg-blue-600"
          style={{ height: `${achievedHeight}px` }}
        />
        {targetOffset !== null && (
          <div
            className="absolute left-0 right-0 border-t-2 border-amber-500"
            style={{ bottom: `${targetOffset}px` }}
          />
        )}
      </div>
      <div className="text-[10px] text-slate-600 text-center leading-tight">
        {label}
      </div>
      <div className="text-[11px] text-slate-500">
        L{achieved}{target ? ` → L${target}` : ''}
      </div>
      {gap !== null && gap > 0 && (
        <div className="text-[10px] text-amber-700">Gap {gap.toFixed(1)}</div>
      )}
    </div>
  );
}

function CommentaryCard({ commentary, objectives }) {
  if (!commentary) return null;

  const notes = commentary.objectives || [];
  const notesById = new Map(notes.map((n) => [n.objective_id, n.commentary]));

  return (
    <div className="border border-slate-300 bg-white rounded-sm p-4 space-y-3">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        Benchmark Commentary
      </div>
      <div className="text-sm text-slate-700">{commentary.summary}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {objectives.map((objective) => {
          const note = notesById.get(objective.id);
          if (!note) return null;
          return (
            <div key={objective.id} className="border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-600 mb-1">
                {objective.name}
              </div>
              <div className="text-xs text-slate-600">{note}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BenchmarkTab({ report, spec, benchmarkData }) {
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
    return new Map(targets.map((t) => [t.practice_id, t.target]));
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

  return (
    <div className="space-y-4">
      <div className="border border-slate-300 bg-white rounded-sm p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Enterprise DNA Benchmark
            </div>
            <div className="text-lg font-semibold text-slate-800 mt-1">
              Persona: {persona}
            </div>
            {modifiers.length > 0 && (
              <div className="text-xs text-slate-500 mt-1">
                Modifiers applied: {modifiers.join(', ')}
              </div>
            )}
          </div>
          <div className="text-xs text-slate-500">
            Targets compared to achieved levels
          </div>
        </div>
      </div>

      <div className="border border-slate-300 bg-white rounded-sm p-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Maturity vs Targets
        </div>
        <div className="flex flex-wrap gap-4 justify-between">
          {orderedObjectives.map((objective) => {
            const achieved = achievedObjectives[objective.id] ?? 0;
            const target = objectiveTargets.get(objective.id);
            return (
              <ObjectiveBar
                key={objective.id}
                label={objective.name}
                achieved={achieved}
                target={target}
              />
            );
          })}
        </div>
        <div className="text-[10px] text-slate-500 mt-3">
          Blue bar = achieved level. Amber line = target level.
        </div>
      </div>

      <CommentaryCard commentary={benchmarkData?.commentary} objectives={orderedObjectives} />

      <div className="border border-slate-300 bg-white rounded-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Practice-Level Comparison
          </div>
          <div className="text-sm text-slate-500 mt-1">
            Achieved level by practice against persona target.
          </div>
        </div>
        <div className="divide-y divide-slate-200">
          {orderedObjectives.map((objective) => {
            const objectivePractices = practicesByObjective[objective.id] || [];
            return (
              <div key={objective.id} className="p-4">
                <div className="text-sm font-semibold text-slate-700 mb-2">
                  {objective.name}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {objectivePractices.map((practice) => {
                    const achieved = achievedPractices[practice.id] ?? 0;
                    const target = practiceTargets.get(practice.id);
                    const gap = target ? Math.max(0, target - achieved) : 0;
                    return (
                      <div
                        key={practice.id}
                        className="border border-slate-200 bg-slate-50 p-3 flex items-center justify-between"
                      >
                        <div className="text-xs text-slate-600 pr-3">
                          {practice.title}
                        </div>
                        <div className="text-xs text-slate-600 text-right">
                          <div>L{achieved}{target ? ` → L${target}` : ''}</div>
                          {gap > 0 && (
                            <div className="text-[10px] text-amber-700">Gap {gap.toFixed(1)}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
