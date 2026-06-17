import type { Config } from 'tailwindcss';

/** Calm, trustworthy, premium palette via CSS variables (see globals.css). */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '1.5rem', screens: { '2xl': '1280px' } },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          muted: 'hsl(var(--sidebar-muted))',
        },
      },
      backgroundImage: {
        hero: 'linear-gradient(180deg, hsl(var(--hero-from)), hsl(var(--hero-to)))',
        'brand-gradient': 'linear-gradient(135deg, #5B5BEF 0%, #9D8DF1 100%)',
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 4px)' },
      fontFamily: {
        sans: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -8px rgba(91, 91, 239, 0.18)',
        card: '0 2px 16px -4px rgba(17, 24, 39, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
