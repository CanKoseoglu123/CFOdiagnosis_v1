// src/components/PrioritizedActionsV2.jsx
// V2.2: Actions grouped by Initiative with P1/P2/P3 tabs
// Structure: P1 Tab → Initiative Cards → Actions within each

import React, { useState } from 'react';
import { Unlock, TrendingUp, Lightbulb, ChevronDown, ChevronRight, Clock, Zap, Target, Wrench, Users, ClipboardCheck, Layers } from 'lucide-react';

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

// Theme colors for initiative cards
const THEME_CONFIG = {
  foundation: { bg: '#F0FDF4', border: '#86EFAC', accent: '#166534' },
  future: { bg: '#EEF2FF', border: '#A5B4FC', accent: '#4338CA' },
  intelligence: { bg: '#FDF4FF', border: '#E879F9', accent: '#A21CAF' },
  unknown: { bg: '#F9FAFB', border: '#E5E7EB', accent: '#6B7280' },
};

// Action type badges
const ACTION_TYPE_CONFIG = {
  quick_win: { label: 'Quick Win', icon: Zap, bg: '#DCFCE7', text: '#166534' },
  structural: { label: 'Structural', icon: Wrench, bg: '#DBEAFE', text: '#1E40AF' },
  behavioral: { label: 'Behavioral', icon: Users, bg: '#FEF3C7', text: '#92400E' },
  governance: { label: 'Governance', icon: ClipboardCheck, bg: '#F3E8FF', text: '#6B21A8' },
};

const EFFORT_ICONS = {
  low: { icon: Zap, label: 'Quick', color: '#22C55E' },
  medium: { icon: Clock, label: 'Moderate', color: '#F59E0B' },
  high: { icon: Target, label: 'Strategic', color: '#EF4444' },
};

export default function PrioritizedActionsV2({ groupedInitiatives = [], maturityV2 }) {
  const [expandedPriority, setExpandedPriority] = useState('P1');

  if (!groupedInitiatives || groupedInitiatives.length === 0) {
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

  // Group initiatives by priority
  const p1Initiatives = groupedInitiatives.filter(i => i.priority === 'P1');
  const p2Initiatives = groupedInitiatives.filter(i => i.priority === 'P2');
  const p3Initiatives = groupedInitiatives.filter(i => i.priority === 'P3');

  // Count total actions per priority
  const p1ActionCount = p1Initiatives.reduce((sum, i) => sum + (i.actions?.length || 0), 0);
  const p2ActionCount = p2Initiatives.reduce((sum, i) => sum + (i.actions?.length || 0), 0);
  const p3ActionCount = p3Initiatives.reduce((sum, i) => sum + (i.actions?.length || 0), 0);

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
          Recommended Initiatives
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
          Prioritized improvement initiatives based on your assessment
          {maturityV2?.capped && (
            <span style={{ color: '#DC2626', fontWeight: 600 }}>
              {' '}— Focus on P1 to unlock your potential
            </span>
          )}
        </p>
      </div>

      {/* Priority Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #E5E7EB',
        background: '#F9FAFB'
      }}>
        {[
          { priority: 'P1', initCount: p1Initiatives.length, actionCount: p1ActionCount },
          { priority: 'P2', initCount: p2Initiatives.length, actionCount: p2ActionCount },
          { priority: 'P3', initCount: p3Initiatives.length, actionCount: p3ActionCount },
        ].map(({ priority, initCount, actionCount }) => {
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
                background: initCount > 0 ? config.accentBg : '#E5E7EB',
                color: initCount > 0 ? config.accentText : '#6B7280',
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 10
              }}>
                {initCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Initiative Lists */}
      <div style={{ padding: 16 }}>
        {expandedPriority === 'P1' && (
          <PrioritySection priority="P1" initiatives={p1Initiatives} />
        )}
        {expandedPriority === 'P2' && (
          <PrioritySection priority="P2" initiatives={p2Initiatives} />
        )}
        {expandedPriority === 'P3' && (
          <PrioritySection priority="P3" initiatives={p3Initiatives} />
        )}
      </div>
    </div>
  );
}

