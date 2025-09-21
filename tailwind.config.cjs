/******************************************************
 Tailwind CSS Configuration
******************************************************/
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './node_modules/primevue/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#00AEEF',
          yellow: '#FFD400',
          red: '#FF4B55',
          green: '#2ECC71',
          orange: '#FF8C42',
          white: '#FFFFFF'
        }
      }
    }
  },
  plugins: []
};
