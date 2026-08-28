/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#f9f6f0',
          100: '#efe9df',
          200: '#ddd0bc',
          300: '#c5b092',
          400: '#b0906b',
          500: '#9f7850',
          600: '#946645',
          700: '#7b5139',
          800: '#644331',
          900: '#51372a',
        },
        accent: {
          500: '#4caf50',
        }
      }
    },
  },
  plugins: [],
}
