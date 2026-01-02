/**
 * VS-44: Executive Report PDF Generator
 * Uses DocRaptor Cloud PDF API to generate boardroom-ready PDFs
 */

import { wrapInHtmlDocument, renderSlideWrapper, escapeHtml, formatDate, formatTimestamp } from './templates';
import { REPORT_THEME } from './theme';

interface ActionPlan {
  question_id: string;
  question_text?: string;
  label?: string;
  timeline?: string;
  owner?: string;
  status?: string;
}

interface Objective {
  id?: string;
  objective_id?: string;
  objective_name?: string;
  title?: string;
  name?: string;
  score?: number;
}

interface Practice {
  id?: string;
  name?: string;
  practice_id?: string;
  evidence_state?: 'full' | 'partial' | 'none' | 'proven' | 'gap' | 'not_proven';
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
}

const DEFAULT_TITLES = {
  cover: 'FP&A Maturity Assessment',
  executive_summary: 'Executive Summary',
  maturity_footprint: 'Maturity Footprint',
  strengths_gaps: 'Strengths & Gaps',
  committed_actions: 'Committed Actions',
  projected_impact: 'Projected Impact',
};

const MATURITY_LABELS: Record<number, string> = {
  1: 'Emerging',
  2: 'Defined',
  3: 'Managed',
  4: 'Optimized',
};

/**
 * Build cover slide HTML
 */
function buildCoverSlide(input: GenerateReportInput, slideNumber: string): string {
  const { companyName, overallScore, maturityLevel, customizations, timestamp, runId } = input;
  const title = customizations?.slide_titles?.cover || DEFAULT_TITLES.cover;
  const levelName = MATURITY_LABELS[maturityLevel] || 'Emerging';

  return `
    <div class="slide slide-cover">
      <div class="slide-number">${slideNumber}</div>
      <div class="cover-content">
        <div class="company-name">${escapeHtml(companyName || 'Your Company')}</div>
        <h1 class="cover-title">${escapeHtml(title)}</h1>
        <div class="cover-subtitle">Executive Report</div>
        <div class="cover-badges">
          <span class="badge-level">Level ${maturityLevel}: ${levelName}</span>
          <span class="badge-score">Score: ${overallScore}%</span>
        </div>
        <div class="cover-date">${formatDate(timestamp)}</div>
      </div>
      <div class="cover-branding">
        <span class="logo-text">CFO Lens</span>
      </div>
      <div class="slide-footer">
        Generated: ${formatTimestamp(timestamp)} | Session: ${runId.slice(0, 8)}
      </div>
    </div>
  `;
}

/**
 * Build executive summary slide HTML
 */
function buildExecutiveSummarySlide(input: GenerateReportInput, slideNumber: string): string {
  const { overallScore, maturityLevel, actions, objectives = [], timestamp, runId, customizations } = input;
  const title = customizations?.slide_titles?.executive_summary || DEFAULT_TITLES.executive_summary;
  const levelName = MATURITY_LABELS[maturityLevel] || 'Emerging';

  // Build objectives progress bars
  const objectivesHtml = objectives.slice(0, 6).map(obj => {
    const name = obj.objective_name || obj.title || obj.name || 'Objective';
    const score = Math.round(obj.score || 0);
    return `
      <div class="objective-row">
        <div class="objective-name">${escapeHtml(name)}</div>
        <div class="objective-bar">
          <div class="objective-fill" style="width: ${score}%"></div>
        </div>
        <div class="objective-score">${score}%</div>
      </div>
    `;
  }).join('');

  const content = `
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-value">${overallScore}%</div>
        <div class="summary-label">Overall Score</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">L${maturityLevel}</div>
        <div class="summary-label">${levelName}</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${actions.length}</div>
        <div class="summary-label">Actions Planned</div>
      </div>
    </div>
    <div style="margin-top: 8mm;">
      <h2 style="font-size: 12pt; color: ${REPORT_THEME.colors.header}; margin-bottom: 4mm;">Objective Scores</h2>
      <div class="objectives-list">
        ${objectivesHtml || '<div class="text-muted">No objectives data available</div>'}
      </div>
    </div>
  `;

  return renderSlideWrapper({
    title,
    content,
    slideNumber,
    footerData: { timestamp, sessionId: runId.slice(0, 8) }
  });
}

/**
 * Build maturity footprint slide HTML
 */
