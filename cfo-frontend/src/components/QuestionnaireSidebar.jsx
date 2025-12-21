// components/QuestionnaireSidebar.jsx
// Shows progress, theme navigation, and submit button

import { CheckCircle, Send } from 'lucide-react';

const THEME_ICONS = {
  foundation: '🏛️',
  future: '🔮',
  intelligence: '🧠',
};

export default function QuestionnaireSidebar({
  progress = { answered: 0, total: 48, percentage: 0 },
  themes = [],
  activeTheme = null,
  onThemeClick = () => {},
  onSubmit = () => {},
  canSubmit = false
}) {
  return (
    <div>
      {/* Progress */}
      <div className="sidebar-progress">
        <div className="sidebar-progress-label">Progress</div>
        <div className="sidebar-progress-bar">
          <div
            className="sidebar-progress-fill"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <div className="sidebar-progress-text">
          {progress.answered} of {progress.total} ({Math.round(progress.percentage)}%)
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* Theme Navigation */}
      {themes.length > 0 && (
        <div className="sidebar-nav-section">
          <div className="sidebar-nav-label">Themes</div>
          {themes.map((theme) => (
            <div key={theme.code}>
              <div
                className={`sidebar-nav-item ${theme.code === activeTheme ? 'active' : ''} ${theme.completed ? 'completed' : ''}`}
                onClick={() => onThemeClick(theme.code)}
              >
                <span className="sidebar-nav-item-icon">
                  {theme.completed ? <CheckCircle size={16} color="#059669" /> : THEME_ICONS[theme.code] || '📋'}
                </span>
                {theme.name}
                <span className="sidebar-nav-item-count">
                  {theme.answered}/{theme.total}
                </span>
              </div>
              {theme.objectives && theme.objectives.map((obj) => (
                <div
                  key={obj.id}
                  className={`sidebar-nav-subitem ${obj.active ? 'active' : ''}`}
                  onClick={() => onThemeClick(theme.code, obj.id)}
                >
                  {obj.name} ({obj.answered}/{obj.total})
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="sidebar-divider" />

      {/* Submit */}
      <button
        className="sidebar-action-button"
        onClick={onSubmit}
        disabled={!canSubmit}
      >
        <Send size={16} />
        {canSubmit ? 'Submit Assessment' : `${progress.total - progress.answered} remaining`}
      </button>
    </div>
  );
}
