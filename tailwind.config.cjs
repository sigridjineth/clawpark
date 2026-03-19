/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Ndot57', '"IBM Plex Mono"', 'monospace'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        body: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        float: '0 20px 50px rgba(0, 0, 0, 0.5)',
        amber: '0 8px 24px rgba(212, 165, 55, 0.15)',
        danger: '0 0 20px rgba(196, 30, 58, 0.3)',
        glow: '0 0 24px rgba(79, 121, 66, 0.18)',
      },
      colors: {
        // Jurassic Park palette
        jungle: {
          950: '#060E09',
          900: '#0D1A12',
          800: '#142318',
          700: '#1A3A2A',
          600: '#2A4A35',
          500: '#4F7942',
        },
        amber: {
          DEFAULT: '#D4A537',
          light: '#E8C96A',
          dark: '#A07D1E',
        },
        bone: {
          DEFAULT: '#F5F0E1',
          dim: '#C8BFA5',
          muted: '#8B8470',
        },
        danger: '#C41E3A',
        fern: '#5A8A4A',
        bark: '#4A3728',
      },
    },
  },
  plugins: [],
};
