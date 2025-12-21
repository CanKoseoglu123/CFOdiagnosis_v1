// src/components/ExecutiveSummaryV2.jsx
// V2: Executive Summary with Score vs Cap narrative
// Shows execution score, maturity level, and cap explanation

import React from 'react';
import { AlertTriangle, TrendingUp, Lock, Unlock } from 'lucide-react';

const LEVEL_COLORS = {
  1: { bg: '#FEE2E2', text: '#991B1B', accent: '#EF4444', name: 'Emerging' },
  2: { bg: '#FEF3C7', text: '#92400E', accent: '#F59E0B', name: 'Defined' },
  3: { bg: '#DCFCE7', text: '#166534', accent: '#22C55E', name: 'Managed' },
  4: { bg: '#DBEAFE', text: '#1E40AF', accent: '#3B82F6', name: 'Optimized' },
};

export default function ExecutiveSummaryV2({ maturityV2, questions = [] }) {
  if (!maturityV2) return null;

  const {
    execution_score,
    potential_level,
    actual_level,
    capped,
    capped_by = [],
    capped_reason,
  } = maturityV2;

  const actualColor = LEVEL_COLORS[actual_level] || LEVEL_COLORS[1];
  const potentialColor = LEVEL_COLORS[potential_level] || LEVEL_COLORS[1];

  // Get capped question texts
  const cappedQuestions = capped_by.map(qId => {
    const q = questions.find(q => q.id === qId);
    return {
      id: qId,
      text: q?.text || qId,
      level: q?.level || 1,
    };
  });

  return (
    <div style={{
      background: '#FFF',
      border: '1px solid #E5E7EB',
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 24
    }}>
      {/* Main Stats */}
      <div style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Execution Score */}
          <div>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em' }}>
              EXECUTION SCORE
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 48, fontWeight: 700, color: '#111827' }}>{execution_score}%</span>
            </div>
            {/* Progress bar */}
            <div style={{ marginTop: 12, height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                width: `${execution_score}%`,
                height: '100%',
                background: execution_score >= 80 ? '#22C55E' : execution_score >= 50 ? '#F59E0B' : '#EF4444',
                borderRadius: 4,
                transition: 'width 0.8s ease'
              }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#6B7280' }}>
              {execution_score >= 95 ? 'Excellent execution' :
               execution_score >= 80 ? 'Strong execution' :
               execution_score >= 50 ? 'Moderate execution' : 'Needs improvement'}
            </div>
          </div>

          {/* Maturity Level */}
          <div>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em' }}>
              MATURITY LEVEL
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                background: actualColor.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${actualColor.accent}`
              }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: actualColor.accent }}>L{actual_level}</span>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{actualColor.name}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Level {actual_level} of 4</div>
              </div>
            </div>
            {/* Level dots */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {[1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: level <= actual_level ? LEVEL_COLORS[level].accent : '#E5E7EB',
                    border: level === actual_level ? `2px solid ${actualColor.accent}` : 'none'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cap Banner */}
      {capped && (
        <div style={{
          background: '#FEF3C7',
          borderTop: '1px solid #FDE68A',
          padding: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <Lock size={20} color="#92400E" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#92400E', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} />
                YOUR MATURITY IS CAPPED
              </div>
              <p style={{ margin: 0, color: '#78350F', fontSize: 14, lineHeight: 1.5 }}>
                Your execution score ({execution_score}%) would qualify for <strong>Level {potential_level} ({potentialColor.name})</strong>,
                but you're capped at <strong>Level {actual_level}</strong> because:
              </p>

              {/* Capped questions */}
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cappedQuestions.map(q => (
                  <div key={q.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '8px 12px',
                    background: '#FEF9C3',
                    borderRadius: 8,
                    border: '1px solid #FDE68A'
                  }}>
                    <span style={{ color: '#DC2626', fontWeight: 700 }}>X</span>
                    <span style={{ color: '#78350F', fontSize: 13 }}>
                      {q.text.length > 80 ? q.text.substring(0, 80) + '...' : q.text}
                      <span style={{ color: '#92400E', fontSize: 11, marginLeft: 8 }}>(L{q.level})</span>
                    </span>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 16,
                padding: '10px 14px',
                background: '#FEF9C3',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <Unlock size={16} color="#166534" />
                <span style={{ color: '#166534', fontSize: 13, fontWeight: 600 }}>
                  Fix {cappedQuestions.length === 1 ? 'this item' : `these ${cappedQuestions.length} items`} to unlock Level {actual_level + 1}.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Not capped - show potential */}
      {!capped && potential_level === actual_level && (
        <div style={{
          background: '#DCFCE7',
          borderTop: '1px solid #BBF7D0',
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <TrendingUp size={20} color="#166534" />
          <span style={{ color: '#166534', fontSize: 14 }}>
            <strong>You're on track!</strong> Your execution score matches your maturity level.
            {actual_level < 4 && ` Reach ${actual_level === 1 ? '50%' : actual_level === 2 ? '80%' : '95%'} to advance to Level ${actual_level + 1}.`}
          </span>
        </div>
      )}
    </div>
  );
}
