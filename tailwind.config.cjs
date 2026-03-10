/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
      },
      boxShadow: {
        float: '0 20px 50px rgba(0, 0, 0, 0.38)',
        candy: '0 14px 30px rgba(202, 164, 84, 0.18)',
        glow: '0 0 30px rgba(113, 171, 145, 0.14)',
      },
      colors: {
        cream: '#0b120f',
        cloud: '#172019',
        ink: '#efe3bf',
        plum: '#6f8160',
        lilac: '#1a241f',
        blush: '#20332b',
        berry: '#d7b36a',
        sky: '#78b8a7',
        mint: '#7f9b63',
        butter: '#f0d48b',
        peach: '#c9833f',
        shell: '#131b16',
      },
      backgroundImage: {
        confetti:
          'radial-gradient(circle at 18% 18%, rgba(215, 179, 106, 0.15), transparent 20%), radial-gradient(circle at 80% 16%, rgba(120, 184, 167, 0.16), transparent 22%), radial-gradient(circle at 50% 82%, rgba(127, 155, 99, 0.12), transparent 26%), linear-gradient(180deg, rgba(11,18,15,0.98), rgba(14,22,18,0.98))',
        sprinkles:
          'radial-gradient(circle at 1px 1px, rgba(215, 179, 106, 0.12) 1px, transparent 0)',
      },
    },
  },
  plugins: [],
};
