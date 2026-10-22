/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#030B12',
          bgSecondary: '#061521',
          surface: '#071B28',
          cyan: '#00E5F0',
          teal: '#00BFCB',
          text: '#F2FAFF',
          muted: '#9BB3C2',
          border: '#123746',
          success: '#20D49A',
          warning: '#F5B942',
          error: '#FF5263'
        },
        forensic: {
          950: '#06090e',
          900: '#0b111a',
          850: '#101926',
          800: '#162234',
          700: '#1e3048',
          cyan: '#00f0ff',
          emerald: '#10b981',
          amber: '#f59e0b',
          crimson: '#ef4444',
          muted: '#8493a8'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
