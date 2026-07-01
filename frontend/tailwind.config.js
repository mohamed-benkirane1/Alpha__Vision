/**
 * tailwind.config.js — Alpha Vision Design System
 *
 * NOTE: Ce projet utilise Tailwind CSS v4 (@tailwindcss/vite).
 * En v4, la configuration du thème est déclarée en CSS via la directive @theme
 * dans src/index.css. Ce fichier est maintenu pour la compatibilité
 * des outils IDE (autocomplete, lint). Les tokens actifs sont dans index.css.
 *
 * Référence CSS : src/index.css → bloc @theme
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // ── Colors — références aux CSS custom properties de :root ─────────────
      colors: {
        'app-bg':           'var(--app-bg)',
        'app-bg-deep':      'var(--app-bg-deep)',
        'app-bg-public':    'var(--app-bg-public)',
        'app-surface':      'var(--app-surface)',
        'app-surface-2':    'var(--app-surface-2)',
        'app-border':       'var(--app-border)',
        'app-text':         'var(--app-text)',
        'app-muted':        'var(--app-muted)',
        'app-muted-2':      'var(--app-muted-2)',
        'app-accent':       'var(--app-accent)',
        'app-accent-hover': 'var(--app-accent-hover)',
        'app-success':      'var(--app-success)',
        'app-danger':       'var(--app-danger)',
        'app-warning':      'var(--app-warning)',
        'app-info':         'var(--app-info)',
      },

      // ── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        'caption':    ['10px', { lineHeight: '14px', letterSpacing: '0.04em' }],
        'label':      ['11px', { lineHeight: '16px', letterSpacing: '0.06em' }],
        'body-sm':    ['12px', { lineHeight: '18px' }],
        'body':       ['14px', { lineHeight: '20px' }],
        'ui':         ['15px', { lineHeight: '22px' }],
        'heading-sm': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'heading':    ['22px', { lineHeight: '30px', fontWeight: '700' }],
        'display-sm': ['28px', { lineHeight: '36px', fontWeight: '800' }],
        'display':    ['36px', { lineHeight: '44px', fontWeight: '900' }],
        'display-lg': ['48px', { lineHeight: '56px', fontWeight: '900' }],
      },

      // ── Spacing ────────────────────────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },

      // ── Border radius ──────────────────────────────────────────────────────
      borderRadius: {
        'card': '14px',
        'pill': '9999px',
      },

      // ── Shadows ────────────────────────────────────────────────────────────
      boxShadow: {
        'card':         '0 4px 28px rgba(0,0,0,0.32)',
        'card-hover':   '0 8px 40px rgba(0,0,0,0.48)',
        'glow-rose':    '0 0 24px rgba(225,29,72,0.25)',
        'glow-rose-lg': '0 0 48px rgba(225,29,72,0.35)',
      },

      // ── Backdrop blur ──────────────────────────────────────────────────────
      backdropBlur: {
        'card': '24px',
      },
    },
  },
}
