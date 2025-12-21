import { useParams, Link } from 'react-router-dom';

const maturityLevels = [
  {
    level: 1,
    name: 'Emerging',
    description: 'Finance exists but operates in survival mode. Basic budget and reporting structures are in place.',
    color: 'gray'
  },
  {
    level: 2,
    name: 'Defined',
    description: 'Feedback loops exist. Finance tracks performance, investigates variances, and forecasts forward.',
    color: 'blue'
  },
  {
    level: 3,
    name: 'Managed',
    description: 'Finance has influence. Leadership listens, accepts constraints, and treats Finance as a strategic partner.',
    color: 'teal'
  },
  {
    level: 4,
    name: 'Optimized',
    description: 'Single source of truth. Cross-functional alignment, self-serve insights, and strategy-driven planning.',
    color: 'green'
  }
];

export default function IntroPage() {
  const { runId } = useParams();

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '600', marginBottom: '12px' }}>
          FP&A Maturity Assessment
        </h1>
        <p style={{ color: '#6b7280', fontSize: '18px' }}>
          Observable evidence. Deterministic scoring. Actionable gaps.
        </p>
      </header>

      {/* What We're Measuring */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
          What We're Measuring
        </h2>
        <p style={{ color: '#374151', lineHeight: '1.6' }}>
          This diagnostic evaluates how reliably your finance function executes real
          workflows — based on observable evidence, not aspirations.
        </p>
        <p style={{ color: '#374151', lineHeight: '1.6', marginTop: '12px' }}>
          You'll answer <strong>48 Yes/No questions</strong>. Be honest. There's no
          penalty for "No" — only insight.
        </p>
      </section>

      {/* Maturity Levels */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
          The Four Maturity Levels
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {maturityLevels.map((level) => (
            <div
              key={level.level}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#fafafa'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {level.level}
                </span>
                <span style={{ fontWeight: '600', fontSize: '16px' }}>{level.name}</span>
              </div>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                {level.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Methodology */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
          Why We Ask This Way
        </h2>
        <p style={{ color: '#374151', lineHeight: '1.6' }}>
          Every question is binary: <strong>Yes</strong> or <strong>No</strong>.
        </p>
        <p style={{ color: '#374151', lineHeight: '1.6', marginTop: '12px' }}>
          We don't ask "Do you have a budget process?" — that's too easy to say yes to.
        </p>
        <p style={{ color: '#374151', lineHeight: '1.6', marginTop: '12px' }}>
          We ask "Does the company produce an approved annual budget <em>before the
          fiscal year begins</em>?" — specific, observable, auditable.
        </p>
        <p style={{
          color: '#1f2937',
          lineHeight: '1.6',
          marginTop: '16px',
          padding: '12px 16px',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px',
          fontWeight: '500'
        }}>
          The principle: If you can't point to evidence, the answer is No.
        </p>
      </section>

      {/* What You'll Get */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
          What You'll Get
        </h2>
        <ul style={{ color: '#374151', lineHeight: '1.8', paddingLeft: '20px' }}>
          <li><strong>Execution Score</strong> — How complete is your FP&A function?</li>
          <li><strong>Maturity Level</strong> — Which stage are you at?</li>
          <li><strong>Critical Risks</strong> — What gaps could hurt you?</li>
          <li><strong>Prioritized Actions</strong> — What to fix first</li>
        </ul>
      </section>

      {/* CTA */}
      <div style={{ textAlign: 'center' }}>
        <Link to={`/assess?runId=${runId}`}>
          <button style={{
            backgroundColor: '#1f2937',
            color: 'white',
            padding: '14px 32px',
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            Begin Assessment →
          </button>
        </Link>
      </div>
    </div>
  );
}
