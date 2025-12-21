import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Target, AlertTriangle, Zap } from 'lucide-react';

const maturityLevels = [
  {
    level: 1,
    name: 'Emerging',
    description: 'Finance exists but operates in survival mode. Basic budget and reporting structures are in place.',
    bg: '#FEF3C7',
    text: '#92400E',
    accent: '#F59E0B'
  },
  {
    level: 2,
    name: 'Defined',
    description: 'Feedback loops exist. Finance tracks performance, investigates variances, and forecasts forward.',
    bg: '#FEF9C3',
    text: '#854D0E',
    accent: '#EAB308'
  },
  {
    level: 3,
    name: 'Managed',
    description: 'Finance has influence. Leadership listens, accepts constraints, and treats Finance as a strategic partner.',
    bg: '#DCFCE7',
    text: '#166534',
    accent: '#22C55E'
  },
  {
    level: 4,
    name: 'Optimized',
    description: 'Single source of truth. Cross-functional alignment, self-serve insights, and strategy-driven planning.',
    bg: '#DBEAFE',
    text: '#1E40AF',
    accent: '#3B82F6'
  }
];

export default function IntroPage() {
  const { runId } = useParams();

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'system-ui' }}>
      {/* Header */}
      <header style={{ background: '#0F172A', color: '#FFF', padding: '24px 0' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', color: '#94A3B8', marginBottom: 6 }}>FINANCE DIAGNOSTIC</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>FP&A Maturity Assessment</h1>
          <p style={{ color: '#94A3B8', fontSize: 14, marginTop: 8, margin: '8px 0 0 0' }}>
            Observable evidence. Deterministic scoring. Actionable gaps.
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}>
        {/* What We're Measuring */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
            What We're Measuring
          </h2>
          <div style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
            <p style={{ color: '#374151', lineHeight: 1.6, margin: 0 }}>
              This diagnostic evaluates how reliably your finance function executes real
              workflows — based on observable evidence, not aspirations.
            </p>
            <p style={{ color: '#374151', lineHeight: 1.6, marginTop: 12, marginBottom: 0 }}>
              You'll answer <strong>48 Yes/No questions</strong>. Be honest. There's no
              penalty for "No" — only insight.
            </p>
          </div>
        </section>

        {/* Maturity Levels */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
            The Four Maturity Levels
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {maturityLevels.map((level) => (
              <div
                key={level.level}
                style={{
                  background: '#FFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: level.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: level.text }}>{level.level}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#111827', marginBottom: 4 }}>
                    Level {level.level}: {level.name}
                  </div>
                  <p style={{ color: '#6B7280', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                    {level.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Methodology */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
            Why We Ask This Way
          </h2>
          <div style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
            <p style={{ color: '#374151', lineHeight: 1.6, margin: 0 }}>
              Every question is binary: <strong>Yes</strong> or <strong>No</strong>.
            </p>
            <p style={{ color: '#374151', lineHeight: 1.6, marginTop: 12, marginBottom: 0 }}>
              We don't ask "Do you have a budget process?" — that's too easy to say yes to.
              We ask "Does the company produce an approved annual budget <em>before the
              fiscal year begins</em>?" — specific, observable, auditable.
            </p>
            <div style={{
              marginTop: 16,
              padding: '12px 16px',
              background: '#F3F4F6',
              borderRadius: 8,
              borderLeft: '4px solid #4F46E5'
            }}>
              <p style={{ color: '#111827', fontWeight: 500, margin: 0, fontSize: 14 }}>
                The principle: If you can't point to evidence, the answer is No.
              </p>
            </div>
          </div>
        </section>

        {/* What You'll Get */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
            What You'll Get
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={20} color="#4F46E5" />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Execution Score</div>
                <div style={{ color: '#6B7280', fontSize: 12 }}>How complete is your FP&A?</div>
              </div>
            </div>
            <div style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={20} color="#16A34A" />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Maturity Level</div>
                <div style={{ color: '#6B7280', fontSize: 12 }}>Which stage are you at?</div>
              </div>
            </div>
            <div style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} color="#DC2626" />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Critical Risks</div>
                <div style={{ color: '#6B7280', fontSize: 12 }}>What gaps could hurt you?</div>
              </div>
            </div>
            <div style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={20} color="#D97706" />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Prioritized Actions</div>
                <div style={{ color: '#6B7280', fontSize: 12 }}>What to fix first</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <Link to={`/assess?runId=${runId}`}>
            <button style={{
              backgroundColor: '#4F46E5',
              color: 'white',
              padding: '16px 40px',
              fontSize: 16,
              fontWeight: 600,
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}>
              Begin Assessment →
            </button>
          </Link>
          <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 16 }}>
            Takes approximately 10-15 minutes
          </p>
        </div>
      </main>
    </div>
  );
}
