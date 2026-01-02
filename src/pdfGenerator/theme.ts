/**
 * VS-44: Report Theme Constants
 * Colors and styles matching the existing UI exactly
 */

export const REPORT_THEME = {
  colors: {
    // Primary colors (matching Tailwind config)
    primary: '#1e3a5f',
    primaryHover: '#2d4a6f',
    accent: '#f59e0b',

    // Status colors (matching existing reports)
    proven: '#1e40af',      // Dark blue - fully achieved
    partial: '#0d9488',     // Teal - partially achieved
    gap: '#94a3b8',         // Slate - not achieved

    // Text colors
    header: '#1a365d',      // Navy for headers
    text: '#1f2937',        // Dark gray for body
    textLight: '#6b7280',   // Light gray for secondary
    footer: '#9CA3AF',      // Footer text

    // Status badges
    strength: '#059669',    // Green - strength
    opportunity: '#d97706', // Amber - opportunity
    criticalFix: '#dc2626', // Red - critical fix

    // Backgrounds
    bgLight: '#f8fafc',     // Light background
    bgCard: '#f0f4f8',      // Card background
    border: '#e5e7eb',      // Border color
  },

  fonts: {
    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    sizeSmall: '9pt',
    sizeNormal: '10pt',
    sizeMedium: '12pt',
    sizeLarge: '14pt',
    sizeTitle: '24pt',
    sizeCoverTitle: '36pt',
  },

  spacing: {
    slide: {
      width: '297mm',
      height: '210mm',
      padding: '15mm 20mm',
    }
  }
};

export default REPORT_THEME;
