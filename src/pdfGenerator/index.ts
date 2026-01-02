/**
 * VS-44: Executive Report PDF Generator
 * Uses DocRaptor Cloud PDF API to generate boardroom-ready PDFs
 * Premium consultant quality - think McKinsey, BCG, Bain deliverables
 */

import { wrapInHtmlDocument, renderSlideWrapper, escapeHtml, formatDate, formatTimestamp } from './templates';
import { REPORT_THEME } from './theme';
import { LOGO_HORIZONTAL_BASE64 } from './assets';

interface ActionPlan {
  question_id: string;
  question_text?: string;
  label?: string;
  timeline?: string;
  owner?: string;
  status?: string;
  practice_id?: string;
  practice_name?: string;
}

interface Objective {
  id?: string;
  objective_id?: string;
  objective_name?: string;
  title?: string;
  name?: string;
  score?: number;
  theme_id?: string;
}

interface Practice {
  id?: string;
  name?: string;
  title?: string;
  practice_id?: string;
  objective_id?: string;
  evidence_state?: 'full' | 'partial' | 'none' | 'proven' | 'gap' | 'not_proven';
  maturity_level?: number;
  has_critical?: boolean;
}

interface FootprintLevel {
  level: number;
  practices?: Practice[];
}

interface CriticalRisk {
  question_id?: string;
  evidence_id?: string;
  title?: string;
  question_text?: string;
  objective_id?: string;
  expert_action?: {
    title?: string;
  };
}

interface ReportCustomizations {
  slide_titles?: Record<string, string>;
  slide_visibility?: Record<string, boolean>;
  key_messages?: {
    headline?: string;
    messages?: Array<{ title: string; body: string }>;
  } | null;
  action_labels?: Record<string, string>;
}

interface CalibrationData {
  importance_map?: Record<string, number>;
  locked?: string[];
}

interface GenerateReportInput {
  runId: string;
  companyName: string;
  industry?: string;
  overallScore: number;
  maturityLevel: number;
  customizations: ReportCustomizations;
  actions: ActionPlan[];
  timestamp: string;
  // Extended report data
  objectives?: Objective[];
  maturityFootprint?: {
    levels?: FootprintLevel[];
  };
  criticalRisks?: CriticalRisk[];
  calibration?: CalibrationData;
  specPractices?: Practice[];
  specObjectives?: Objective[];
}

const DEFAULT_TITLES = {
  cover: 'FP&A Maturity Assessment',
  key_messages: 'Key Messages',
  objectives_practices: 'Objectives & Practices',
  priority_matrix: 'Priority Matrix',
  projected_impact: 'Projected Impact',
  objective_journey: 'Objective Journey',
  committed_actions: 'Committed Actions',
};

const MATURITY_LABELS: Record<number, string> = {
  1: 'Emerging',
  2: 'Defined',
  3: 'Managed',
  4: 'Optimized',
};

// Theme display order and labels
const THEME_ORDER = ['foundation', 'future', 'intelligence'];
const THEME_LABELS: Record<string, string> = {
  'foundation': 'Foundation',
  'future': 'Future',
  'intelligence': 'Intelligence',
};

/**
 * Build objectives order from spec data
 */
function buildObjectivesOrder(specObjectives: Objective[]): Array<{ id: string; shortTitle: string; theme: string }> {
  // Sort by theme order
  const sorted = [...specObjectives].sort((a, b) => {
    const aTheme = a.theme_id || '';
    const bTheme = b.theme_id || '';
    return THEME_ORDER.indexOf(aTheme) - THEME_ORDER.indexOf(bTheme);
  });

  return sorted.map(obj => ({
    id: obj.id || obj.objective_id || '',
    shortTitle: obj.title || obj.name || obj.id || '',
    theme: THEME_LABELS[obj.theme_id || ''] || 'Other',
  }));
}

/**
 * Build practice-to-objective mapping from spec data
 */
function buildPracticeObjectiveMap(specPractices: Practice[]): Record<string, string> {
  const map: Record<string, string> = {};
  specPractices.forEach(p => {
    if (p.id && p.objective_id) {
      map[p.id] = p.objective_id;
    }
  });
  return map;
}

