// src/pages/AboutPage.jsx
// About page - Why we built this, who it's for, who's behind it

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo, LogoIcon, BRAND_COLORS } from '../components/Logo';
import PublicNav from '../components/PublicNav';
import Footer from '../components/Footer';
import {
  ArrowRight,
  Clock,
  Zap,
  Target,
} from 'lucide-react';
import PageSEO from '../components/PageSEO';

export default function AboutPage() {
  const { isAuthenticated, user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <PageSEO
        title="About — Built by Finance Practitioners"
        description="Built by finance practitioners who lived the gap between where FP&A teams are and where they need to be. CFO Lens compresses months of consulting into hours."
        path="/about"
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }]}
      />
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* NAVIGATION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <PublicNav ctaLabel="Get Started Free" />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HERO - THE TRAP */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <p
              className="text-sm font-medium tracking-wide uppercase mb-4"
              style={{ color: BRAND_COLORS.gold }}
            >
              Why We Built This
            </p>
            <h1
              className="text-4xl sm:text-5xl font-bold mb-8"
              style={{ color: BRAND_COLORS.navy }}
            >
              The trap every finance leader knows
            </h1>
            <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
              <p>
                You know something isn't working. You feel it in the variance explanations 
                that take three days, the forecasts nobody trusts, the rolling reforecasts 
                that never roll.
              </p>
              <p>
                Your team is stuck in reactive mode—closing the books, answering ad-hoc requests, 
                firefighting—with no time to step back and address the underlying issues.
              </p>
              <p className="font-medium text-slate-800">
                And that's the trap. You can't improve the function while you're running the function.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* THE GLOBAL PROBLEM */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2
                className="text-2xl font-bold mb-6"
                style={{ color: BRAND_COLORS.navy }}
              >
                This isn't unique to your company.
              </h2>
              <div className="space-y-4 text-slate-600">
                <p>
                  Finance leaders around the world face the same challenges—the same forecast gaps, 
                  the same reactive firefighting, the same lack of time for strategic improvement.
                </p>
                <p>
                  Until now, the path forward has been consultants: six-figure engagements and 
                  months of work just to produce a diagnosis and recommendations. Large enterprises 
                  can justify that investment. Most companies can't.
                </p>
                <p className="font-medium text-slate-800">
                  The problems are universal. The tools to address them have not been.
                </p>
              </div>
            </div>

            <div
              className="p-8 border-l-4"
              style={{ 
                borderColor: BRAND_COLORS.gold, 
                backgroundColor: `${BRAND_COLORS.navy}05` 
              }}
            >
              <LogoIcon size={32} className="mb-6" />
              <p className="text-xl font-semibold text-slate-800 mb-4">
                We're building the diagnostic platform for the entire finance function—globally.
              </p>
              <p className="text-slate-600">
                What large enterprises get from top-tier consulting firms, we're making 
                accessible to finance leaders everywhere—at a fraction of the cost, 
                in a fraction of the time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* THE RECOGNITION SECTION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-2xl font-bold mb-8"
              style={{ color: BRAND_COLORS.navy }}
            >
              You know this is for you if...
            </h2>
            <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
              <p>
                Your variance explanations take three days. Your rolling forecast doesn't roll. 
                You've outgrown spreadsheets but can't justify a six-figure consulting engagement 
                to figure out what's next.
              </p>
              <p>
                Or you're at a larger enterprise and need a fast, credible way to benchmark 
                your function before requesting transformation budget from leadership.
              </p>
              <p className="font-medium text-slate-800">
                Either way—you already sense there are gaps. You just need a structured way to see them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* THE TRADE-OFF */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: BRAND_COLORS.navy }}
            >
              Diagnosis and planning, not execution.
            </h2>
            <div className="space-y-4 text-slate-600">
              <p>
                The platform equips you with clarity on what to improve and in what order. 
                The transformation work—hiring, implementing systems, changing processes—is yours to lead.
              </p>
              <p>
                And when you need hands-on support, you'll be able to scope that engagement 
                far more effectively.
              </p>
            </div>
            <div
              className="mt-8 p-6 inline-block"
              style={{ backgroundColor: `${BRAND_COLORS.navy}05` }}
            >
              <p className="text-slate-700 font-medium">
                If you're looking for validation that everything is fine, this tool will disappoint you.
                <br />
                If you're ready to assess honestly and improve, it's built for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* WHAT YOU GET */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div
                className="w-12 h-12 mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${BRAND_COLORS.navy}10` }}
              >
                <Clock className="w-6 h-6" style={{ color: BRAND_COLORS.navy }} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Hours, not months</h3>
              <p className="text-sm text-slate-600">
                Complete a rigorous diagnostic in a single session. 
                Get your action plan the same day.
              </p>
            </div>

            <div className="text-center">
              <div
                className="w-12 h-12 mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${BRAND_COLORS.navy}10` }}
              >
                <Target className="w-6 h-6" style={{ color: BRAND_COLORS.navy }} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Yours to keep</h3>
              <p className="text-sm text-slate-600">
                The War Room stays live. Revisit the model as conditions change. 
                Reprioritize on the fly.
              </p>
            </div>

            <div className="text-center">
              <div
                className="w-12 h-12 mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${BRAND_COLORS.navy}10` }}
              >
                <Zap className="w-6 h-6" style={{ color: BRAND_COLORS.navy }} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Built by finance</h3>
              <p className="text-sm text-slate-600">
                Created by a finance leader with CFO experience across FMCG, 
                Consumer Electronics, SME, and Media.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* THE PITCH */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section
        className="py-20 px-6"
        style={{ backgroundColor: BRAND_COLORS.navy }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">
            Consultants give you cover.
            <br />
            <span style={{ color: BRAND_COLORS.gold }}>CFO Lens gives you clarity.</span>
          </h2>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
            You already sense there are gaps in your finance function. What you need is a 
            structured way to see them clearly, understand how you compare to companies like yours, 
            prioritize what matters most, and build a case for investment that leadership will fund.
          </p>
          <Link
            to={isAuthenticated ? '/select-pillar' : '/login'}
            className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: BRAND_COLORS.gold, color: BRAND_COLORS.navy }}
          >
            Start the FP&A Diagnostic
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <Footer variant="minimal" />
    </div>
  );
}
