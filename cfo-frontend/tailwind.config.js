/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#172B4D',
        slate: {
          DEFAULT: '#42526E',
          50: '#F8F9FA',
          100: '#F4F5F7',
          200: '#EBECF0',
          300: '#DFE1E6',
          400: '#C1C7D0',
          500: '#6B778C',
        },
        primary: {
          DEFAULT: '#0052CC',
          hover: '#0747A6',
          light: '#DEEBFF',
        },
        status: {
          green: {
            text: '#006644',
            bg: '#E3FCEF',
            border: '#ABF5D1'
          },
          yellow: {
            text: '#FF991F',
            bg: '#FFFAE6',
            border: '#FFE380'
          },
          red: {
            text: '#DE350B',
            bg: '#FFEBE6',
            border: '#FFBDAD'
          },
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        sm: '2px',  // Sharp corners for Gartner style
      }
    }
  },
  plugins: [],
}
