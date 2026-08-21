/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'maply-celeste': '#AEE1F9',
        'maply-azul': '#8EC5FC',
        'maply-violeta': '#B39DDB',
        'maply-lila': '#D9C6F2',
        'maply-bg': '#F7F8FC',
        'maply-ink': '#1B1F2E',
        'maply-muted': '#5B6478',
        'maply-card-border': '#E3E7F1',
      },
    },
  },
  plugins: [],
};
