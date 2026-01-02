/**
 * VS-44: Executive Report PDF Generator
 * Uses DocRaptor Cloud PDF API to generate boardroom-ready PDFs
 */

import { wrapInHtmlDocument, renderSlideWrapper, escapeHtml, formatDate, formatTimestamp } from './templates';
import { REPORT_THEME } from './theme';

interface ActionPlan {
  question_id: string;
  question_text?: string;
  timeline?: string;
  owner?: string;
  status?: string;
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
}

const DEFAULT_TITLES = {
  cover: 'FP&A Maturity Assessment',
  key_messages: 'Key Messages',
  summary: 'Executive Summary',
  committed_actions: 'Committed Actions',
};

/**
 * Build cover slide HTML
 */
function buildCoverSlide(input: GenerateReportInput, slideNumber: string): string {
  const { companyName, customizations, timestamp, runId } = input;
  const title = customizations?.slide_titles?.cover || DEFAULT_TITLES.cover;

  return `
    <div class="slide slide-cover">
      <div class="slide-number">${slideNumber}</div>
      <div class="cover-content">
        <div class="company-name">${escapeHtml(companyName || 'Your Company')}</div>
        <h1 class="cover-title">${escapeHtml(title)}</h1>
        <div class="cover-subtitle">Executive Report</div>
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
 * Build summary slide HTML
 */
function buildSummarySlide(input: GenerateReportInput, slideNumber: string): string {
  const { overallScore, maturityLevel, actions, timestamp, runId, customizations } = input;
  const title = customizations?.slide_titles?.summary || DEFAULT_TITLES.summary;

  const maturityLabels: Record<number, string> = {
    1: 'Emerging',
    2: 'Defined',
    3: 'Managed',
    4: 'Optimized',
  };

  const content = `
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-value">${overallScore}%</div>
        <div class="summary-label">Overall Score</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">L${maturityLevel}</div>
        <div class="summary-label">${maturityLabels[maturityLevel] || 'Emerging'}</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${actions.length}</div>
        <div class="summary-label">Committed Actions</div>
      </div>
    </div>
    <div style="margin-top: 10mm;">
      <h2 style="font-size: 14pt; color: ${REPORT_THEME.colors.header}; margin-bottom: 5mm;">Action Timeline</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-value">${actions.filter(a => a.timeline === '6m').length}</div>
          <div class="summary-label">Next 6 Months</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${actions.filter(a => a.timeline === '12m').length}</div>
          <div class="summary-label">6-12 Months</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${actions.filter(a => a.timeline === '24m').length}</div>
          <div class="summary-label">12-24 Months</div>
        </div>
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
 * Build key messages slide (optional)
 */
function buildKeyMessagesSlide(input: GenerateReportInput, slideNumber: string): string | null {
  const { customizations, timestamp, runId } = input;

  // Skip if not visible or no content
  if (!customizations?.slide_visibility?.key_messages) {
    return null;
  }

  const keyMessages = customizations?.key_messages;
  if (!keyMessages?.messages?.length) {
    return null;
  }

  const title = customizations?.slide_titles?.key_messages || DEFAULT_TITLES.key_messages;

  const messagesHtml = keyMessages.messages.map(msg => `
    <div class="message-card">
      <h3>${escapeHtml(msg.title)}</h3>
      <p>${escapeHtml(msg.body)}</p>
    </div>
  `).join('');

  const content = `
    <h2 style="font-size: 16pt; color: ${REPORT_THEME.colors.header}; margin-bottom: 6mm;">
      ${escapeHtml(keyMessages.headline || 'Key Insights')}
    </h2>
    <div class="messages-grid">
      ${messagesHtml}
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
 * Build committed actions slides (paginated)
 */
function buildCommittedActionsSlides(input: GenerateReportInput, startSlideNumber: number): string[] {
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
      const label = customizations?.action_labels?.[action.question_id] || action.question_text || 'Action item';
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

    const content = `
      <div style="margin-bottom: 4mm;">
        <div class="action-row" style="background: ${REPORT_THEME.colors.header}; color: white; font-weight: 600;">
          <div class="action-text">Action Item</div>
          <div class="action-timeline">Timeline</div>
          <div class="action-owner">Owner</div>
        </div>
        ${actionsHtml}
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
 * Build complete PDF HTML
 */
export function buildReportHtml(input: GenerateReportInput): string {
  const slides: string[] = [];

  // Slide 1: Cover (always included)
  slides.push(buildCoverSlide(input, '{{slideNumber}}'));

  // Slide 2: Summary (always included)
  slides.push(buildSummarySlide(input, '{{slideNumber}}'));

  // Slide 3: Key Messages (optional)
  const keyMessagesSlide = buildKeyMessagesSlide(input, '{{slideNumber}}');
  if (keyMessagesSlide) {
    slides.push(keyMessagesSlide);
  }

  // Slide 4+: Committed Actions (paginated)
  const actionSlides = buildCommittedActionsSlides(input, slides.length + 1);
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
