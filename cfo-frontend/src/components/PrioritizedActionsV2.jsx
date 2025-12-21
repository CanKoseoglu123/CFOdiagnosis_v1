// src/components/PrioritizedActionsV2.jsx
// V2.1: Prioritized Actions with P1/P2/P3 visual hierarchy and action type badges
// P1 = Unlock (critical blockers), P2 = Optimize (current roadmap), P3 = Future

import React, { useState } from 'react';
import { Unlock, TrendingUp, Lightbulb, ChevronDown, ChevronRight, Clock, Zap, Target, Wrench, Users, ClipboardCheck } from 'lucide-react';

const PRIORITY_CONFIG = {
  P1: {
    label: 'Unlock',
    description: 'Critical blockers preventing advancement',
    icon: Unlock,
    bg: '#FEE2E2',
    border: '#EF4444',
    text: '#991B1B',
    accentBg: '#DC2626',
    accentText: '#FFF',
  },
  P2: {
    label: 'Optimize',
    description: 'Gaps within your potential level',
    icon: TrendingUp,
    bg: '#FEF3C7',
    border: '#F59E0B',
    text: '#92400E',
    accentBg: '#F59E0B',
    accentText: '#FFF',
  },
  P3: {
    label: 'Future',
    description: 'Prepare for next level',
    icon: Lightbulb,
    bg: '#DBEAFE',
    border: '#3B82F6',
    text: '#1E40AF',
    accentBg: '#3B82F6',
    accentText: '#FFF',
  },
};

// V2.1: Action type badges
const ACTION_TYPE_CONFIG = {
  quick_win: {
    label: 'Quick Win',
    icon: Zap,
    bg: '#DCFCE7',
    text: '#166534',
    border: '#BBF7D0',
  },
  structural: {
    label: 'Structural',
    icon: Wrench,
    bg: '#DBEAFE',
    text: '#1E40AF',
    border: '#BFDBFE',
  },
  behavioral: {
    label: 'Behavioral',
    icon: Users,
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#FDE68A',
  },
  governance: {
    label: 'Governance',
    icon: ClipboardCheck,
    bg: '#F3E8FF',
    text: '#6B21A8',
    border: '#E9D5FF',
  },
};

const EFFORT_ICONS = {
  low: { icon: Zap, label: 'Quick Win', color: '#22C55E' },
  medium: { icon: Clock, label: 'Moderate', color: '#F59E0B' },
  high: { icon: Target, label: 'Strategic', color: '#EF4444' },
};