function buildMaturityFootprintSlide(input: GenerateReportInput, slideNumber: string): string {
  const { maturityFootprint, timestamp, runId, customizations } = input;
  const title = customizations?.slide_titles?.maturity_footprint || DEFAULT_TITLES.maturity_footprint;
  const levels = maturityFootprint?.levels || [];

  let footprintHtml = '';

  if (levels.length > 0) {
    footprintHtml = levels.map(level => {
      const practices = level.practices || [];
      const fullCount = practices.filter(p => p.evidence_state === 'full' || p.evidence_state === 'proven').length;
      const partialCount = practices.filter(p => p.evidence_state === 'partial').length;
      const noneCount = practices.filter(p => p.evidence_state === 'none' || p.evidence_state === 'gap' || p.evidence_state === 'not_proven').length;

      const practiceBoxes = practices.slice(0, 10).map(p => {
        const state = p.evidence_state;
        const color = (state === 'full' || state === 'proven') ? REPORT_THEME.colors.proven
          : state === 'partial' ? REPORT_THEME.colors.partial
          : REPORT_THEME.colors.gap; // 'none', 'gap', or 'not_proven' all use gap color
        return `<div class="practice-box" style="background: ${color};" title="${escapeHtml(p.name || '')}"></div>`;
      }).join('');

      return `
        <div class="footprint-level">
          <div class="level-label">L${level.level} ${MATURITY_LABELS[level.level] || ''}</div>
          <div class="level-practices">${practiceBoxes}</div>
          <div class="level-counts">${fullCount}✓ ${partialCount}◐ ${noneCount}○</div>
        </div>
      `;
    }).join('');
  } else {
    footprintHtml = `
      <div class="coming-soon">
        <div class="coming-soon-subtitle">Practice evidence data not available</div>
      </div>
    `;
  }

  const content = `
    <p style="font-size: 10pt; color: ${REPORT_THEME.colors.textLight}; margin-bottom: 6mm;">
      Practice evidence across maturity levels
    </p>
    <div class="footprint-grid">
      ${footprintHtml}
    </div>
    <div class="footprint-legend">
      <span class="legend-item"><span class="legend-box" style="background: ${REPORT_THEME.colors.proven};"></span> Proven</span>
      <span class="legend-item"><span class="legend-box" style="background: ${REPORT_THEME.colors.partial};"></span> Partial</span>
      <span class="legend-item"><span class="legend-box" style="background: ${REPORT_THEME.colors.gap};"></span> Gap</span>
    </div>
  `;

  return renderSlideWrapper({
    title,
    content,
    slideNumber,
    footerData: { timestamp, sessionId: runId.slice(0, 8) }
  });
}

/**
 * Build strengths & gaps slide HTML
 */
function buildStrengthsGapsSlide(input: GenerateReportInput, slideNumber: string): string {
  const { objectives = [], criticalRisks = [], timestamp, runId, customizations } = input;
  const title = customizations?.slide_titles?.strengths_gaps || DEFAULT_TITLES.strengths_gaps;

  // Strengths (high-scoring objectives)
  const strengths = objectives.filter(o => (o.score || 0) >= 60).slice(0, 3);
  const strengthsHtml = strengths.length > 0
    ? strengths.map(obj => {
        const name = obj.objective_name || obj.title || obj.name || 'Objective';
        const score = Math.round(obj.score || 0);
        return `
          <div class="strength-item">
            <span class="strength-name">${escapeHtml(name)}</span>
            <span class="strength-score">${score}%</span>
          </div>
        `;
      }).join('')
    : '<div class="text-muted">No high-scoring objectives yet</div>';

  // Improvement areas (low-scoring objectives)
  const improvements = objectives.filter(o => (o.score || 0) < 40).slice(0, 3);
  const improvementsHtml = improvements.length > 0
    ? improvements.map(obj => {
        const name = obj.objective_name || obj.title || obj.name || 'Objective';
        const score = Math.round(obj.score || 0);
        return `
          <div class="improvement-item">
            <span class="improvement-name">${escapeHtml(name)}</span>
            <span class="improvement-score">${score}%</span>
          </div>
        `;
      }).join('')
    : '<div class="text-muted">All objectives above 40%</div>';

  // Critical risks
  const risksHtml = criticalRisks.length > 0
    ? criticalRisks.slice(0, 4).map(risk => {
        const riskTitle = risk.expert_action?.title || risk.title || risk.question_text || 'Critical gap';
        return `<div class="risk-item">${escapeHtml(riskTitle)}</div>`;
      }).join('')
    : '<div class="text-muted">No critical gaps identified</div>';

  const content = `
    <div class="insights-grid">
      <div class="insights-section">
        <h3 class="section-title section-title-green">✓ Key Strengths</h3>
        <div class="strengths-list">${strengthsHtml}</div>
      </div>
      <div class="insights-section">
        <h3 class="section-title section-title-amber">◎ Improvement Areas</h3>
        <div class="improvements-list">${improvementsHtml}</div>
      </div>
    </div>
    ${criticalRisks.length > 0 ? `
      <div class="critical-section">
        <h3 class="section-title section-title-red">⚠ Critical Gaps (${criticalRisks.length})</h3>
        <div class="risks-list">${risksHtml}</div>
      </div>
    ` : ''}
  `;

  return renderSlideWrapper({
    title,
    content,
    slideNumber,
    footerData: { timestamp, sessionId: runId.slice(0, 8) }
  });
}

