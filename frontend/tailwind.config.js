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
          bg: '#061329',
          bgSecondary: '#08172B',
          card: '#0B1D38',
          surface: '#102746',
          blue: '#087FFF',
          cyan: '#00CFFF',
          text: '#F2F7FF',
          muted: '#A9BCD6',
          border: '#18385E',
          success: '#20C997',
          warning: '#F5B942',
          error: '#FF5263',
          purple: '#8B5CF6'
        },
        forensic: {
          950: '#061329',
          900: '#08172B',
          850: '#0B1D38',
          800: '#102746',
          700: '#18385E',
          cyan: '#00CFFF',
          emerald: '#20C997',
          amber: '#F5B942',
          crimson: '#FF5263',
          muted: '#A9BCD6'
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
