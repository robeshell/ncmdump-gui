/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,css}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'SF Pro Display',
          'Helvetica Neue',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif',
        ],
      },
      colors: {
        apple: {
          bg: '#F5F5F7',
          surface: '#FFFFFF',
          elevated: '#FFFFFF',
          border: 'rgba(0, 0, 0, 0.08)',
          separator: 'rgba(0, 0, 0, 0.06)',
          label: '#1D1D1F',
          secondary: '#86868B',
          tertiary: '#AEAEB2',
          blue: '#0071E3',
          'blue-hover': '#0077ED',
          'blue-pressed': '#006EDB',
          green: '#34C759',
          orange: '#FF9F0A',
          red: '#FF3B30',
          fill: 'rgba(120, 120, 128, 0.12)',
          'fill-secondary': 'rgba(120, 120, 128, 0.08)',
        },
      },
      boxShadow: {
        toolbar: '0 1px 2px rgba(0, 0, 0, 0.04)',
        panel: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
      },
      borderRadius: {
        apple: '10px',
        'apple-sm': '8px',
        'apple-lg': '12px',
      },
    },
  },
  plugins: [],
}
