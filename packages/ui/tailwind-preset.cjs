/**
 * Shared Tailwind preset — Glass / Soft-Futurism.
 * Tokens live in src/styles.css so light / dark / Telegram themes swap cleanly.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // neutrals
        background: 'hsl(var(--bg-canvas))',
        elevated: 'hsl(var(--bg-elevated))',
        grouped: 'hsl(var(--surface-grouped))',
        foreground: 'hsl(var(--text))',
        separator: 'hsl(var(--separator) / var(--separator-alpha))',
        border: 'hsl(var(--separator) / var(--separator-alpha))',
        input: 'hsl(var(--surface-grouped))',
        ring: 'hsl(var(--ring))',

        // system tints
        tint: {
          blue: 'hsl(var(--tint-blue))',
          green: 'hsl(var(--tint-green))',
          red: 'hsl(var(--tint-red))',
          orange: 'hsl(var(--tint-orange))',
          purple: 'hsl(var(--tint-purple))',
          pink: 'hsl(var(--tint-pink))',
          yellow: 'hsl(var(--tint-yellow))',
        },

        // semantic aliases
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        // `muted` is a TEXT role, not a surface — `text-muted` is the secondary
        // body colour. For a muted *surface* use `bg-grouped`. (Mapping DEFAULT
        // to --muted made text-muted paint --surface-grouped: near-invisible in
        // both themes.)
        muted: {
          DEFAULT: 'hsl(var(--muted-foreground) / var(--text-secondary-alpha))',
          foreground: 'hsl(var(--muted-foreground) / var(--text-secondary-alpha))',
        },
        subtle: 'hsl(var(--text-tertiary) / var(--text-tertiary-alpha))',
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: { DEFAULT: 'hsl(var(--success))', foreground: 'hsl(var(--success-foreground))' },
        warning: { DEFAULT: 'hsl(var(--warning))', foreground: 'hsl(var(--warning-foreground))' },
        card: { DEFAULT: 'hsl(var(--bg-elevated))', foreground: 'hsl(var(--text))' },
      },

      // Apple radii: inputs 10, controls 12, cards 14–16, sheets 20
      borderRadius: {
        sm: '8px',
        DEFAULT: '10px',
        md: '10px',
        lg: '12px',
        xl: '14px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '28px',
      },

      fontFamily: {
        sans: 'var(--font-text)',
        display: 'var(--font-display)',
        mono: 'var(--font-mono)',
      },

      // Apple HIG scale
      fontSize: {
        caption2: ['11px', { lineHeight: '1.28', letterSpacing: '0.005em' }],
        caption: ['12px', { lineHeight: '1.33', letterSpacing: '0' }],
        footnote: ['13px', { lineHeight: '1.38', letterSpacing: '-0.006em' }],
        subhead: ['15px', { lineHeight: '1.33', letterSpacing: '-0.01em' }],
        body: ['17px', { lineHeight: '1.29', letterSpacing: '-0.012em' }],
        title3: ['20px', { lineHeight: '1.25', letterSpacing: '-0.018em' }],
        title2: ['22px', { lineHeight: '1.27', letterSpacing: '-0.02em' }],
        title1: ['28px', { lineHeight: '1.21', letterSpacing: '-0.024em' }],
        large: ['34px', { lineHeight: '1.12', letterSpacing: '-0.026em' }],
        display: ['44px', { lineHeight: '1.08', letterSpacing: '-0.03em' }],
        hero: ['56px', { lineHeight: '1.05', letterSpacing: '-0.032em' }],
      },

      // 8pt base
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        11: '44px',
        14: '56px',
        20: '80px',
      },

      minHeight: { touch: '44px', dense: '28px' },
      minWidth: { touch: '44px', dense: '28px' },

      backdropBlur: { material: 'var(--blur)' },
      backdropSaturate: { material: 'var(--blur-sat)' },

      // Only chrome floating over content gets a shadow; never cards/buttons/inputs.
      boxShadow: {
        float: '0 4px 16px rgba(15, 15, 20, 0.08)',
        'inner-highlight': 'inset 0 1px 0 rgb(var(--material-highlight))',
        none: 'none',
      },

      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.32s cubic-bezier(0.32, 0.72, 0, 1) both',
        'fade-in': 'fade-in 0.2s ease-out both',
        // Same easing as the sheet's platform counterpart.
        'slide-up': 'slide-up 0.34s cubic-bezier(0.32, 0.72, 0, 1) both',
      },
    },
  },
  plugins: [],
};
