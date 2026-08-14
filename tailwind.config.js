/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.tsx',
    './screens/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  // Theme is driven by our own ThemeProvider (see lib/theme.tsx) through a
  // `vars()` provider, not NativeWind's colorScheme/`.dark` class toggle —
  // left as 'class' so no `dark:` variant can fire behind the provider's back.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary accent — independent of any other project's branding.
        accent: 'rgb(var(--accent) / <alpha-value>)',

        // Semantic surface/text tokens, backed by CSS variables in global.css.
        // Screens reference these names instead of raw slate/white/black shades.
        background: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        hairline: 'rgb(var(--hairline) / <alpha-value>)',
        body: 'rgb(var(--body) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        faint: 'rgb(var(--faint) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
