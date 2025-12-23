// src/components/report/PathToMaturity.jsx
// Shows maturity ladder with level requirements and blockers

import React from 'react';
import { CheckCircle, XCircle, Lock, Unlock, ChevronRight, Target } from 'lucide-react';

const LEVEL_INFO = {
  1: {
    name: 'Emerging',
    description: 'Basic financial controls and annual budgeting in place',
    color: 'blue',
    requirements: [
      'Annual budget exists before fiscal year',
      'Full P&L budget coverage',
      'Chart of accounts standardized',
      'Approval controls documented'
    ]
  },
  2: {
    name: 'Defined',
    description: 'Variance analysis and collaborative forecasting established',
    color: 'emerald',
    requirements: [
      'Monthly BvA reporting',
      'Variance investigation process',
      'Collaborative planning system',
      'Cash flow forecasting'
    ]
  },
  3: {
    name: 'Managed',
    description: 'Driver-based planning and scenario modeling capabilities',
    color: 'purple',
    requirements: [
      'Driver-based models',
      'Scenario planning',
      'Rolling forecasts',
      'Cross-functional alignment'
    ]
  },
  4: {
    name: 'Optimized',
    description: 'Integrated planning with predictive analytics',
    color: 'amber',
    requirements: [
      'Integrated business planning',
      'Predictive analytics',
      'Real-time insights',
      'Strategic decision support'
    ]
  }
};

function LevelCard({ level, actualLevel, potentialLevel, blockers, criticalRisks }) {
  const info = LEVEL_INFO[level];
  const isAchieved = actualLevel >= level;
  const isPotential = potentialLevel >= level && actualLevel < level;
  const isBlocked = isPotential && blockers.length > 0;
  const isNext = level === actualLevel + 1;

  // Find blockers for this level
  const levelBlockers = criticalRisks.filter(r => r.level === level);

  const colorClasses = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100' }
  };

  const colors = colorClasses[info.color];

  return (
    <div className={`border rounded-lg overflow-hidden ${isAchieved ? colors.border : 'border-slate-200'}`}>
      {/* Level Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${isAchieved ? colors.bg : 'bg-slate-50'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
            isAchieved ? `${colors.badge} ${colors.text}` : 'bg-slate-200 text-slate-500'
          }`}>
            L{level}
          </div>
          <div>
            <h3 className={`font-bold ${isAchieved ? colors.text : 'text-slate-700'}`}>
              {info.name}
            </h3>
            <p className="text-xs text-slate-500">{info.description}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {isAchieved && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
              <CheckCircle className="w-3 h-3" />
              Achieved
            </span>
          )}
          {isBlocked && (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">
              <Lock className="w-3 h-3" />
              Blocked
            </span>
          )}
          {isNext && !isBlocked && (
            <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
              <Target className="w-3 h-3" />
              Next Target
            </span>
          )}
        </div>
      </div>

      {/* Requirements */}
      <div className="px-4 py-3 bg-white">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Requirements</div>
        <div className="grid grid-cols-2 gap-2">
          {info.requirements.map((req, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              {isAchieved ? (
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5" />
              )}
              <span className={isAchieved ? 'text-slate-600' : 'text-slate-500'}>{req}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Blockers (if any for this level) */}
      {levelBlockers.length > 0 && !isAchieved && (
        <div className="px-4 py-3 bg-red-50 border-t border-red-100">
          <div className="text-xs font-semibold text-red-600 uppercase mb-2">
            Blocking Issues ({levelBlockers.length})
          </div>
          <div className="space-y-1">
            {levelBlockers.map((blocker, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-red-700">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                <span>{blocker.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PathToMaturity({
  actualLevel,
  potentialLevel,
  executionScore,
  cappedBy,
  criticalRisks
}) {
  const isCapped = actualLevel < potentialLevel;

  return (
    <div className="space-y-4">
      {/* Current Status Card */}
      <div className="bg-white rounded-lg border border-slate-300 p-4">
        <h2 className="text-base font-bold text-slate-700 uppercase mb-4">Your Maturity Journey</h2>

        <div className="flex items-center gap-4 mb-4">
          {/* Current Level */}
          <div className="flex-1 text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-3xl font-bold text-blue-700">L{actualLevel}</div>
            <div className="text-sm text-slate-600">{LEVEL_INFO[actualLevel]?.name}</div>
            <div className="text-xs text-slate-500 mt-1">Current Level</div>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-8 h-8 text-slate-300" />

          {/* Next Level */}
          {actualLevel < 4 ? (
            <div className={`flex-1 text-center p-4 rounded-lg border ${
              isCapped ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`text-3xl font-bold ${isCapped ? 'text-amber-700' : 'text-slate-400'}`}>
                L{actualLevel + 1}
              </div>
              <div className="text-sm text-slate-600">{LEVEL_INFO[actualLevel + 1]?.name}</div>
              <div className="text-xs text-slate-500 mt-1">
                {isCapped ? `Blocked by ${cappedBy.length} issue${cappedBy.length > 1 ? 's' : ''}` : 'Next Target'}
              </div>
            </div>
          ) : (
            <div className="flex-1 text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="text-3xl font-bold text-emerald-700">MAX</div>
              <div className="text-sm text-slate-600">Optimized</div>
              <div className="text-xs text-emerald-600 mt-1">Highest Level Achieved!</div>
            </div>
          )}

          {/* Potential (if capped) */}
          {isCapped && potentialLevel > actualLevel + 1 && (
            <>
              <ChevronRight className="w-8 h-8 text-slate-300" />
              <div className="flex-1 text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-3xl font-bold text-purple-700">L{potentialLevel}</div>
                <div className="text-sm text-slate-600">{LEVEL_INFO[potentialLevel]?.name}</div>
                <div className="text-xs text-purple-600 mt-1">Your Potential</div>
              </div>
            </>
          )}
        </div>

        {/* Execution Score Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600">Execution Score</span>
            <span className="font-semibold text-slate-800">{executionScore}%</span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                executionScore >= 95 ? 'bg-purple-500' :
                executionScore >= 80 ? 'bg-emerald-500' :
                executionScore >= 50 ? 'bg-blue-500' : 'bg-amber-500'
              }`}
              style={{ width: `${executionScore}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>0%</span>
            <span>L2: 50%</span>
            <span>L3: 80%</span>
            <span>L4: 95%</span>
          </div>
        </div>
      </div>

      {/* Level Cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map(level => (
          <LevelCard
            key={level}
            level={level}
            actualLevel={actualLevel}
            potentialLevel={potentialLevel}
            blockers={cappedBy}
            criticalRisks={criticalRisks}
          />
        ))}
      </div>
    </div>
  );
}
