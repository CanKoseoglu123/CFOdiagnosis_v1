// src/components/ObjectiveTrafficLights.jsx
// V2: Objective Traffic Lights with Green Light of Death override indicator
// Displays objectives grouped by level with color-coded status

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  green: { bg: '#DCFCE7', border: '#22C55E', text: '#166534', label: 'Strong' },
  yellow: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', label: 'Developing' },
  red: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B', label: 'Needs Work' },
};

const LEVEL_NAMES = {
  1: 'Emerging',
  2: 'Defined',
  3: 'Managed',
  4: 'Optimized',
};

export default function ObjectiveTrafficLights({ objectives = [] }) {
  const [expandedObjectives, setExpandedObjectives] = useState(new Set());

  if (!objectives || objectives.length === 0) return null;

  // Group objectives by level
  const objectivesByLevel = objectives.reduce((acc, obj) => {
    const level = obj.level || 1;
    if (!acc[level]) acc[level] = [];
    acc[level].push(obj);
    return acc;
  }, {});

  const toggleExpand = (objectiveId) => {
    setExpandedObjectives(prev => {
      const next = new Set(prev);
      if (next.has(objectiveId)) {
        next.delete(objectiveId);
      } else {
        next.add(objectiveId);
      }
      return next;
    });
  };

  return (
    <div style={{
      background: '#FFF',
      border: '1px solid #E5E7EB',
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 24
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #E5E7EB',
        background: '#F9FAFB'
      }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
          Objective Health Check
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
          How well is your organization executing on each finance capability?
        </p>
      </div>

      {/* Objectives by Level */}
      <div style={{ padding: 16 }}>
        {[1, 2, 3, 4].map(level => {
          const levelObjectives = objectivesByLevel[level] || [];
          if (levelObjectives.length === 0) return null;

          return (
            <div key={level} style={{ marginBottom: level < 4 ? 20 : 0 }}>
              {/* Level Header */}
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#6B7280',
                letterSpacing: '0.05em',
                marginBottom: 10,
                paddingLeft: 4
              }}>
                LEVEL {level}: {LEVEL_NAMES[level]?.toUpperCase()}
              </div>

              {/* Objective Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {levelObjectives.map(obj => (
                  <ObjectiveCard
                    key={obj.objective_id}
                    objective={obj}
                    expanded={expandedObjectives.has(obj.objective_id)}
                    onToggle={() => toggleExpand(obj.objective_id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ObjectiveCard({ objective, expanded, onToggle }) {
  const {
    objective_id,
    objective_name,
    score,
    status,
    questions_yes,
    questions_total,
    failed_criticals = [],
    overridden,
    override_reason,
  } = objective;

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.yellow;
  const hasFailedCriticals = failed_criticals.length > 0;

  return (
    <div style={{
      border: `1px solid ${config.border}`,
      borderRadius: 10,
      overflow: 'hidden',
      background: '#FFF'
    }}>
      {/* Main Row */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          cursor: 'pointer',
          background: config.bg,
          gap: 12
        }}
      >
        {/* Traffic Light */}
        <div style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: config.border,
          flexShrink: 0
        }} />

        {/* Name & Status */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>
              {objective_name}
            </span>
            {overridden && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                fontWeight: 600,
                color: '#92400E',
                background: '#FDE68A',
                padding: '2px 6px',
                borderRadius: 4
              }}>
                <AlertTriangle size={10} />
                CAPPED
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: config.text, marginTop: 2 }}>
            {config.label} • {questions_yes}/{questions_total} practices ({score}%)
          </div>
        </div>

        {/* Expand Icon */}
        <div style={{ color: '#6B7280' }}>
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div style={{
          padding: '12px 16px',
          borderTop: `1px solid ${config.border}`,
          background: '#FFF'
        }}>
          {/* Override Warning */}
          {overridden && override_reason && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              padding: '10px 12px',
              background: '#FEF3C7',
              borderRadius: 8,
              marginBottom: 12,
              border: '1px solid #FDE68A'
            }}>
              <AlertTriangle size={16} color="#92400E" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: '#78350F' }}>
                {override_reason}
              </span>
            </div>
          )}

          {/* Failed Criticals */}
          {hasFailedCriticals && (
            <div style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#991B1B',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <XCircle size={12} />
                CRITICAL GAPS ({failed_criticals.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {failed_criticals.map((qId, idx) => (
                  <div key={idx} style={{
                    fontSize: 12,
                    color: '#991B1B',
                    padding: '6px 10px',
                    background: '#FEE2E2',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span style={{ fontWeight: 600 }}>✗</span>
                    <span>{qId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score Bar */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: '#6B7280',
              marginBottom: 6
            }}>
              <span>Progress</span>
              <span>{score}%</span>
            </div>
            <div style={{
              height: 6,
              background: '#E5E7EB',
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${score}%`,
                height: '100%',
                background: config.border,
                borderRadius: 3,
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>

          {/* Status Thresholds */}
          <div style={{
            marginTop: 12,
            display: 'flex',
            gap: 16,
            fontSize: 11,
            color: '#6B7280'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
              &lt;50%
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
              50-79%
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
              80%+
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
