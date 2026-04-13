/** @type {import('tailwindcss').Config} */
const accent = 'rgb(var(--accent) / <alpha-value>)'
const accent2 = 'rgb(var(--accent-2) / <alpha-value>)'
const paper = 'rgb(var(--paper) / <alpha-value>)'
const paper2 = 'rgb(var(--paper-2) / <alpha-value>)'
const paper3 = 'rgb(var(--paper-3) / <alpha-value>)'
const ink = 'rgb(var(--ink) / <alpha-value>)'
const ink2 = 'rgb(var(--ink-2) / <alpha-value>)'
const ink3 = 'rgb(var(--ink-3) / <alpha-value>)'
const rule = 'rgb(var(--rule) / <alpha-value>)'
const rule2 = 'rgb(var(--rule-2) / <alpha-value>)'
const danger = 'rgb(var(--danger) / <alpha-value>)'
const dangerDim = 'rgb(var(--danger-dim) / <alpha-value>)'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces Variable"', 'Fraunces', 'Iowan Old Style', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      colors: {
        paper, 'paper-2': paper2, 'paper-3': paper3,
        ink, 'ink-2': ink2, 'ink-3': ink3,
        rule, 'rule-2': rule2,
        accent, 'accent-2': accent2,
        danger, 'danger-dim': dangerDim,

        // Legacy remap — pages use `bg-slate-50 dark:bg-zinc-950` throughout;
        // both sides map to the same CSS vars which flip on `html.dark`, so
        // the whole UI adopts the new palette with zero source edits.
        slate: {
          50: paper, 100: paper2, 200: paper2, 300: rule, 400: ink3,
          500: ink3, 600: ink2, 700: ink2, 800: ink, 900: ink, 950: ink,
        },
        zinc: {
          50: ink, 100: ink, 200: ink2, 300: ink2, 400: ink3, 500: ink3,
          600: ink3, 700: rule2, 800: rule, 900: paper2, 950: paper,
        },
        emerald: {
          300: accent2, 400: accent2, 500: accent, 600: accent, 700: accent,
        },
        red: {
          300: dangerDim, 400: dangerDim, 500: danger, 600: danger, 700: danger,
        },
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'page-in': {
          '0%':   { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'ink-bleed': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up':   'fade-up 260ms cubic-bezier(.2,.6,.2,1) both',
        'page-in':   'page-in 200ms cubic-bezier(.2,.6,.2,1) both',
        'ink-bleed': 'ink-bleed 400ms ease-out both',
      },
      boxShadow: {
        letterpress:       '0 1px 0 rgba(0,0,0,.04), 0 8px 22px -10px rgb(var(--ink) / .18), 0 2px 4px -2px rgb(var(--ink) / .08)',
        'letterpress-hover':'0 1px 0 rgba(0,0,0,.04), 0 14px 30px -10px rgb(var(--ink) / .26), 0 4px 6px -2px rgb(var(--ink) / .12)',
        seal: 'inset 0 0 0 1px rgb(var(--rule) / .8)',
      },
    },
  },
  plugins: [],
}