/**
 * Build committed actions slides (paginated)
 */
function buildCommittedActionsSlides(input: GenerateReportInput): string[] {
  const { actions, customizations, timestamp, runId } = input;
  const baseTitle = customizations?.slide_titles?.committed_actions || DEFAULT_TITLES.committed_actions;
  const actionsPerPage = 10;

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
      footerData: { timestamp, sessionId: runId.slice(0, 8) }
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

    const actionsHtml = pageActions.map(action => {
      const label = customizations?.action_labels?.[action.question_id] || action.label || action.question_text || 'Action item';
      const timeline = action.timeline || '-';
      const owner = action.owner || '-';

      return `
        <div class="action-row">
          <div class="action-text">${escapeHtml(label)}</div>
          <div class="action-timeline">${escapeHtml(timeline)}</div>
          <div class="action-owner">${escapeHtml(owner)}</div>
        </div>
      `;
    }).join('');

    // Timeline summary
    const sixMonth = actions.filter(a => a.timeline === '6m').length;
    const twelveMonth = actions.filter(a => a.timeline === '12m').length;
    const twentyFourMonth = actions.filter(a => a.timeline === '24m').length;

    const content = `
      <div style="margin-bottom: 4mm;">
        <div class="action-row action-header">
          <div class="action-text">Action Item</div>
          <div class="action-timeline">Timeline</div>
          <div class="action-owner">Owner</div>
        </div>
        ${actionsHtml}
      </div>
      <div class="timeline-summary">
        <span>${sixMonth} in 6 months</span>
        <span>${twelveMonth} in 12 months</span>
        <span>${twentyFourMonth} in 24 months</span>
      </div>
    `;

    return renderSlideWrapper({
      title,
      content,
      slideNumber: '{{slideNumber}}',
      footerData: { timestamp, sessionId: runId.slice(0, 8) }
    });
  });
}

/**
 * Build projected impact slide HTML
 */
function buildProjectedImpactSlide(input: GenerateReportInput, slideNumber: string): string {
  const { overallScore, maturityLevel, actions, timestamp, runId, customizations } = input;
  const title = customizations?.slide_titles?.projected_impact || DEFAULT_TITLES.projected_impact;

  // Calculate projected score (simplified: each action adds ~3%, max 25% improvement)
  const improvement = Math.min(actions.length * 3, 25);
  const projectedScore = Math.min(overallScore + improvement, 100);

  const content = `
    <div class="projection-hero">
      <div class="projection-current">
        <div class="projection-value">${overallScore}%</div>
        <div class="projection-label">Current Score</div>
      </div>
      <div class="projection-arrow">
        <span class="arrow-icon">→</span>
        <span class="improvement-badge">+${improvement}%</span>
      </div>
      <div class="projection-target">
        <div class="projection-value projection-value-green">${projectedScore}%</div>
        <div class="projection-label">Projected Score</div>
      </div>
    </div>

    <div class="progress-section">
      <div class="progress-label">Score Progression</div>
      <div class="progress-bar-large">
        <div class="progress-current" style="width: ${overallScore}%"></div>
        <div class="progress-improvement" style="left: ${overallScore}%; width: ${improvement}%"></div>
      </div>
      <div class="progress-scale">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>

    <div class="projection-insight">
      Completing ${actions.length} action${actions.length !== 1 ? 's' : ''} could help you
      ${maturityLevel < 4 && projectedScore >= 70
        ? `<strong>progress toward Level ${maturityLevel + 1}</strong>`
        : `<strong>strengthen your Level ${maturityLevel} foundation</strong>`
      }
    </div>
  `;

  return renderSlideWrapper({
    title,
    content,
    slideNumber,
    footerData: { timestamp, sessionId: runId.slice(0, 8) }
  });
}

/**
 * Build complete PDF HTML
 */
export function buildReportHtml(input: GenerateReportInput): string {
  const slides: string[] = [];

  // Slide 1: Cover (always included)
  slides.push(buildCoverSlide(input, '{{slideNumber}}'));

  // Slide 2: Executive Summary
  slides.push(buildExecutiveSummarySlide(input, '{{slideNumber}}'));

  // Slide 3: Maturity Footprint
  slides.push(buildMaturityFootprintSlide(input, '{{slideNumber}}'));

  // Slide 4: Strengths & Gaps
  slides.push(buildStrengthsGapsSlide(input, '{{slideNumber}}'));

  // Slide 5+: Committed Actions (paginated)
  const actionSlides = buildCommittedActionsSlides(input);
  slides.push(...actionSlides);

  // Last Slide: Projected Impact
  slides.push(buildProjectedImpactSlide(input, '{{slideNumber}}'));

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
