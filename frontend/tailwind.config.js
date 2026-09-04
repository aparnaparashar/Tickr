/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'navy-tailored': '#0F172A',
        'navy-slate': '#1E293B',
        'navy-deep': '#0A1128',
        'bronze-saddle': '#78350F',
        'bronze-amber': '#B45309',
        'bronze-chestnut': '#8D5B4C',
        'market-gain': '#15803D',
        'market-loss': '#991B1B',
        'surface': '#f8f9fc',
        'surface-card': '#FFFFFF',
        'surface-subtle': '#F4F5F8',
        'surface-container': '#edeef1',
        'surface-container-high': '#e7e8eb',
        'surface-container-low': '#f2f3f6',
        'canvas-alabaster': '#FBFBFC',
        'text-primary': '#0F172A',
        'text-secondary': '#475569',
        'text-tertiary': '#8A94A6',
        'error-container': '#ffdad6',
        'secondary-fixed': '#ffdbd0',
        'primary-container': '#131b2e',
        'on-primary-container': '#dae2fd',
      },
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        serif: ['Newsreader', 'Georgia', 'serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(15,23,42,0.04)',
        'card': '0 1px 6px rgba(15,23,42,0.06)',
        'hover': '0 4px 14px rgba(15,23,42,0.08)',
      },
    },
  },
  plugins: [],
};