/**
 * Build cover slide HTML - Premium consultant style
 */
function buildCoverSlide(input: GenerateReportInput, slideNumber: string): string {
  const { companyName, timestamp, runId, customizations } = input;
  const title = customizations?.slide_titles?.cover || DEFAULT_TITLES.cover;

  return `
    <div class="slide slide-cover">
      <div class="slide-number">${slideNumber}</div>
      <div class="cover-content">
        <div class="cover-logo">
          <img src="${LOGO_HORIZONTAL_BASE64}" alt="CFO Lens" class="logo-large" />
        </div>
        <div class="cover-company">${escapeHtml(companyName || 'Your Company')}</div>
        <h1 class="cover-title">${escapeHtml(title)}</h1>
        <div class="cover-date">${formatDate(timestamp)}</div>
      </div>
      <div class="cover-divider"></div>
      <div class="slide-footer">
        Generated: ${formatTimestamp(timestamp)} | Session: ${runId.slice(0, 8)}
      </div>
    </div>
  `;
}

/**
 * Build Key Messages slide HTML (Under Construction for now)
 */
function buildKeyMessagesSlide(input: GenerateReportInput, slideNumber: string): string {
  const { timestamp, runId, customizations } = input;
  const title = customizations?.slide_titles?.key_messages || DEFAULT_TITLES.key_messages;
  const keyMessages = customizations?.key_messages;

  let content = '';

  if (keyMessages?.messages && keyMessages.messages.length > 0) {
    // Real key messages
    const headline = keyMessages.headline || 'Executive Insights';
    const messagesHtml = keyMessages.messages.slice(0, 4).map(m => `
      <div class="message-card">
        <h3>${escapeHtml(m.title)}</h3>
        <p>${escapeHtml(m.body)}</p>
      </div>
    `).join('');

    content = `
      <div class="key-messages-headline">${escapeHtml(headline)}</div>
      <div class="messages-grid">
        ${messagesHtml}
      </div>
    `;
  } else {
    // Under Construction state
    content = `
      <div class="coming-soon">
        <div class="coming-soon-icon">🚧</div>
        <div class="coming-soon-title">Under Construction</div>
        <div class="coming-soon-subtitle">AI-powered executive insights coming soon</div>
      </div>
    `;
  }

  return renderSlideWrapper({
    title,
    content,
    slideNumber,
    footerData: { timestamp, sessionId: runId.slice(0, 8) },
    logoSrc: LOGO_HORIZONTAL_BASE64,
  });
}

/**
 * Build Objectives & Practices slide - 9-column grid
 * Uses actual spec data instead of hardcoded mappings
 */
