/** @type {import('tailwindcss').Config} */
export default {
  prefix: 'afwt-',
  content: ['./src/**/*.{js,jsx,ts,tsx,css,scss}', './index.html'],
  theme: {
    extend: {
      colors: {},
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1280px',
    },
  },
  plugins: [],
};
