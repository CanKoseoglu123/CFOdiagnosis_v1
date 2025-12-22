// src/components/report/EmptyState.jsx
// Victory message for count=0 tabs

import { CheckCircle, Target } from 'lucide-react';

const MESSAGES = {
  P1: {
    icon: CheckCircle,
    title: 'No blockers',
    description: 'No critical gaps blocking maturity advancement.'
  },
  P2: {
    icon: CheckCircle,
    title: 'Fully optimized',
    description: 'All gaps at current maturity level addressed.'
  },
  P3: {
    icon: Target,
    title: 'Ready for future',
    description: 'No additional actions for next level.'
  }
};

export default function EmptyState({ priority }) {
  const config = MESSAGES[priority] || MESSAGES.P2;
  const Icon = config.icon;

  return (
    <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-sm">
      <Icon className="w-8 h-8 text-green-600 mx-auto mb-2" />
      <h3 className="text-sm font-bold text-navy">{config.title}</h3>
      <p className="text-xs text-slate-500 mt-1">{config.description}</p>
    </div>
  );
}
