/**
 * VS-44: PDF HTML Templates
 * Core template functions for Executive Report PDF generation
 * Premium consultant quality - McKinsey/BCG/Bain style
 */

import { REPORT_THEME } from './theme';

const { colors, fonts, spacing } = REPORT_THEME;

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

/**
 * Format date for cover slide
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Wrap slides in complete HTML document
 */
export function wrapInHtmlDocument(slidesHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: ${fonts.family};
      background: white;
      color: ${colors.text};
      line-height: 1.4;
    }

    /* ═══════════════════════════════════════════════════════════════════════════
     * SLIDE BASE
     * ═══════════════════════════════════════════════════════════════════════════ */

    .slide {
      width: ${spacing.slide.width};
      height: ${spacing.slide.height};
      padding: ${spacing.slide.padding};
      page-break-after: always;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .slide:last-child {
      page-break-after: avoid;
    }

    .slide-number {
      position: absolute;
      top: 8mm;
      right: 15mm;
      font-size: ${fonts.sizeSmall};
      color: ${colors.textLight};
    }

    .slide-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 6mm;
      padding-bottom: 4mm;
      border-bottom: 1px solid ${colors.border};
    }

    .slide-logo {
      height: 12mm;
      object-fit: contain;
    }

    .slide-title {
      font-size: ${fonts.sizeTitle};
      font-weight: 600;
      color: ${colors.header};
      text-align: right;
    }

    .slide-subtitle {
      font-size: ${fonts.sizeNormal};
      color: ${colors.textLight};
      margin-bottom: 4mm;
    }

    .slide-content {
      flex: 1;
      overflow: hidden;
    }

    .slide-footer {
      position: absolute;
      bottom: 8mm;
      right: 15mm;
      font-size: 8pt;
      color: ${colors.footer};
    }

    /* ═══════════════════════════════════════════════════════════════════════════
     * COVER SLIDE
     * ═══════════════════════════════════════════════════════════════════════════ */

    .slide-cover {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .cover-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
    }

    .cover-logo {
      margin-bottom: 15mm;
    }

    .logo-large {
      height: 50mm;
      object-fit: contain;
    }

    .cover-company {
      font-size: ${fonts.sizeLarge};
      color: ${colors.textLight};
      margin-bottom: 8mm;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .cover-title {
      font-size: ${fonts.sizeCoverTitle};
      font-weight: 700;
      color: ${colors.header};
      margin-bottom: 8mm;
    }

    .cover-date {
      font-size: ${fonts.sizeMedium};
      color: ${colors.textLight};
    }

    .cover-divider {
      position: absolute;
      bottom: 20mm;
      left: 20mm;
      right: 20mm;
      height: 1px;
      background: ${colors.border};
    }

    /* ═══════════════════════════════════════════════════════════════════════════
     * COMING SOON / UNDER CONSTRUCTION
     * ═══════════════════════════════════════════════════════════════════════════ */

    .coming-soon {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      text-align: center;
    }

    .coming-soon-icon {
      font-size: 48pt;
      margin-bottom: 5mm;
    }

    .coming-soon-title {
      font-size: ${fonts.sizeTitle};
      color: ${colors.textLight};
      margin-bottom: 5mm;
    }

    .coming-soon-subtitle {
      font-size: ${fonts.sizeMedium};
      color: ${colors.textLight};
    }

    /* Key Messages */
    .key-messages-headline {
      font-size: 18pt;
      font-weight: 600;
      color: ${colors.header};
      margin-bottom: 8mm;
      text-align: center;
    }

    .messages-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 5mm;
    }

    .message-card {
      padding: 5mm;
      background: ${colors.bgLight};
      border-left: 3px solid ${colors.primary};
    }

    .message-card h3 {
      font-size: ${fonts.sizeMedium};
      font-weight: 600;
      color: ${colors.header};
      margin-bottom: 2mm;
    }

    .message-card p {
      font-size: ${fonts.sizeNormal};
      color: ${colors.text};
      line-height: 1.4;
    }

    /* ═══════════════════════════════════════════════════════════════════════════
     * OBJECTIVES & PRACTICES GRID (9-column)
     * ═══════════════════════════════════════════════════════════════════════════ */

    .objectives-grid {
      display: flex;
      gap: 2mm;
      margin-bottom: 4mm;
    }

    .objective-column {
      flex: 1;
      min-width: 0;
      background: ${colors.bgLight};
      border: 1px solid ${colors.border};
    }

    .objective-header {
      background: ${colors.header};
      color: white;
      padding: 2mm;
      text-align: center;
      position: relative;
      min-height: 12mm;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .objective-title {
      font-size: 8pt;
      font-weight: 600;
      line-height: 1.2;
      padding-right: 8mm;
    }

    .objective-score {
      position: absolute;
      top: 0;
      right: 0;
      width: 7mm;
      height: 7mm;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 7pt;
      font-weight: 700;
      border-bottom-left-radius: 2mm;
    }

    .score-high { background: ${colors.strength}; color: white; }
    .score-medium { background: ${colors.opportunity}; color: white; }
    .score-low { background: ${colors.criticalFix}; color: white; }

    .practices-stack {
      padding: 1.5mm;
      display: flex;
      flex-direction: column;
      gap: 1mm;
    }

    .practice-box {
      padding: 1.5mm;
      font-size: 7pt;
      line-height: 1.2;
      text-align: center;
      color: white;
      border-radius: 1px;
    }

    .practice-proven { background: ${colors.proven}; }
    .practice-partial { background: ${colors.partial}; }
    .practice-gap { background: ${colors.gap}; }

    .no-practices {
      font-size: 8pt;
      color: ${colors.textLight};
      text-align: center;
      padding: 3mm;
    }

    .grid-legend {
      display: flex;
      justify-content: center;
      gap: 6mm;
      padding: 3mm;
      background: ${colors.bgCard};
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 2mm;
      font-size: ${fonts.sizeSmall};
      color: ${colors.text};
    }

    .legend-box {
      width: 10px;
      height: 10px;
      border-radius: 1px;
    }

    /* ═══════════════════════════════════════════════════════════════════════════
     * PRIORITY MATRIX (BCG-style)
     * ═══════════════════════════════════════════════════════════════════════════ */

    .matrix-container {
      display: flex;
      gap: 4mm;
      margin-bottom: 4mm;
    }

    .matrix-y-label {
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      width: 12mm;
      text-align: center;
    }

    .y-label-top, .y-label-bottom {
      font-size: 8pt;
      font-weight: 600;
      color: ${colors.textLight};
      writing-mode: vertical-rl;
      text-orientation: mixed;
      transform: rotate(180deg);
    }

    .matrix-grid-wrapper {
      flex: 1;
    }

    .matrix-header {
      display: flex;
      gap: 2mm;
      margin-bottom: 2mm;
    }

    .matrix-col-header {
      flex: 1;
      text-align: center;
      padding: 2mm;
      border-radius: 2px;
    }

    .zone-urgent { background: #fef2f2; }
    .zone-vision { background: #eff6ff; }

    .col-label {
      font-size: 9pt;
      font-weight: 600;
      color: ${colors.header};
    }

    .col-sublabel {
      font-size: 7pt;
      color: ${colors.textLight};
      text-transform: uppercase;
    }

    .matrix-row {
      display: flex;
      gap: 2mm;
      margin-bottom: 2mm;
    }

    .matrix-cell {
      flex: 1;
      min-height: 50mm;
      padding: 2mm;
      border: 1px solid ${colors.border};
    }

    .zone-a { background: #fef2f2; }
    .zone-b { background: #eff6ff; }
    .zone-c { background: ${colors.bgLight}; }

    .matrix-cell-empty {
      font-size: 9pt;
      color: ${colors.textLight};
      text-align: center;
      padding: 10mm;
    }

    .matrix-practice {
      padding: 1.5mm;
      margin-bottom: 1mm;
      font-size: 7pt;
      line-height: 1.2;
      color: white;
      border-radius: 1px;
    }

    .matrix-more {
      font-size: 7pt;
      color: ${colors.textLight};
      text-align: center;
      padding: 1mm;
    }

    /* ═══════════════════════════════════════════════════════════════════════════
     * PROJECTED IMPACT
     * ═══════════════════════════════════════════════════════════════════════════ */

    .projection-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 8mm;
    }

    .projection-score-block {
      background: ${colors.bgLight};
      padding: 6mm;
      border: 1px solid ${colors.border};
    }

    .score-comparison {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15mm;
      margin-bottom: 6mm;
    }

    .score-current, .score-projected {
      text-align: center;
    }

    .score-value {
      font-size: 36pt;
      font-weight: 700;
      color: ${colors.textLight};
    }

    .score-green {
      color: ${colors.strength};
    }

    .score-label {
      font-size: ${fonts.sizeSmall};
      color: ${colors.textLight};
      text-transform: uppercase;
      margin-top: 1mm;
    }

    .score-arrow {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2mm;
    }

    .arrow-line {
      font-size: 24pt;
      color: ${colors.primary};
    }

    .arrow-line::before {
      content: "→";
    }

    .improvement-badge {
      background: ${colors.strength};
      color: white;
      padding: 2mm 4mm;
      font-size: ${fonts.sizeMedium};
      font-weight: 700;
      border-radius: 2px;
    }

    .score-bar-container {
      padding-top: 4mm;
    }

    .score-bar {
      height: 16px;
      background: ${colors.border};
      border-radius: 8px;
      position: relative;
      overflow: hidden;
    }

    .bar-current {
      height: 100%;
      background: ${colors.textLight};
      position: absolute;
      left: 0;
      top: 0;
    }

    .bar-improvement {
      height: 100%;
      background: ${colors.strength};
      position: absolute;
      top: 0;
    }

    .score-scale {
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: ${colors.textLight};
      margin-top: 2mm;
    }

    .projection-details {
      display: flex;
      flex-direction: column;
      gap: 4mm;
    }

    .timeline-distribution {
      background: ${colors.bgLight};
      padding: 4mm;
      border: 1px solid ${colors.border};
    }

    .timeline-title {
      font-size: ${fonts.sizeMedium};
      font-weight: 600;
      color: ${colors.header};
      margin-bottom: 4mm;
    }

    .timeline-bars {
      display: flex;
      flex-direction: column;
      gap: 3mm;
    }

    .timeline-item {
      display: flex;
      align-items: center;
      gap: 3mm;
    }

    .timeline-count {
      width: 8mm;
      font-size: ${fonts.sizeMedium};
      font-weight: 700;
      color: ${colors.primary};
      text-align: right;
    }

    .timeline-bar {
      flex: 1;
      height: 8px;
      background: ${colors.border};
      border-radius: 4px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 4px;
    }

    .bar-6m { background: #3b82f6; }
    .bar-12m { background: #2563eb; }
    .bar-24m { background: #1d4ed8; }

    .timeline-period {
      width: 18mm;
      font-size: ${fonts.sizeSmall};
      color: ${colors.textLight};
    }

    .projection-insight {
      background: ${colors.bgCard};
      padding: 4mm;
      border-left: 3px solid ${colors.primary};
      display: flex;
      gap: 3mm;
      align-items: flex-start;
    }

    .insight-icon {
      font-size: 18pt;
    }

    .insight-text {
      font-size: ${fonts.sizeNormal};
      color: ${colors.text};
      line-height: 1.5;
    }

    /* ═══════════════════════════════════════════════════════════════════════════
     * OBJECTIVE JOURNEY TABLE
     * ═══════════════════════════════════════════════════════════════════════════ */

    .journey-table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${fonts.sizeSmall};
    }

    .journey-table th {
      background: ${colors.header};
      color: white;
      padding: 2.5mm;
      text-align: left;
      font-weight: 600;
      font-size: 8pt;
    }

    .journey-table td {
      padding: 2mm 2.5mm;
      border-bottom: 1px solid ${colors.border};
      vertical-align: middle;
    }

    .journey-table .theme-row td {
      background: ${colors.bgLight};
      font-weight: 600;
      font-size: 8pt;
      color: ${colors.header};
      text-transform: uppercase;
      padding: 2mm 2.5mm;
    }

    .journey-table .row-critical {
      border-left: 2px solid ${colors.criticalFix};
    }

    .col-objective { width: 22%; }
    .col-importance { width: 10%; text-align: center; }
    .col-journey { width: 38%; }
    .col-level { width: 12%; text-align: center; }
    .col-actions { width: 8%; text-align: center; }
    .col-status { width: 10%; text-align: center; }

    .importance-dots {
      display: flex;
      justify-content: center;
      gap: 1px;
    }

    .importance-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${colors.border};
    }

    .importance-dot.filled {
      background: ${colors.header};
    }

    .journey-container {
      display: flex;
      align-items: center;
      gap: 1mm;
    }

    .journey-milestone {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 11mm;
    }

    .milestone-value {
      font-size: 8pt;
      font-weight: 600;
      color: ${colors.text};
    }

    .milestone-value.color-green { color: ${colors.strength}; }
    .milestone-value.color-red { color: ${colors.criticalFix}; }

    .milestone-bar {
      width: 100%;
      height: 4px;
      background: ${colors.border};
      border-radius: 2px;
      overflow: hidden;
      margin: 1mm 0;
    }

    .milestone-fill {
      height: 100%;
      border-radius: 2px;
    }

    .milestone-label {
      font-size: 6pt;
      color: ${colors.textLight};
    }

    .journey-arrow {
      font-size: 8pt;
      color: ${colors.textLight};
    }

    .level-badge {
      display: inline-block;
      padding: 1mm 2mm;
      font-size: 7pt;
      font-weight: 600;
      border-radius: 2px;
    }

    .level-current {
      background: ${colors.bgCard};
      color: ${colors.text};
    }

    .level-target {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .level-arrow {
      font-size: 7pt;
      color: ${colors.textLight};
      margin: 0 1mm;
    }

    .status-badge {
      font-size: 7pt;
      font-weight: 500;
    }

    .status-strength { color: ${colors.strength}; }
    .status-opportunity { color: ${colors.opportunity}; }
    .status-critical { color: ${colors.criticalFix}; font-weight: 600; }

    /* ═══════════════════════════════════════════════════════════════════════════
     * COMMITTED ACTIONS TABLE
     * ═══════════════════════════════════════════════════════════════════════════ */

    .actions-table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${fonts.sizeSmall};
      margin-bottom: 4mm;
    }

    .actions-table th {
      background: ${colors.header};
      color: white;
      padding: 3mm;
      text-align: left;
      font-weight: 600;
    }

    .actions-table td {
      padding: 2.5mm 3mm;
      border-bottom: 1px solid ${colors.border};
    }

    .actions-table tr:nth-child(even) {
      background: ${colors.bgLight};
    }

    .actions-table .col-practice { width: 20%; }
    .actions-table .col-action { width: 50%; }
    .actions-table .col-timeline { width: 15%; text-align: center; }
    .actions-table .col-owner { width: 15%; text-align: center; }

    .actions-summary {
      display: flex;
      justify-content: center;
      gap: 8mm;
      padding: 4mm;
      background: ${colors.bgCard};
      font-size: ${fonts.sizeSmall};
      color: ${colors.text};
    }

    .summary-item strong {
      color: ${colors.primary};
    }

    .summary-total {
      border-left: 1px solid ${colors.border};
      padding-left: 8mm;
    }

    .summary-total strong {
      color: ${colors.header};
    }

    /* ═══════════════════════════════════════════════════════════════════════════
     * TEXT UTILITIES
     * ═══════════════════════════════════════════════════════════════════════════ */

    .text-muted {
      color: ${colors.textLight};
      font-style: italic;
    }

    strong {
      font-weight: 600;
    }
  </style>
</head>
<body>
  ${slidesHtml}
</body>
</html>
  `;
}

/**
 * Create a slide wrapper with header/footer
 */
export function renderSlideWrapper(params: {
  title: string;
  content: string;
  slideNumber: string;
  footerData: { timestamp: string; sessionId: string };
  logoSrc?: string;
  additionalClass?: string;
}): string {
  const { title, content, slideNumber, footerData, logoSrc, additionalClass = '' } = params;

  return `
    <div class="slide ${additionalClass}">
      <div class="slide-number">${slideNumber}</div>
      <div class="slide-header">
        ${logoSrc ? `<img src="${logoSrc}" class="slide-logo" alt="CFO Lens" />` : '<div></div>'}
        <h1 class="slide-title">${escapeHtml(title)}</h1>
      </div>
      <div class="slide-content">
        ${content}
      </div>
      <div class="slide-footer">
        Generated: ${formatTimestamp(footerData.timestamp)} | Session: ${footerData.sessionId}
      </div>
    </div>
  `;
}
