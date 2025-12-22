// src/components/report/ExecutiveSummary.jsx
// 3-column grid executive summary section

import ScoreCard from './ScoreCard';
import MaturityCard from './MaturityCard';
import AssessmentCard from './AssessmentCard';
import { CappedWarning, OnTrackBanner } from './CappedWarning';

export default function ExecutiveSummary({
  score,
  actualLevel,
  potentialLevel,
  capped,
  cappedBy,
  questionsTotal,
  questionsAnswered,
  criticalCount,
  failedCriticals
}) {
  return (
    <section className="mb-6" data-print-card>
      {/* Section header */}
      <div className="mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          EXECUTIVE SUMMARY
        </h2>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoreCard score={score} />
        <MaturityCard
          actualLevel={actualLevel}
          potentialLevel={potentialLevel}
          capped={capped}
        />
        <AssessmentCard
          questionsTotal={questionsTotal}
          questionsAnswered={questionsAnswered}
          criticalCount={criticalCount}
          failedCriticals={failedCriticals}
        />
      </div>

      {/* Cap warning or on-track banner */}
      {capped ? (
        <CappedWarning
          score={score}
          actualLevel={actualLevel}
          potentialLevel={potentialLevel}
          cappedBy={cappedBy}
        />
      ) : (
        <OnTrackBanner actualLevel={actualLevel} />
      )}
    </section>
  );
}