function buildObjectivesPracticesSlide(input: GenerateReportInput, slideNumber: string): string {
  const { maturityFootprint, objectives = [], specPractices = [], specObjectives = [], timestamp, runId, customizations } = input;
  const title = customizations?.slide_titles?.objectives_practices || DEFAULT_TITLES.objectives_practices;
  const levels = maturityFootprint?.levels || [];

  // Build dynamic mappings from spec data
  const objectivesOrder = buildObjectivesOrder(specObjectives);
  const practiceObjectiveMap = buildPracticeObjectiveMap(specPractices);

  // Build objective scores map
  const objectiveScores: Record<string, number> = {};
  objectives.forEach(obj => {
    const objId = obj.id || obj.objective_id || '';
    objectiveScores[objId] = Math.round(obj.score || 0);
  });

  // Flatten practices from maturityFootprint (has evidence states) and merge with spec data
  const allPractices: Practice[] = [];
  levels.forEach(level => {
    (level.practices || []).forEach(practice => {
      // Get additional info from spec practices
      const specPractice = specPractices.find(sp => sp.id === practice.id);
      allPractices.push({
        ...practice,
        title: practice.title || specPractice?.title || practice.name || practice.id,
        objective_id: practice.objective_id || specPractice?.objective_id || practiceObjectiveMap[practice.id || ''],
        maturity_level: practice.maturity_level || level.level,
      });
    });
  });

  // Group practices by objective
  const practicesByObjective: Record<string, Practice[]> = {};
  objectivesOrder.forEach(obj => {
    practicesByObjective[obj.id] = [];
  });

  allPractices.forEach(practice => {
    const objectiveId = practice.objective_id || practiceObjectiveMap[practice.id || ''];
    if (objectiveId && practicesByObjective[objectiveId]) {
      practicesByObjective[objectiveId].push(practice);
    }
  });

  // Sort practices by maturity level
  Object.keys(practicesByObjective).forEach(objId => {
    practicesByObjective[objId].sort((a, b) => (a.maturity_level || 1) - (b.maturity_level || 1));
  });

  // Build grid HTML
  const columnsHtml = objectivesOrder.map(obj => {
    const practices = practicesByObjective[obj.id] || [];
    const score = objectiveScores[obj.id];

    const practicesHtml = practices.map(p => {
      const state = p.evidence_state;
      const colorClass = (state === 'full' || state === 'proven') ? 'practice-proven'
        : state === 'partial' ? 'practice-partial'
        : 'practice-gap';
      return `<div class="practice-box ${colorClass}" title="${escapeHtml(p.title || p.name || '')}">${escapeHtml(p.title || p.name || '')}</div>`;
    }).join('');

    const scoreClass = score >= 70 ? 'score-high' : score >= 40 ? 'score-medium' : 'score-low';

    return `
      <div class="objective-column">
        <div class="objective-header">
          ${score !== undefined ? `<span class="objective-score ${scoreClass}">${score}</span>` : ''}
          <span class="objective-title">${escapeHtml(obj.shortTitle)}</span>
        </div>
        <div class="practices-stack">
          ${practicesHtml || '<div class="no-practices">-</div>'}
        </div>
      </div>
    `;
  }).join('');

  const content = `
    <p class="slide-subtitle">All practices organized by objective. Score shown in corner; colors indicate current state.</p>
    <div class="objectives-grid">
      ${columnsHtml}
    </div>
    <div class="grid-legend">
      <span class="legend-item"><span class="legend-box practice-proven"></span> Proven</span>
      <span class="legend-item"><span class="legend-box practice-partial"></span> Partial</span>
      <span class="legend-item"><span class="legend-box practice-gap"></span> Gap</span>
    </div>
  `;

  return renderSlideWrapper({
    title,
    content,
    slideNumber,
    footerData: { timestamp, sessionId: runId.slice(0, 8) },
    logoSrc: LOGO_HORIZONTAL_BASE64,
  });
}

/**
 * Build Priority Matrix slide - BCG-style quadrant
 * Uses actual spec data instead of hardcoded mappings
 */
