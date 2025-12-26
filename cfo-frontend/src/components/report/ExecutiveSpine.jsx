// src/components/report/ExecutiveSpine.jsx
// Enterprise Layout v1: Fixed-width vertical anchor for Report Overview
// Contains: maturity level, one-line diagnosis, key constraint

export default function ExecutiveSpine({
  actualLevel = 1,
  levelName = 'Emerging',
  executionScore = 0,
  criticalCount = 0,
  cappedBy = [],
  className = ''
}) {
  // Derive one-line diagnosis based on score and criticals
  const getDiagnosis = () => {
    if (criticalCount > 0) {
      return 'Critical gaps blocking advancement';
    }
    if (executionScore >= 80) {
      return 'Strong foundation, ready to optimize';
    }
    if (executionScore >= 60) {
      return 'Solid progress with room to grow';
    }
    if (executionScore >= 40) {
      return 'Building capabilities, gaps remain';
    }
    return 'Early stage, focus on fundamentals';
  };

  // Derive key constraint
  const getConstraint = () => {
    if (cappedBy && cappedBy.length > 0) {
      return `Capped by: ${cappedBy[0]}`;
    }
    if (criticalCount > 0) {
      return `${criticalCount} critical gap${criticalCount > 1 ? 's' : ''} to resolve`;
    }
    return 'No blockers identified';
  };

  return (
    <div
      className={`w-[280px] flex-shrink-0 bg-slate-100 border-r border-slate-200 p-5 ${className}`.trim()}
    >
      {/* Maturity Level */}
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          Maturity Level
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-800">L{actualLevel}</span>
          <span className="text-sm font-medium text-slate-600">{levelName}</span>
        </div>
      </div>

      {/* One-Line Diagnosis */}
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          Diagnosis
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          {getDiagnosis()}
        </p>
      </div>

      {/* Key Constraint */}
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          Key Constraint
        </div>
        <p className={`text-sm leading-relaxed ${criticalCount > 0 ? 'text-red-700' : 'text-slate-700'}`}>
          {getConstraint()}
        </p>
      </div>

      {/* Execution Score */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          Execution Score
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${Math.min(100, executionScore)}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-slate-700">{executionScore}%</span>
        </div>
      </div>
    </div>
  );
}
