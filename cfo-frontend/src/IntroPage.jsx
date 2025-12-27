// IntroPage.jsx
// Chapter 0: Assessment introduction page
// Follows consulting-document paradigm - no sidebar, no color pills

import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ChapterHeader from './components/ChapterHeader';
import EnterpriseCanvas from './components/EnterpriseCanvas';

const maturityLevels = [
  {
    level: 1,
    name: 'Emerging',
    description: 'Finance exists but operates in survival mode. Basic budget and reporting structures are in place.'
  },
  {
    level: 2,
    name: 'Defined',
    description: 'Feedback loops exist. Finance tracks performance, investigates variances, and forecasts forward.'
  },
  {
    level: 3,
    name: 'Managed',
    description: 'Finance has influence. Leadership listens, accepts constraints, and treats Finance as a strategic partner.'
  },
  {
    level: 4,
    name: 'Optimized',
    description: 'Single source of truth. Cross-functional alignment, self-serve insights, and strategy-driven planning.'
  }
];

export default function IntroPage() {
  const { runId } = useParams();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Chapter Header */}
      <ChapterHeader
        label="FINANCE DIAGNOSTIC"
        title="FP&A Maturity Assessment"
        description="Observable evidence. Deterministic scoring. Actionable gaps."
        mode="assessment"
      />

      {/* Main Content */}
      <EnterpriseCanvas mode="assessment" className="py-8">
        {/* What We're Measuring */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-slate-800 mb-3">
            What We're Measuring
          </h2>
          <div className="bg-white border border-slate-200 rounded-sm p-5">
            <p className="text-sm text-slate-600 leading-relaxed">
              This diagnostic evaluates how reliably your finance function executes real
              workflows — based on observable evidence, not aspirations.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mt-3">
              You'll answer <strong className="text-slate-800">48 Yes/No questions</strong>. Be honest. There's no
              penalty for "No" — only insight.
            </p>
          </div>
        </section>

        {/* Maturity Levels */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-slate-800 mb-3">
            The Four Maturity Levels
          </h2>
          <div className="space-y-3">
            {maturityLevels.map((level) => (
              <div
                key={level.level}
                className="bg-white border border-slate-200 rounded-sm p-4 flex items-start gap-4"
              >
                <div className="w-8 h-8 rounded-sm bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-slate-600">{level.level}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 mb-1">
                    Level {level.level}: {level.name}
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {level.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Methodology */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-slate-800 mb-3">
            Why We Ask This Way
          </h2>
          <div className="bg-white border border-slate-200 rounded-sm p-5">
            <p className="text-sm text-slate-600 leading-relaxed">
              Every question is binary: <strong className="text-slate-800">Yes</strong> or <strong className="text-slate-800">No</strong>.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mt-3">
              We don't ask "Do you have a budget process?" — that's too easy to say yes to.
              We ask "Does the company produce an approved annual budget <em>before the
              fiscal year begins</em>?" — specific, observable, auditable.
            </p>
            <div className="mt-4 p-3 bg-slate-50 border-l-2 border-slate-400">
              <p className="text-sm font-medium text-slate-700">
                The principle: If you can't point to evidence, the answer is No.
              </p>
            </div>
          </div>
        </section>

        {/* What You'll Get */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-slate-800 mb-3">
            What You'll Get
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 rounded-sm p-4">
              <div className="text-sm font-semibold text-slate-800">Execution Score</div>
              <div className="text-xs text-slate-500 mt-1">How complete is your FP&A?</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm p-4">
              <div className="text-sm font-semibold text-slate-800">Maturity Level</div>
              <div className="text-xs text-slate-500 mt-1">Which stage are you at?</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm p-4">
              <div className="text-sm font-semibold text-slate-800">Critical Risks</div>
              <div className="text-xs text-slate-500 mt-1">What gaps could hurt you?</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm p-4">
              <div className="text-sm font-semibold text-slate-800">Prioritized Actions</div>
              <div className="text-xs text-slate-500 mt-1">What to fix first</div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center pt-4">
          <Link to={`/assess/foundation?runId=${runId}`}>
            <button className="bg-primary text-white px-8 py-3 text-sm font-semibold hover:bg-primary-hover transition-colors">
              Begin Assessment
            </button>
          </Link>
          <p className="text-xs text-slate-400 mt-4">
            Takes approximately 10-15 minutes
          </p>
        </div>
      </EnterpriseCanvas>
    </div>
  );
}
