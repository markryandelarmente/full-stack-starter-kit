import { theme, plugins } from './src/tailwind-theme.js';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme,
  plugins,
};
