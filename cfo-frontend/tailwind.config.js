/** @type {import('tailwindcss').Config} */
// Gartner Enterprise Design System
// Dense, data-heavy, print-friendly. Executive boardroom aesthetic.
// No soft shadows. No gradients. Sharp borders. High contrast.

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary text colors
        navy: {
          DEFAULT: '#172B4D',  // Dark Navy - Headlines, scores
          900: '#172B4D',
          800: '#1D3557',
          700: '#253D5B',
        },
        // Slate scale for text and backgrounds
        slate: {
          DEFAULT: '#42526E',  // Slate - Body text
          50: '#F8F9FA',       // Card headers
          100: '#F4F5F7',      // App background
          200: '#EBECF0',
          300: '#DFE1E6',      // Sharp gray - All borders
          400: '#C1C7D0',      // Darker - Emphasis borders
          500: '#6B778C',      // Muted - Secondary text, labels
        },
        // Primary action colors
        primary: {
          DEFAULT: '#0052CC',  // Gartner Blue - Buttons, links, active states
          50: '#E6F0FF',
          100: '#DEEBFF',
          500: '#0065FF',
          600: '#0052CC',
          700: '#0747A6',      // Darker blue - Hover state
          hover: '#0747A6',
          light: '#DEEBFF',
        },
        // Status colors (Muted, Professional)
        status: {
          green: {
            text: '#006644',
            bg: '#E3FCEF',
            border: '#ABF5D1',
          },
          yellow: {
            text: '#FF991F',
            bg: '#FFFAE6',
            border: '#FFE380',
          },
          red: {
            text: '#DE350B',
            bg: '#FFEBE6',
            border: '#FFBDAD',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        sm: '2px',  // Sharp corners for Gartner style
      },
      // Enterprise spacing scale (dense)
      spacing: {
        '18': '4.5rem',  // 72px
        '22': '5.5rem',  // 88px
      },
      // Max-width utilities for page containers
      maxWidth: {
        'page': '1152px',      // Default page container (6xl)
        'page-wide': '1280px', // Wide pages (7xl equivalent)
      },
    },
  },
  plugins: [],
}
