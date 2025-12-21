// components/IntroSidebar.jsx
// Minimal sidebar for intro page - just shows what to expect

import { CheckCircle, Target, AlertTriangle, Zap } from 'lucide-react';

export default function IntroSidebar() {
  return (
    <div>
      <div className="sidebar-nav-section">
        <div className="sidebar-nav-label">What You'll Get</div>
        <div className="sidebar-nav-item">
          <span className="sidebar-nav-item-icon"><Target size={16} /></span>
          Execution Score
        </div>
        <div className="sidebar-nav-item">
          <span className="sidebar-nav-item-icon"><CheckCircle size={16} /></span>
          Maturity Level
        </div>
        <div className="sidebar-nav-item">
          <span className="sidebar-nav-item-icon"><AlertTriangle size={16} /></span>
          Critical Risks
        </div>
        <div className="sidebar-nav-item">
          <span className="sidebar-nav-item-icon"><Zap size={16} /></span>
          Priority Actions
        </div>
      </div>

      <div className="sidebar-divider" />

      <div style={{ fontSize: 13, color: '#6b7280' }}>
        48 Yes/No questions across 4 maturity levels. Takes about 10-15 minutes.
      </div>
    </div>
  );
}