function buildPriorityMatrixSlide(input: GenerateReportInput, slideNumber: string): string {
  const { maturityFootprint, maturityLevel, calibration, specPractices = [], timestamp, runId, customizations } = input;
  const title = customizations?.slide_titles?.priority_matrix || DEFAULT_TITLES.priority_matrix;
  const levels = maturityFootprint?.levels || [];
  const importanceMap = calibration?.importance_map || {};
  const userLevel = maturityLevel || 1;

  // Build dynamic mapping from spec data
  const practiceObjectiveMap = buildPracticeObjectiveMap(specPractices);

  // Flatten practices with metadata
  const practices: Array<Practice & { importance: number; priorityRow: string }> = [];
  levels.forEach(level => {
    (level.practices || []).forEach(fp => {
      // Get objective_id from practice data or spec mapping
      const specPractice = specPractices.find(sp => sp.id === fp.id);
      const objectiveId = fp.objective_id || specPractice?.objective_id || practiceObjectiveMap[fp.id || ''];
      const importance = importanceMap[objectiveId || ''] || 3;
      const isGap = fp.evidence_state === 'not_proven' || fp.evidence_state === 'none';
      const hasCritical = fp.has_critical || false;
      const hasCriticalFailure = hasCritical && isGap;

      // Critical failures force Strategic row
      const priorityRow = (hasCriticalFailure || importance >= 4) ? 'strategic' : 'operational';

      practices.push({
        ...fp,
        title: fp.title || specPractice?.title || fp.name || fp.id,
        objective_id: objectiveId,
        importance,
        priorityRow,
        maturity_level: fp.maturity_level || level.level,
      });
    });
  });

  // Get column config based on user level
  type ColumnConfig = { id: string; label: string; sublabel: string; levels: number[] };
  let columns: ColumnConfig[];
  if (userLevel === 1) {
    columns = [
      { id: 'col1', label: 'Level 1', sublabel: 'URGENT', levels: [1] },
      { id: 'col2', label: 'Level 2', sublabel: 'NEXT', levels: [2] },
      { id: 'col3', label: 'L3-4', sublabel: 'VISION', levels: [3, 4] },
    ];
  } else if (userLevel === 2) {
    columns = [
      { id: 'col1', label: 'L1-2', sublabel: 'URGENT', levels: [1, 2] },
      { id: 'col2', label: 'Level 3', sublabel: 'NEXT', levels: [3] },
      { id: 'col3', label: 'Level 4', sublabel: 'VISION', levels: [4] },
    ];
  } else {
    columns = [
      { id: 'col1', label: 'L1-2', sublabel: 'FOUNDATION', levels: [1, 2] },
      { id: 'col2', label: 'Level 3', sublabel: 'CURRENT', levels: [3] },
      { id: 'col3', label: 'Level 4', sublabel: 'NEXT', levels: [4] },
    ];
  }

  // Group into grid cells
  const grid: Record<string, Record<string, typeof practices>> = {
    strategic: {},
    operational: {},
  };
  columns.forEach(col => {
    grid.strategic[col.id] = [];
    grid.operational[col.id] = [];
  });

  practices.forEach(practice => {
    const column = columns.find(col => col.levels.includes(practice.maturity_level || 1));
    if (column) {
      grid[practice.priorityRow][column.id].push(practice);
    }
  });

  // Sort: gaps first
  const statusOrder: Record<string, number> = { 'not_proven': 0, 'none': 0, 'partial': 1, 'full': 2, 'proven': 2 };
  Object.keys(grid).forEach(row => {
    Object.keys(grid[row]).forEach(col => {
      grid[row][col].sort((a, b) => (statusOrder[a.evidence_state || 'none'] || 0) - (statusOrder[b.evidence_state || 'none'] || 0));
    });
  });

  // Build matrix HTML
  const buildCell = (items: typeof practices, isZoneA: boolean) => {
    if (items.length === 0) {
      return '<div class="matrix-cell-empty">-</div>';
    }
    return items.slice(0, 6).map(p => {
      const state = p.evidence_state;
      const colorClass = (state === 'full' || state === 'proven') ? 'practice-proven'
        : state === 'partial' ? 'practice-partial'
        : 'practice-gap';
      return `<div class="matrix-practice ${colorClass}">${escapeHtml(p.title || p.name || '')}</div>`;
    }).join('') + (items.length > 6 ? `<div class="matrix-more">+${items.length - 6} more</div>` : '');
  };

  const content = `
    <p class="slide-subtitle">Practices grouped by business priority and maturity stage. Focus on top-left first.</p>
    <div class="matrix-container">
      <div class="matrix-y-label">
        <div class="y-label-top">Strategic Focus</div>
        <div class="y-label-bottom">Operational</div>
      </div>
      <div class="matrix-grid-wrapper">
        <div class="matrix-header">
          ${columns.map((col, i) => `
            <div class="matrix-col-header ${i < 2 ? 'zone-urgent' : 'zone-vision'}">
              <div class="col-label">${col.label}</div>
              <div class="col-sublabel">${col.sublabel}</div>
            </div>
          `).join('')}
        </div>
        <div class="matrix-row matrix-row-strategic">
          ${columns.map((col, i) => `
            <div class="matrix-cell ${i < 2 ? 'zone-a' : 'zone-b'}">
              ${buildCell(grid.strategic[col.id], i < 2)}
            </div>
          `).join('')}
        </div>
        <div class="matrix-row matrix-row-operational">
          ${columns.map(col => `
            <div class="matrix-cell zone-c">
              ${buildCell(grid.operational[col.id], false)}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    <div class="grid-legend">
      <span class="legend-item"><span class="legend-box practice-proven"></span> Proven</span>
      <span class="legend-item"><span class="legend-box practice-partial"></span> Partial</span>
      <span class="legend-item"><span class="legend-box practice-gap"></span> Gap</span>
    </div>
  `;

  return renderSlideWrapper({
    title,
    content,
    slideNumber,
    footerData: { timestamp, sessionId: runId.slice(0, 8) },
    logoSrc: LOGO_HORIZONTAL_BASE64,
  });
}

/**
 * Build Projected Impact slide HTML
 */
function buildProjectedImpactSlide(input: GenerateReportInput, slideNumber: string): string {
  const { overallScore, maturityLevel, actions, timestamp, runId, customizations } = input;
  const title = customizations?.slide_titles?.projected_impact || DEFAULT_TITLES.projected_impact;
  const levelName = MATURITY_LABELS[maturityLevel] || 'Emerging';

  // Calculate projected score
  const improvement = Math.min(actions.length * 3, 25);
  const projectedScore = Math.min(overallScore + improvement, 100);

  // Timeline distribution
  const sixMonth = actions.filter(a => a.timeline === '6m').length;
  const twelveMonth = actions.filter(a => a.timeline === '12m').length;
  const twentyFourMonth = actions.filter(a => a.timeline === '24m').length;

  // Determine level progression message
  const nextLevel = maturityLevel + 1;
  const nextLevelName = MATURITY_LABELS[nextLevel];
  const levelProgressMsg = maturityLevel < 4 && projectedScore >= 70
    ? `Progress toward <strong>Level ${nextLevel}: ${nextLevelName}</strong>`
    : `Strengthen your <strong>Level ${maturityLevel}: ${levelName}</strong> foundation`;

  const content = `
    <div class="projection-grid">
      <div class="projection-score-block">
        <div class="score-comparison">
          <div class="score-current">
            <div class="score-value">${overallScore}%</div>
            <div class="score-label">Current</div>
          </div>
          <div class="score-arrow">
            <span class="arrow-line"></span>
            <span class="improvement-badge">+${improvement}%</span>
          </div>
          <div class="score-projected">
            <div class="score-value score-green">${projectedScore}%</div>
            <div class="score-label">Projected</div>
          </div>
        </div>
        <div class="score-bar-container">
          <div class="score-bar">
            <div class="bar-current" style="width: ${overallScore}%"></div>
            <div class="bar-improvement" style="left: ${overallScore}%; width: ${improvement}%"></div>
          </div>
          <div class="score-scale">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>
      </div>

      <div class="projection-details">
        <div class="timeline-distribution">
          <div class="timeline-title">Action Timeline</div>
          <div class="timeline-bars">
            <div class="timeline-item">
              <div class="timeline-count">${sixMonth}</div>
              <div class="timeline-bar">
                <div class="bar-fill bar-6m" style="width: ${Math.min(100, sixMonth * 15)}%"></div>
              </div>
              <div class="timeline-period">6 months</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-count">${twelveMonth}</div>
              <div class="timeline-bar">
                <div class="bar-fill bar-12m" style="width: ${Math.min(100, twelveMonth * 15)}%"></div>
              </div>
              <div class="timeline-period">12 months</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-count">${twentyFourMonth}</div>
              <div class="timeline-bar">
                <div class="bar-fill bar-24m" style="width: ${Math.min(100, twentyFourMonth * 15)}%"></div>
              </div>
              <div class="timeline-period">24 months</div>
            </div>
          </div>
        </div>

        <div class="projection-insight">
          <div class="insight-icon">📈</div>
          <div class="insight-text">
            Completing <strong>${actions.length} action${actions.length !== 1 ? 's' : ''}</strong> could help you ${levelProgressMsg}
          </div>
        </div>
      </div>
    </div>
  `;

  return renderSlideWrapper({
    title,
    content,
    slideNumber,
    footerData: { timestamp, sessionId: runId.slice(0, 8) },
    logoSrc: LOGO_HORIZONTAL_BASE64,
  });
}

/**
 * Build Objective Journey slide - Score journey table with milestones
 * Uses actual spec data instead of hardcoded mappings
 */
function buildObjectiveJourneySlide(input: GenerateReportInput, slideNumber: string): string {
  const { objectives = [], actions, criticalRisks = [], calibration, specPractices = [], specObjectives = [], timestamp, runId, customizations } = input;
  const title = customizations?.slide_titles?.objective_journey || DEFAULT_TITLES.objective_journey;
  const importanceMap = calibration?.importance_map || {};

  // Build dynamic mappings from spec data
  const objectivesOrder = buildObjectivesOrder(specObjectives);
  const practiceObjectiveMap = buildPracticeObjectiveMap(specPractices);

  // Build objective data with journey projections
  const objectiveData = objectives.map(obj => {
    const objId = obj.id || obj.objective_id || '';
    const score = Math.round(obj.score || 0);
    const importance = importanceMap[objId] || 3;
    // Get theme from objectivesOrder (derived from specObjectives)
    const objConfig = objectivesOrder.find(o => o.id === objId);
    const theme = objConfig?.theme || 'Intelligence';
    const name = obj.objective_name || obj.title || obj.name || objConfig?.shortTitle || objId;

    // Determine status
    let status = 'opportunity';
    if (score >= 80) status = 'strength';
    else if (score < 40 || criticalRisks.some(r => r.objective_id === objId)) status = 'critical';

    // Count actions by timeline for this objective using dynamic mapping
    const objActions = actions.filter(a => {
      const practiceObjId = practiceObjectiveMap[a.practice_id || ''];
      return practiceObjId === objId;
    });
    const actions6m = objActions.filter(a => a.timeline === '6m').length;
    const actions12m = objActions.filter(a => a.timeline === '12m').length;
    const actions24m = objActions.filter(a => a.timeline === '24m').length;

    // Project scores (simplified: each action adds ~10% to objective)
    const totalQuestions = 6; // Approximate
    const at6m = Math.min(100, score + Math.round((actions6m / totalQuestions) * 100));
    const at12m = Math.min(100, at6m + Math.round((actions12m / totalQuestions) * 100));
    const at24m = Math.min(100, at12m + Math.round((actions24m / totalQuestions) * 100));

    // Level mapping
    const scoreToLevel = (s: number) => s >= 85 ? 4 : s >= 65 ? 3 : s >= 40 ? 2 : 1;
    const currentLevel = scoreToLevel(score);
    const targetLevel = scoreToLevel(at24m);

    return {
      id: objId,
      name,
      theme,
      importance,
      today: score,
      at6m,
      at12m,
      at24m,
      currentLevel,
      targetLevel,
      actionCount: objActions.length,
      status,
    };
  });

  // Group by theme
  const themes = ['Foundation', 'Future', 'Intelligence'];
  const byTheme: Record<string, typeof objectiveData> = {};
  themes.forEach(t => { byTheme[t] = []; });
  objectiveData.forEach(obj => {
    if (byTheme[obj.theme]) {
      byTheme[obj.theme].push(obj);
    }
  });

  // Build table HTML
  const buildJourneyBar = (value: number, label: string, color: string) => {
    const textColor = value >= 80 ? 'color-green' : value < 40 ? 'color-red' : '';
    return `
      <div class="journey-milestone">
        <div class="milestone-value ${textColor}">${value}%</div>
        <div class="milestone-bar"><div class="milestone-fill" style="width: ${value}%; background: ${color};"></div></div>
        <div class="milestone-label">${label}</div>
      </div>
    `;
  };

  const buildImportanceDots = (level: number) => {
    return Array(5).fill(0).map((_, i) =>
      `<span class="importance-dot ${i < level ? 'filled' : ''}"></span>`
    ).join('');
  };

  let tableRows = '';
  themes.forEach(theme => {
    const objs = byTheme[theme] || [];
    if (objs.length === 0) return;

    // Theme header
    tableRows += `<tr class="theme-row"><td colspan="6">${theme}</td></tr>`;

    // Objective rows
    objs.forEach(obj => {
      const statusClass = obj.status === 'critical' ? 'status-critical' : obj.status === 'strength' ? 'status-strength' : 'status-opportunity';
      const statusLabel = obj.status === 'critical' ? 'Critical Fix' : obj.status === 'strength' ? 'Strength' : 'Opportunity';

      tableRows += `
        <tr class="${obj.status === 'critical' ? 'row-critical' : ''}">
          <td class="col-objective">${escapeHtml(obj.name)}</td>
          <td class="col-importance"><div class="importance-dots">${buildImportanceDots(obj.importance)}</div></td>
          <td class="col-journey">
            <div class="journey-container">
              ${buildJourneyBar(obj.today, 'Today', '#64748b')}
              <span class="journey-arrow">→</span>
              ${buildJourneyBar(obj.at6m, '6m', '#60a5fa')}
              <span class="journey-arrow">→</span>
              ${buildJourneyBar(obj.at12m, '12m', '#3b82f6')}
              <span class="journey-arrow">→</span>
              ${buildJourneyBar(obj.at24m, '24m', '#2563eb')}
            </div>
          </td>
          <td class="col-level">
            <span class="level-badge level-current">L${obj.currentLevel}</span>
            <span class="level-arrow">→</span>
            <span class="level-badge level-target">L${obj.targetLevel}</span>
          </td>
          <td class="col-actions">${obj.actionCount || '-'}</td>
          <td class="col-status"><span class="status-badge ${statusClass}">${statusLabel}</span></td>
        </tr>
      `;
    });
  });

  const content = `
    <table class="journey-table">
      <thead>
        <tr>
          <th class="col-objective">Objective</th>
          <th class="col-importance">Importance</th>
          <th class="col-journey">Score Journey</th>
          <th class="col-level">Level Journey</th>
          <th class="col-actions">Actions</th>
          <th class="col-status">Status</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;

  return renderSlideWrapper({
    title,
    content,
    slideNumber,
    footerData: { timestamp, sessionId: runId.slice(0, 8) },
    logoSrc: LOGO_HORIZONTAL_BASE64,
  });
}