export default function PrioritizedActionsV2({ actions = [], maturityV2 }) {
  const [expandedPriority, setExpandedPriority] = useState('P1');

  if (!actions || actions.length === 0) {
    return (
      <div style={{
        background: '#DCFCE7',
        border: '1px solid #BBF7D0',
        borderRadius: 14,
        padding: 24,
        marginBottom: 24,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>Outstanding Performance!</div>
        <div style={{ fontWeight: 600, color: '#166534', marginBottom: 4 }}>
          Outstanding Performance!
        </div>
        <div style={{ fontSize: 14, color: '#15803D' }}>
          No improvement actions needed. You're executing at the highest level.
        </div>
      </div>
    );
  }

  // Group by priority (V2.1: P1/P2/P3)
  const p1Actions = actions.filter(a => a.priority === 'P1');
  const p2Actions = actions.filter(a => a.priority === 'P2');
  const p3Actions = actions.filter(a => a.priority === 'P3');

  const togglePriority = (priority) => {
    setExpandedPriority(prev => prev === priority ? null : priority);
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
          Recommended Actions
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
          Prioritized improvements based on your assessment
          {maturityV2?.capped && (
            <span style={{ color: '#DC2626', fontWeight: 600 }}>
              {' '}Focus on P1 to unlock your potential
            </span>
          )}
        </p>
      </div>

      {/* Summary Bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #E5E7EB',
        background: '#F9FAFB'
      }}>
        {[
          { priority: 'P1', count: p1Actions.length },
          { priority: 'P2', count: p2Actions.length },
          { priority: 'P3', count: p3Actions.length },
        ].map(({ priority, count }) => {
          const config = PRIORITY_CONFIG[priority];
          const Icon = config.icon;
          const isActive = expandedPriority === priority;

          return (
            <button
              key={priority}
              onClick={() => togglePriority(priority)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 16px',
                border: 'none',
                background: isActive ? config.bg : 'transparent',
                borderBottom: isActive ? `3px solid ${config.border}` : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={16} color={config.text} />
              <span style={{ fontWeight: 600, color: config.text, fontSize: 13 }}>
                {config.label}
              </span>
              <span style={{
                background: count > 0 ? config.accentBg : '#E5E7EB',
                color: count > 0 ? config.accentText : '#6B7280',
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 10
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Action Lists */}
      <div style={{ padding: 16 }}>
        {expandedPriority === 'P1' && (
          <PrioritySection priority="P1" actions={p1Actions} />
        )}
        {expandedPriority === 'P2' && (
          <PrioritySection priority="P2" actions={p2Actions} />
        )}
        {expandedPriority === 'P3' && (
          <PrioritySection priority="P3" actions={p3Actions} />
        )}
      </div>
    </div>
  );
}

function PrioritySection({ priority, actions }) {
  const config = PRIORITY_CONFIG[priority];

  if (actions.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: 24,
        color: '#6B7280',
        fontSize: 14
      }}>
        {priority === 'P1'
          ? 'No critical blockers. Great job!'
          : priority === 'P2'
          ? 'No optimization actions needed at this level.'
          : 'You\'re ready for the next level when you choose to advance.'}
      </div>
    );
  }

  // Group actions by level for P2
  const actionsByLevel = actions.reduce((acc, action) => {
    const level = action.level || 1;
    if (!acc[level]) acc[level] = [];
    acc[level].push(action);
    return acc;
  }, {});

  return (
    <div>
      <div style={{
        marginBottom: 16,
        padding: '10px 14px',
        background: config.bg,
        borderRadius: 8,
        border: `1px solid ${config.border}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {React.createElement(config.icon, { size: 16, color: config.text })}
          <span style={{ fontWeight: 600, color: config.text, fontSize: 13 }}>
            {config.description}
          </span>
        </div>
      </div>

      {/* Render by level for better organization */}
      {[1, 2, 3, 4].map(level => {
        const levelActions = actionsByLevel[level] || [];
        if (levelActions.length === 0) return null;

        return (
          <div key={level} style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#6B7280',
              letterSpacing: '0.05em',
              marginBottom: 8,
              paddingLeft: 4
            }}>
              LEVEL {level}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {levelActions.map((action, idx) => (
                <ActionCard key={action.question_id || idx} action={action} priority={priority} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActionCard({ action, priority }) {
  const [expanded, setExpanded] = useState(false);
  const config = PRIORITY_CONFIG[priority];
  const effortConfig = EFFORT_ICONS[action.effort] || EFFORT_ICONS.medium;
  const EffortIcon = effortConfig.icon;

  // V2.1: Get action type config
  const typeConfig = action.action_type ? ACTION_TYPE_CONFIG[action.action_type] : null;
  const TypeIcon = typeConfig?.icon;

  return (
    <div style={{
      border: '1px solid #E5E7EB',
      borderRadius: 8,
      overflow: 'hidden',
      background: '#FFF'
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          padding: '12px 14px',
          cursor: 'pointer',
          gap: 10
        }}
      >
        {/* Priority Badge */}
        <div style={{
          background: config.accentBg,
          color: config.accentText,
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: 4,
          flexShrink: 0,
          marginTop: 2
        }}>
          {priority}
        </div>

        {/* Action Text */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#111827', lineHeight: 1.4 }}>
            {action.action_title || action.action_text}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 6,
            fontSize: 12,
            color: '#6B7280',
            flexWrap: 'wrap'
          }}>
            {/* V2.1: Action Type Badge */}
            {typeConfig && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: typeConfig.bg,
                border: `1px solid ${typeConfig.border}`,
                color: typeConfig.text,
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500
              }}>
                <TypeIcon size={10} />
                {typeConfig.label}
              </span>
            )}
            {/* Score Badge */}
            {action.score !== undefined && (
              <span style={{
                background: action.is_critical ? '#FEE2E2' : '#F3F4F6',
                color: action.is_critical ? '#991B1B' : '#374151',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600
              }}>
                Score: {action.score}
                {action.is_critical && ' (Critical)'}
              </span>
            )}
            {/* Effort */}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <EffortIcon size={12} color={effortConfig.color} />
              {effortConfig.label}
            </span>
          </div>
        </div>

        {/* Expand */}
        <div style={{ color: '#9CA3AF' }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid #E5E7EB',
          background: '#F9FAFB',
          fontSize: 13
        }}>
          <div style={{ color: '#6B7280', marginBottom: 8 }}>
            <strong>Question:</strong> {action.question_text}
          </div>
          {/* Impact Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: config.bg,
            padding: '4px 10px',
            borderRadius: 6,
            color: config.text,
            fontSize: 12,
            fontWeight: 500,
            marginBottom: 8
          }}>
            {React.createElement(config.icon, { size: 12 })}
            {action.impact}
          </div>
          {/* Show recommendation if available */}
          {action.action_text && action.action_title && (
            <div style={{
              marginTop: 8,
              padding: 10,
              background: '#FFF',
              border: '1px solid #E5E7EB',
              borderRadius: 6,
              fontSize: 13,
              color: '#374151',
              lineHeight: 1.5
            }}>
              <strong style={{ color: '#111827' }}>Recommendation:</strong> {action.action_text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
