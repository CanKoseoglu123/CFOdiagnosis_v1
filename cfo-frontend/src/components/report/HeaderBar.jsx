// src/components/report/HeaderBar.jsx
// Sticky header with quick stats and navigation tabs

import { ArrowLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatBox from './StatBox';
import TabButton from './TabButton';
import { getLevelName } from '../../data/spec';

export default function HeaderBar({
  score,
  actualLevel,
  criticalCount,
  actionCount,
  activeTab,
  onTabChange
}) {
  const navigate = useNavigate();
  const levelName = getLevelName(actualLevel);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-300 no-print">
      {/* REDUCED PADDING: py-3 instead of py-4 to save vertical space */}
      <div className="max-w-6xl mx-auto px-6 py-3">
        {/* Top row: nav + title + auto-save status */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-navy text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <h1 className="text-lg font-bold text-navy">FP&A Diagnostic Report</h1>

          {/* Auto-save indicator */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Check className="w-3 h-3 text-green-600" />
            <span>Auto-saved</span>
          </div>
        </div>

        {/* Quick stats - dense, sharp borders */}
        <div className="flex flex-wrap gap-3 mb-3">
          <StatBox label="EXECUTION" value={`${score}%`} />
          <StatBox
            label="MATURITY"
            value={`L${actualLevel}`}
            sublabel={levelName}
            highlight
          />
          <StatBox
            label="CRITICAL"
            value={criticalCount}
            alert={criticalCount > 0}
          />
          <StatBox label="ACTIONS" value={actionCount} />
        </div>

        {/* Tab navigation - underlined style */}
        <nav className="flex gap-6 border-b border-slate-300">
          <TabButton active={activeTab === 'overview'} onClick={() => onTabChange('overview')}>
            Overview
          </TabButton>
          <TabButton active={activeTab === 'objectives'} onClick={() => onTabChange('objectives')}>
            Objectives
          </TabButton>
          <TabButton active={activeTab === 'actions'} onClick={() => onTabChange('actions')}>
            Actions
          </TabButton>
          <TabButton active={activeTab === 'maturity'} onClick={() => onTabChange('maturity')}>
            Maturity
          </TabButton>
        </nav>
      </div>
    </header>
  );
}