/**
 * Build committed actions slides (paginated, max 8 per slide)
 */
function buildCommittedActionsSlides(input: GenerateReportInput): string[] {
  const { actions, customizations, timestamp, runId } = input;
  const baseTitle = customizations?.slide_titles?.committed_actions || DEFAULT_TITLES.committed_actions;
  const actionsPerPage = 8;

  if (actions.length === 0) {
    const content = `
      <div class="coming-soon">
        <div class="coming-soon-title">No Actions Committed</div>
        <div class="coming-soon-subtitle">Return to the Action Planning tab to commit actions</div>
      </div>
    `;
    return [renderSlideWrapper({
      title: baseTitle,
      content,
      slideNumber: '{{slideNumber}}',
      footerData: { timestamp, sessionId: runId.slice(0, 8) },
      logoSrc: LOGO_HORIZONTAL_BASE64,
    })];
  }

  // Chunk actions into pages
  const pages: ActionPlan[][] = [];
  for (let i = 0; i < actions.length; i += actionsPerPage) {
    pages.push(actions.slice(i, i + actionsPerPage));
  }

  return pages.map((pageActions, pageIndex) => {
    const pageNum = pageIndex + 1;
    const title = pages.length > 1
      ? `${baseTitle} (${pageNum}/${pages.length})`
      : baseTitle;

    const actionsHtml = pageActions.map((action, idx) => {
      const label = customizations?.action_labels?.[action.question_id] || action.label || action.question_text || 'Action item';
      const timeline = action.timeline || '-';
      const owner = action.owner || '-';
      const practice = action.practice_name || '-';

      return `
        <tr>
          <td class="col-practice">${escapeHtml(practice)}</td>
          <td class="col-action">${escapeHtml(label)}</td>
          <td class="col-timeline">${escapeHtml(timeline)}</td>
          <td class="col-owner">${escapeHtml(owner)}</td>
        </tr>
      `;
    }).join('');

    // Timeline summary
    const sixMonth = actions.filter(a => a.timeline === '6m').length;
    const twelveMonth = actions.filter(a => a.timeline === '12m').length;
    const twentyFourMonth = actions.filter(a => a.timeline === '24m').length;

    const content = `
      <table class="actions-table">
        <thead>
          <tr>
            <th class="col-practice">Practice</th>
            <th class="col-action">Action</th>
            <th class="col-timeline">Timeline</th>
            <th class="col-owner">Owner</th>
          </tr>
        </thead>
        <tbody>
          ${actionsHtml}
        </tbody>
      </table>
      <div class="actions-summary">
        <span class="summary-item"><strong>${sixMonth}</strong> in 6 months</span>
        <span class="summary-item"><strong>${twelveMonth}</strong> in 12 months</span>
        <span class="summary-item"><strong>${twentyFourMonth}</strong> in 24 months</span>
        <span class="summary-total"><strong>${actions.length}</strong> total actions</span>
      </div>
    `;

    return renderSlideWrapper({
      title,
      content,
      slideNumber: '{{slideNumber}}',
      footerData: { timestamp, sessionId: runId.slice(0, 8) },
      logoSrc: LOGO_HORIZONTAL_BASE64,
    });
  });
}

