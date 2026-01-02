// IntroPage.jsx
// VS-43: Condensed assessment intro page
// Single-page layout with horizontal sections, marketing-focused messaging

import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Target, Bot, ClipboardList, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import ChapterHeader from './components/ChapterHeader';
import EnterpriseCanvas from './components/EnterpriseCanvas';
import FeedbackButton from './components/FeedbackButton';

// Journey steps
const JOURNEY_STEPS = [
  {
    step: 1,
    title: 'Assess',
    duration: '15 min',
    description: '60 Yes/No questions across 3 themes'
  },
  {
    step: 2,
    title: 'Calibrate',
    duration: '3 min',
    description: 'Set your own organizational priorities'
  },
  {
    step: 3,
    title: 'Review',
    duration: 'Instant',
    description: 'AI-generated personalized insights'
  },
  {
    step: 4,
    title: 'Plan',
    duration: 'Your pace',
    description: 'Select gaps, assign owners, set timelines'
  }
];

// Value propositions
const VALUE_PROPS = [
  {
    icon: Target,
    title: 'Simple Questions, Powerful Insights',
    description: 'Questions seem trivial — that\'s the point. They reveal what\'s blocking excellence more clearly than any consultant could.'
  },
  {
    icon: Bot,
    title: 'AI-Powered Analysis',
    description: 'Our AI considers your industry, size, and priorities. Get an executive summary that reads like a consultant who knows your business.'
  },
  {
    icon: ClipboardList,
    title: 'Action Plan, Not Just a Score',
    description: 'Most assessments end with a PDF. This one ends with a war room: assign owners, set timelines, track score projections.'
  }
];

// Themes
const THEMES = [
  {
    name: 'Foundation',
    objectives: ['Budget Discipline', 'Financial Controls', 'Performance Monitoring']
  },
  {
    name: 'Future',
    objectives: ['Forecasting Agility', 'Driver-Based Planning', 'Scenario Modeling']
  },
  {
    name: 'Intelligence',
    objectives: ['Strategic Influence', 'Decision Support', 'Operational Excellence']
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
        label="AI-POWERED FP&A DIAGNOSTIC"
        title="From Assessment to Action Plan"
        description="Personalized insights. Your priorities. Concrete next steps with timelines and owners."
        mode="assessment"
      />

      {/* Main Content */}
      <EnterpriseCanvas mode="assessment" className="py-6">

        {/* ROW 1: Journey Timeline */}
        <section className="mb-6">
          <div className="grid grid-cols-4 gap-3">
            {JOURNEY_STEPS.map((step, idx) => (
              <div
                key={step.step}
                className="relative bg-white border border-slate-200 rounded-sm p-4"
              >
                {/* Connector arrow (except last) */}
                {idx < JOURNEY_STEPS.length - 1 && (
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-300">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                    {step.step}
                  </div>
                  <span className="font-semibold text-slate-800">{step.title}</span>
                </div>
                <div className="text-xs text-blue-600 font-medium mb-1">{step.duration}</div>
                <div className="text-xs text-slate-500">{step.description}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ROW 2: Value Propositions */}
        <section className="mb-6">
          <div className="grid grid-cols-3 gap-3">
            {VALUE_PROPS.map((prop) => {
              const Icon = prop.icon;
              return (
                <div
                  key={prop.title}
                  className="bg-white border border-slate-200 rounded-sm p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-sm bg-slate-100 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-slate-600" />
                    </div>
                    <h3 className="font-semibold text-sm text-slate-800">{prop.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{prop.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ROW 3: What We Measure + Golden Rule (2-column) */}
        <section className="mb-6">
          <div className="grid grid-cols-2 gap-3">

            {/* Left: What We Measure */}
            <div className="bg-white border border-slate-200 rounded-sm p-4">
              <h3 className="font-semibold text-sm text-slate-800 mb-3">What We Measure</h3>

              {/* Theme cards */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {THEMES.map((theme) => (
                  <div key={theme.name} className="bg-slate-50 border border-slate-200 rounded-sm p-2">
                    <div className="text-xs font-semibold text-slate-700 mb-1">{theme.name}</div>
                    <div className="space-y-0.5">
                      {theme.objectives.map((obj) => (
                        <div key={obj} className="text-[10px] text-slate-500 truncate">{obj}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">9 Objectives</span> →
                <span className="font-medium text-slate-700"> 28 Practices</span> →
                <span className="font-medium text-slate-700"> 60 Questions</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Your calibration weights each objective. The insights are personalized to you.
              </div>
            </div>

            {/* Right: Golden Rule */}
            <div className="bg-white border border-slate-200 rounded-sm p-4">
              <h3 className="font-semibold text-sm text-slate-800 mb-3">How to Answer</h3>

              {/* Golden Rule Box */}
              <div className="bg-slate-800 text-white rounded-sm p-3 mb-3">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-300 mb-1">
                  The Golden Rule
                </div>
                <div className="text-sm font-medium">
                  "If you're not doing it 100% of the time, the answer is No."
                </div>
              </div>

              {/* Principles */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-slate-500">
                    Not "mostly" or "working on it" — we measure what <strong className="text-slate-700">IS</strong>, not what should be
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-slate-500">
                    Could you show an auditor proof? No proof = No
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-slate-500">
                    Every "No" is an opportunity — honest answers lead to useful insights
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROW 4: CTA */}
        <section className="pt-2 border-t border-slate-200 mt-2">
          <div className="flex items-center justify-between">
            <Link to="/select-pillar">
              <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-sm hover:bg-slate-50 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </Link>
            <Link to={`/run/${runId}/setup/company`}>
              <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors rounded-sm">
                Continue Setup
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </section>

      </EnterpriseCanvas>

      {/* Feedback Button */}
      <FeedbackButton runId={runId} currentPage="intro" />
    </div>
  );
}
