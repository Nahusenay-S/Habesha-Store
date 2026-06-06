/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        habesha: {
          gold: '#FFD700',
          red: '#CE1126',
          green: '#078930',
          blue: '#002395',
        },
      },
    },
  },
  plugins: [],
}