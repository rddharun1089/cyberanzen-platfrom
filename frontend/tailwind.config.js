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