/**
 * Build complete PDF HTML
 */
export function buildReportHtml(input: GenerateReportInput): string {
  const slides: string[] = [];
  const showKeyMessages = input.customizations?.slide_visibility?.key_messages !== false;

  // Slide 1: Cover (always included)
  slides.push(buildCoverSlide(input, '{{slideNumber}}'));

  // Slide 2: Key Messages (conditional, Under Construction for now)
  if (showKeyMessages) {
    slides.push(buildKeyMessagesSlide(input, '{{slideNumber}}'));
  }

  // Slide 3: Objectives & Practices (9-column grid)
  slides.push(buildObjectivesPracticesSlide(input, '{{slideNumber}}'));

  // Slide 4: Priority Matrix (BCG-style)
  slides.push(buildPriorityMatrixSlide(input, '{{slideNumber}}'));

  // Slide 5: Projected Impact
  slides.push(buildProjectedImpactSlide(input, '{{slideNumber}}'));

  // Slide 6: Objective Journey (score journey table)
  slides.push(buildObjectiveJourneySlide(input, '{{slideNumber}}'));

  // Slide 7+: Committed Actions (paginated)
  const actionSlides = buildCommittedActionsSlides(input);
  slides.push(...actionSlides);

  // Replace slide number placeholders
  const totalSlides = slides.length;
  const numberedSlides = slides.map((slideHtml, index) => {
    return slideHtml.replace(/\{\{slideNumber\}\}/g, `${index + 1} / ${totalSlides}`);
  });

  return wrapInHtmlDocument(numberedSlides.join('\n'));
}

