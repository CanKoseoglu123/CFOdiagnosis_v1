/**
 * VS-44: PDF HTML Templates
 * Core template functions for Executive Report PDF generation
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
    }

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

    .slide-title {
      font-size: ${fonts.sizeTitle};
      font-weight: 600;
      color: ${colors.header};
      margin-bottom: 10mm;
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

    /* Status colors */
    .status-proven { background-color: ${colors.proven}; color: white; }
    .status-partial { background-color: ${colors.partial}; color: white; }
    .status-gap { background-color: ${colors.gap}; color: white; }

    /* Status badges */
    .badge-strength { background-color: ${colors.strength}; color: white; }
    .badge-opportunity { background-color: ${colors.opportunity}; color: white; }
    .badge-critical { background-color: ${colors.criticalFix}; color: white; }

    /* Cover slide */
    .slide-cover {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .company-name {
      font-size: ${fonts.sizeLarge};
      color: ${colors.textLight};
      margin-bottom: 10mm;
    }

    .cover-title {
      font-size: ${fonts.sizeCoverTitle};
      font-weight: 700;
      color: ${colors.header};
      margin-bottom: 5mm;
    }

    .cover-subtitle {
      font-size: 18pt;
      color: ${colors.text};
      margin-bottom: 15mm;
    }

    .cover-date {
      font-size: ${fonts.sizeMedium};
      color: ${colors.textLight};
    }

    .cover-branding {
      position: absolute;
      bottom: 15mm;
      right: 20mm;
    }

    .logo-text {
      font-size: ${fonts.sizeLarge};
      font-weight: 700;
      color: ${colors.header};
      letter-spacing: 0.02em;
    }

    /* Summary cards */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 5mm;
    }

    .summary-card {
      background: ${colors.bgCard};
      padding: 5mm;
      text-align: center;
    }

    .summary-value {
      font-size: 28pt;
      font-weight: 700;
      color: ${colors.primary};
    }

    .summary-label {
      font-size: ${fonts.sizeSmall};
      color: ${colors.textLight};
      text-transform: uppercase;
      margin-top: 2mm;
    }

    /* Tables */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${fonts.sizeSmall};
    }

    .data-table th {
      background: ${colors.header};
      color: white;
      padding: 3mm;
      text-align: left;
      font-weight: 600;
    }

    .data-table td {
      padding: 2.5mm 3mm;
      border-bottom: 1px solid ${colors.border};
    }

    .data-table tr:nth-child(even) {
      background: #f9fafb;
    }

    /* Progress bars */
    .progress-bar {
      height: 8px;
      background: ${colors.border};
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: ${colors.primary};
      border-radius: 4px;
    }

    /* Messages grid */
    .messages-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 5mm;
    }

    .message-card {
      padding: 5mm;
      background: ${colors.bgLight};
      border-radius: 2mm;
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

    /* Coming soon placeholder */
    .coming-soon {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      text-align: center;
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

    /* Action items */
    .action-row {
      display: flex;
      align-items: center;
      padding: 3mm 4mm;
      border-bottom: 1px solid ${colors.border};
    }

    .action-row:nth-child(even) {
      background: ${colors.bgLight};
    }

    .action-text {
      flex: 1;
      font-size: ${fonts.sizeNormal};
    }

    .action-timeline {
      width: 15mm;
      text-align: center;
      font-size: ${fonts.sizeSmall};
      color: ${colors.textLight};
    }

    .action-owner {
      width: 35mm;
      text-align: right;
      font-size: ${fonts.sizeSmall};
      color: ${colors.textLight};
    }

    /* Matrix placeholder */
    .matrix-placeholder {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    .matrix-grid {
      width: 200mm;
      height: 130mm;
      border: 2px solid ${colors.border};
      position: relative;
    }

    .matrix-label {
      position: absolute;
      font-size: ${fonts.sizeSmall};
      color: ${colors.textLight};
    }

    .matrix-label-top {
      top: -6mm;
      left: 50%;
      transform: translateX(-50%);
    }

    .matrix-label-left {
      left: -15mm;
      top: 50%;
      transform: rotate(-90deg) translateX(-50%);
    }

    /* Cover slide badges */
    .cover-badges {
      display: flex;
      gap: 8mm;
      margin-top: 10mm;
    }

    .badge-level {
      background: ${colors.primary};
      color: white;
      padding: 3mm 6mm;
      font-size: ${fonts.sizeMedium};
      font-weight: 600;
    }

    .badge-score {
      background: ${colors.accent};
      color: white;
      padding: 3mm 6mm;
      font-size: ${fonts.sizeMedium};
      font-weight: 600;
    }

    /* Executive Summary - Objectives list */
    .objectives-list {
      margin-top: 8mm;
    }

    .objective-row {
      display: flex;
      align-items: center;
      padding: 3mm 0;
      border-bottom: 1px solid ${colors.border};
    }

    .objective-name {
      width: 50%;
      font-size: ${fonts.sizeNormal};
      color: ${colors.text};
    }

    .objective-bar {
      flex: 1;
      height: 12px;
      background: ${colors.border};
      border-radius: 6px;
      overflow: hidden;
      margin: 0 4mm;
    }

    .objective-fill {
      height: 100%;
      background: ${colors.primary};
      border-radius: 6px;
    }

    .objective-score {
      width: 12mm;
      text-align: right;
      font-size: ${fonts.sizeNormal};
      font-weight: 600;
      color: ${colors.primary};
    }

    /* Maturity Footprint Grid */
    .footprint-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4mm;
      margin-bottom: 6mm;
    }

    .footprint-level {
      background: ${colors.bgLight};
      padding: 4mm;
      border: 1px solid ${colors.border};
    }

    .level-label {
      font-size: ${fonts.sizeMedium};
      font-weight: 600;
      color: ${colors.header};
      margin-bottom: 3mm;
      text-align: center;
      padding-bottom: 2mm;
      border-bottom: 2px solid ${colors.primary};
    }

    .level-practices {
      display: flex;
      flex-wrap: wrap;
      gap: 2mm;
      margin-bottom: 3mm;
    }

    .practice-box {
      width: 8mm;
      height: 8mm;
      border-radius: 1mm;
    }

    .practice-box.proven {
      background: ${colors.proven};
    }

    .practice-box.partial {
      background: ${colors.partial};
    }

    .practice-box.gap {
      background: ${colors.gap};
    }

    .level-counts {
      font-size: ${fonts.sizeSmall};
      color: ${colors.textLight};
      text-align: center;
    }

    .footprint-legend {
      display: flex;
      justify-content: center;
      gap: 8mm;
      padding: 4mm;
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
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }

    .legend-box.proven {
      background: ${colors.proven};
    }

    .legend-box.partial {
      background: ${colors.partial};
    }

    .legend-box.gap {
      background: ${colors.gap};
    }

    /* Strengths & Gaps slide */
    .insights-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6mm;
    }

    .insights-section {
      background: ${colors.bgLight};
      padding: 5mm;
      border: 1px solid ${colors.border};
    }

    .section-title {
      font-size: ${fonts.sizeMedium};
      font-weight: 600;
      color: ${colors.header};
      margin-bottom: 4mm;
      padding-bottom: 2mm;
      border-bottom: 2px solid ${colors.strength};
    }

    .section-title.improvements {
      border-bottom-color: ${colors.opportunity};
    }

    .section-title.critical {
      border-bottom-color: ${colors.criticalFix};
    }

    .strengths-list, .improvements-list, .risks-list {
      list-style: none;
    }

    .strength-item, .improvement-item, .risk-item {
      padding: 2mm 0;
      font-size: ${fonts.sizeNormal};
      color: ${colors.text};
      border-bottom: 1px solid ${colors.border};
    }

    .strength-item:last-child, .improvement-item:last-child, .risk-item:last-child {
      border-bottom: none;
    }

    .strength-item::before {
      content: "\\2713 ";
      color: ${colors.strength};
      font-weight: bold;
    }

    .improvement-item::before {
      content: "\\25B2 ";
      color: ${colors.opportunity};
    }

    .risk-item::before {
      content: "\\26A0 ";
      color: ${colors.criticalFix};
    }

    .critical-section {
      grid-column: 1 / -1;
      background: #fef2f2;
      border-color: ${colors.criticalFix};
    }

    /* Projected Impact slide */
    .projection-hero {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20mm;
      padding: 15mm 0;
    }

    .projection-current, .projection-target {
      text-align: center;
    }

    .projection-value {
      font-size: 48pt;
      font-weight: 700;
    }

    .projection-current .projection-value {
      color: ${colors.textLight};
    }

    .projection-target .projection-value {
      color: ${colors.strength};
    }

    .projection-label {
      font-size: ${fonts.sizeMedium};
      color: ${colors.textLight};
      margin-top: 2mm;
    }

    .projection-arrow {
      font-size: 36pt;
      color: ${colors.primary};
    }

    .progress-bar-large {
      height: 24px;
      background: ${colors.border};
      border-radius: 12px;
      overflow: hidden;
      margin: 10mm 0;
      position: relative;
    }

    .progress-current {
      height: 100%;
      background: ${colors.textLight};
      position: absolute;
      left: 0;
      top: 0;
    }

    .progress-improvement {
      height: 100%;
      background: ${colors.strength};
      position: absolute;
      top: 0;
    }

    .timeline-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 5mm;
      margin-top: 8mm;
    }

    .timeline-card {
      background: ${colors.bgCard};
      padding: 4mm;
      text-align: center;
    }

    .timeline-period {
      font-size: ${fonts.sizeMedium};
      font-weight: 600;
      color: ${colors.header};
    }

    .timeline-count {
      font-size: ${fonts.sizeLarge};
      font-weight: 700;
      color: ${colors.primary};
      margin: 2mm 0;
    }

    .timeline-label {
      font-size: ${fonts.sizeSmall};
      color: ${colors.textLight};
    }

    /* Action items header */
    .action-header {
      display: flex;
      background: ${colors.header};
      color: white;
      font-weight: 600;
      font-size: ${fonts.sizeSmall};
    }

    .action-header-text {
      flex: 1;
      padding: 3mm 4mm;
    }

    .action-header-timeline {
      width: 15mm;
      padding: 3mm;
      text-align: center;
    }

    .action-header-owner {
      width: 35mm;
      padding: 3mm 4mm;
      text-align: right;
    }

    /* Action priority badge */
    .action-priority {
      display: inline-block;
      padding: 1mm 2mm;
      font-size: 8pt;
      font-weight: 600;
      border-radius: 2px;
      margin-right: 2mm;
    }

    .priority-high {
      background: ${colors.criticalFix};
      color: white;
    }

    .priority-medium {
      background: ${colors.opportunity};
      color: white;
    }

    .priority-low {
      background: ${colors.textLight};
      color: white;
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
  additionalClass?: string;
}): string {
  const { title, content, slideNumber, footerData, additionalClass = '' } = params;

  return `
    <div class="slide ${additionalClass}">
      <div class="slide-number">${slideNumber}</div>
      <h1 class="slide-title">${escapeHtml(title)}</h1>
      <div class="slide-content">
        ${content}
      </div>
      <div class="slide-footer">
        Generated: ${formatTimestamp(footerData.timestamp)} | Session: ${footerData.sessionId}
      </div>
    </div>
  `;
}
