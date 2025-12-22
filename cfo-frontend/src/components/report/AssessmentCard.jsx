// src/components/report/AssessmentCard.jsx
// Executive summary assessment stats

export default function AssessmentCard({
  questionsTotal,
  questionsAnswered,
  criticalCount,
  failedCriticals = []
}) {
  // failedCriticals can be an array (of question texts) or a number
  const failedCount = Array.isArray(failedCriticals) ? failedCriticals.length : failedCriticals;

  return (
    <div className="bg-white border border-slate-300 rounded-sm p-4">
      {/* Header */}
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
        ASSESSMENT
      </div>

      {/* Stats grid */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate">Questions</span>
          <span className="font-semibold text-navy">{questionsTotal}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate">Answered</span>
          <span className="font-semibold text-navy">{questionsAnswered}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate">Critical</span>
          <span className="font-semibold text-navy">{criticalCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate">Failed Critical</span>
          <span className={`font-semibold ${failedCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {failedCount}
          </span>
        </div>
      </div>
    </div>
  );
}