/**
 * Generate PDF using DocRaptor API
 */
export async function generatePdf(input: GenerateReportInput): Promise<Buffer> {
  const apiKey = process.env.DOCRAPTOR_API_KEY;

  if (!apiKey) {
    throw new Error('DOCRAPTOR_API_KEY environment variable not set');
  }

  const html = buildReportHtml(input);

  const isTestMode = process.env.DOCRAPTOR_TEST_MODE === 'true' || process.env.NODE_ENV !== 'production';

  console.log(`[PDF] Generating Executive Report for run ${input.runId.slice(0, 8)} (test mode: ${isTestMode})`);

  const response = await fetch('https://api.docraptor.com/docs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_credentials: apiKey,
      doc: {
        name: `executive-report-${input.runId.slice(0, 8)}.pdf`,
        document_type: 'pdf',
        document_content: html,
        test: isTestMode,
        prince_options: {
          media: 'print',
          baseurl: 'https://cfo-lens.com',
          page_size: 'A4 landscape',
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DocRaptor API error: ${response.status} - ${errorText}`);
  }

  const pdfBuffer = Buffer.from(await response.arrayBuffer());
  console.log(`[PDF] Generated ${pdfBuffer.length} bytes`);

  return pdfBuffer;
}

export default { buildReportHtml, generatePdf };
