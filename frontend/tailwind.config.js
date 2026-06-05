/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7fa',
          100: '#e4ebf3',
          200: '#c2d2e3',
          300: '#90afcd',
          400: '#5886b1',
          500: '#386996',
          600: '#2a537a',
          700: '#224363',
          800: '#1d3953',
          900: '#183047',
          950: '#102031',
        }
      }
    },
  },
  plugins: [],
}
