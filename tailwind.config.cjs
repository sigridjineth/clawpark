/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Display: Ndot57 (openclaw brand font)
        display: ['Ndot57', '"JetBrains Mono"', '"SFMono-Regular"', 'monospace'],
        // Mono: JetBrains Mono (body text)
        mono: ['"JetBrains Mono"', '"SFMono-Regular"', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
        // Sans: Inter fallback
        sans: ['Inter', '"Segoe UI"', 'Arial', 'sans-serif'],
        body: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        float: '0 20px 50px rgba(0, 0, 0, 0.5)',
      },
      colors: {
        // Retained for Import.tsx error state
        danger: '#C41E3A',
        // Retained for any legacy references
        jungle: {
          800: '#142318',
        },
        bone: {
          DEFAULT: '#F5F0E1',
          dim: '#C8BFA5',
        },
        amber: {
          DEFAULT: '#D4A537',
        },
        fern: '#5A8A4A',
      },
    },
  },
  plugins: [],
};
