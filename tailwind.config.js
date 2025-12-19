/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F1117',
        'background-secondary': '#161921',
        'background-panel': '#1E212A',
        accent: '#4F8BFF',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A0A5B1',
      },
      borderRadius: {
        xl: '10px',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px 0 rgba(0,0,0,0.10)',
      },
      transitionProperty: {
        'bg': 'background-color',
        'spacing': 'margin, padding',
      },
    },
  },
  plugins: [],
};
