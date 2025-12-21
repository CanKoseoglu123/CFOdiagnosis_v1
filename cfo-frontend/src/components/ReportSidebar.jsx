// components/ReportSidebar.jsx
// Shows company info, section navigation, and action buttons

import { ArrowRight, Printer, Plus } from 'lucide-react';

export default function ReportSidebar({
  companyName = 'Assessment',
  industry = null,
  onSectionClick = () => {},
  onPrint = () => {},
  onNewAssessment = () => {}
}) {
  const sections = [
    { id: 'executive', label: 'Executive Summary' },
    { id: 'score', label: 'Execution Score' },
    { id: 'maturity', label: 'Maturity Level' },
    { id: 'risks', label: 'Critical Risks' },
    { id: 'actions', label: 'Actions' },
    { id: 'pillars', label: 'Pillar Breakdown' },
  ];

  return (
    <div>
      {/* Company Info */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontWeight: '600', fontSize: 16, color: '#1f2937' }}>
          {companyName}
        </div>
        {industry && (
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: 4 }}>
            {industry}
          </div>
        )}
        <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: 4 }}>
          FP&A Maturity Report
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* Navigation */}
      <div className="sidebar-nav-section">
        <div className="sidebar-nav-label">Jump to</div>
        {sections.map((section) => (
          <div
            key={section.id}
            className="sidebar-nav-item"
            onClick={() => onSectionClick(section.id)}
          >
            <span className="sidebar-nav-item-icon">
              <ArrowRight size={14} />
            </span>
            {section.label}
          </div>
        ))}
      </div>

      <div className="sidebar-divider" />

      {/* Actions */}
      <button className="sidebar-action-button" onClick={onPrint}>
        <Printer size={16} />
        Print / PDF
      </button>
      <button className="sidebar-action-button secondary" onClick={onNewAssessment}>
        <Plus size={16} />
        New Assessment
      </button>
    </div>
  );
}