function PrioritySection({ priority, initiatives }) {
  const config = PRIORITY_CONFIG[priority];

  if (initiatives.length === 0) {
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
          ? 'No optimization initiatives needed at this level.'
          : 'You\'re ready for the next level when you choose to advance.'}
      </div>
    );
  }

  return (
    <div>
      {/* Priority Description */}
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

      {/* Initiative Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {initiatives.map((initiative) => (
          <InitiativeCard
            key={initiative.initiative_id}
            initiative={initiative}
            priority={priority}
          />
        ))}
      </div>
    </div>
  );
}

function InitiativeCard({ initiative, priority }) {
  const [expanded, setExpanded] = useState(priority === 'P1'); // Auto-expand P1
  const priorityConfig = PRIORITY_CONFIG[priority];
  const themeConfig = THEME_CONFIG[initiative.theme_id] || THEME_CONFIG.unknown;
  const actionCount = initiative.actions?.length || 0;

  return (
    <div style={{
      border: `1px solid ${themeConfig.border}`,
      borderRadius: 12,
      overflow: 'hidden',
      background: '#FFF'
    }}>
      {/* Initiative Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '14px 16px',
          cursor: 'pointer',
          background: themeConfig.bg,
          gap: 12
        }}
      >
        {/* Initiative Icon */}
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: themeConfig.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Layers size={18} color="#FFF" />
        </div>

        {/* Initiative Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>
              {initiative.initiative_title}
            </span>
            <span style={{
              background: priorityConfig.accentBg,
              color: priorityConfig.accentText,
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 4
            }}>
              {priority}
            </span>
          </div>
          <div style={{
            fontSize: 13,
            color: '#6B7280',
            marginTop: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {initiative.initiative_description}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 6,
            fontSize: 12,
            color: '#9CA3AF'
          }}>
            <span>{actionCount} action{actionCount !== 1 ? 's' : ''}</span>
            <span>Score: {initiative.total_score}</span>
          </div>
        </div>

        {/* Expand Icon */}
        <div style={{ color: '#6B7280' }}>
          {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </div>

      {/* Expanded Actions */}
      {expanded && initiative.actions && initiative.actions.length > 0 && (
        <div style={{
          padding: 16,
          borderTop: `1px solid ${themeConfig.border}`,
          background: '#FAFAFA'
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#6B7280',
            marginBottom: 10,
            letterSpacing: '0.05em'
          }}>
            ACTIONS ({actionCount})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {initiative.actions.map((action, idx) => (
              <ActionItem key={action.question_id || idx} action={action} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionItem({ action }) {
  const [showDetails, setShowDetails] = useState(false);
  const typeConfig = action.action_type ? ACTION_TYPE_CONFIG[action.action_type] : null;
  const TypeIcon = typeConfig?.icon;
  const effortConfig = EFFORT_ICONS[action.effort] || EFFORT_ICONS.medium;

  return (
    <div style={{
      background: '#FFF',
      border: '1px solid #E5E7EB',
      borderRadius: 8,
      overflow: 'hidden'
    }}>
      <div
        onClick={() => setShowDetails(!showDetails)}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          padding: '10px 12px',
          cursor: 'pointer',
          gap: 10
        }}
      >
        {/* Critical Indicator */}
        {action.is_critical && (
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#EF4444',
            flexShrink: 0,
            marginTop: 6
          }} />
        )}

        {/* Action Content */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', lineHeight: 1.4 }}>
            {action.action_title || action.action_text}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 4,
            flexWrap: 'wrap'
          }}>
            {/* Action Type Badge */}
            {typeConfig && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                background: typeConfig.bg,
                color: typeConfig.text,
                padding: '1px 6px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 500
              }}>
                <TypeIcon size={9} />
                {typeConfig.label}
              </span>
            )}
            {/* Level Badge */}
            <span style={{
              background: '#F3F4F6',
              color: '#6B7280',
              padding: '1px 6px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 500
            }}>
              L{action.level}
            </span>
            {/* Score */}
            <span style={{
              color: '#9CA3AF',
              fontSize: 10
            }}>
              Score: {action.score}
            </span>
          </div>
        </div>

        {/* Expand Icon */}
        <div style={{ color: '#D1D5DB' }}>
          {showDetails ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {/* Action Details */}
      {showDetails && (
        <div style={{
          padding: '10px 12px',
          borderTop: '1px solid #F3F4F6',
          background: '#FAFAFA',
          fontSize: 12
        }}>
          <div style={{ color: '#6B7280', marginBottom: 6 }}>
            <strong>Question:</strong> {action.question_text}
          </div>
          <div style={{ color: '#6B7280' }}>
            <strong>Impact:</strong> {action.impact}
          </div>
        </div>
      )}
    </div>
  );
}
