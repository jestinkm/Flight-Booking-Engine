/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B1F3A',
          50: '#EAF5FF',
          100: '#C5E0FF',
          200: '#8AC1FF',
          300: '#4FA2FF',
          400: '#2496ED',
          500: '#1A7DCA',
          600: '#1264A3',
          700: '#0D4B7C',
          800: '#083255',
          900: '#0B1F3A'
        },
        skyblue: {
          DEFAULT: '#2496ED',
          light: '#EAF5FF'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
