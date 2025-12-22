// src/components/report/PriorityTabs.jsx
// P1/P2/P3 priority tabs - NEVER disabled, count=0 shows checkmark

import { Unlock, Zap, Target } from 'lucide-react';

const PRIORITY_CONFIG = {
  P1: {
    icon: Unlock,
    label: 'Unlock',
    description: 'Fix these critical gaps to advance'
  },
  P2: {
    icon: Zap,
    label: 'Optimize',
    description: 'Strengthen your current level'
  },
  P3: {
    icon: Target,
    label: 'Future',
    description: 'Prepare for the next level'
  }
};

export default function PriorityTabs({ initiatives, activeTab, onTabChange }) {
  const counts = {
    P1: initiatives?.filter(i => i.priority === 'P1').length || 0,
    P2: initiatives?.filter(i => i.priority === 'P2').length || 0,
    P3: initiatives?.filter(i => i.priority === 'P3').length || 0
  };

  return (
    <div className="border-b border-slate-300 mb-4">
      <nav className="flex gap-6 overflow-x-auto">
        {(['P1', 'P2', 'P3']).map(priority => {
          const config = PRIORITY_CONFIG[priority];
          const Icon = config.icon;
          const isActive = activeTab === priority;
          const count = counts[priority];

          return (
            <button
              key={priority}
              onClick={() => onTabChange(priority)}
              // NEVER disable tabs - count=0 is a VICTORY
              className={`
                py-3 text-sm font-medium border-b-2 -mb-px transition-colors
                flex items-center gap-2 whitespace-nowrap
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-navy'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{config.label}</span>
              <span className={`
                px-1.5 py-0.5 text-xs rounded-sm
                ${isActive ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'}
                ${count === 0 ? 'bg-green-100 text-green-700' : ''}
              `}>
                {count === 0 ? '✓' : count}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export function PrioritySectionHeader({ priority }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <div className="mb-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {priority}: {config.label}
      </span>
      <span className="text-xs text-slate ml-2">· {config.description}</span>
    </div>
  );
}
