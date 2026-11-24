/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vynza: {
          purple: '#8B5CF6',
          dark: '#0F0F12',
          card: '#18181F',
          border: '#272732',
          muted: '#9CA3AF'
        }
      }
    },
  },
  plugins: [],
}
