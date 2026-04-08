import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#22c55e',
          600: '#16a34a',
        },
      },
    },
  },
  plugins: [],
};

export default config;
