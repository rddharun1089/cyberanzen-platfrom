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
          darkest: '#030A16',
          bg: '#061329',
          bgSecondary: '#08172B',
          card: '#07182B',
          elevated: '#0B1D38',
          surface: '#102746',
          blue: '#087FFF',
          cyan: '#00CFFF',
          text: '#F2F7FF',
          muted: '#A9BCD6',
          border: '#18385E',
          red: '#FF2448',
          success: '#20C997',
          warning: '#F5B942',
          error: '#FF2448',
          purple: '#8B5CF6'
        },
        forensic: {
          950: '#030A16',
          900: '#061329',
          850: '#07182B',
          800: '#0B1D38',
          700: '#18385E',
          cyan: '#00CFFF',
          emerald: '#20C997',
          amber: '#F5B942',
          crimson: '#FF2448',
          muted: '#A9BCD6'
        }
      },
      fontFamily: {
        horror: ['Creepster', 'cursive', 'sans-serif'],
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        handwriting: ['Caveat', 'cursive'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
