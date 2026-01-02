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
