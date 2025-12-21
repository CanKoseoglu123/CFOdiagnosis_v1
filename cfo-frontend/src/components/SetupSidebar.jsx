// components/SetupSidebar.jsx
// Shows setup progress steps

import { CheckCircle } from 'lucide-react';

export default function SetupSidebar({ currentStep = 1 }) {
  return (
    <div>
      <div className="sidebar-nav-section">
        <div className="sidebar-nav-label">Setup Progress</div>
        <div className={`sidebar-nav-item ${currentStep === 1 ? 'active' : 'completed'}`}>
          <span className="sidebar-nav-item-icon">
            {currentStep > 1 ? <CheckCircle size={16} color="#059669" /> : '1'}
          </span>
          Company Info
        </div>
        <div className={`sidebar-nav-item ${currentStep === 2 ? 'active' : ''}`}>
          <span className="sidebar-nav-item-icon">2</span>
          Assessment
        </div>
      </div>

      <div className="sidebar-divider" />

      <div style={{ fontSize: 13, color: '#6b7280' }}>
        Tell us about your organization to receive tailored recommendations.
      </div>
    </div>
  );
}
