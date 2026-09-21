/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        devhub: {
          // Canvas & Surfaces
          bg: '#0d1117',
          subtle: '#010409',
          surface: '#161b22',
          surfaceHover: '#1c2128',
          surfaceActive: '#21262d',

          // Structural Borders
          border: '#30363d',
          borderMuted: '#21262d',
          borderFocus: '#388bfd',

          // Typography Hierarchy
          textPrimary: '#f0f6fc',
          textSecondary: '#c9d1d9',
          textMuted: '#7d8590',

          // Brand & Telemetry Accents
          brand: '#388bfd',       // DevHub analytical blue
          brandHover: '#58a6ff',
          orange: '#e65100',      // Darker, richer logo brand orange
          orangeDark: '#c2410c',  // Deep burnt orange
          orangeHover: '#9a3412',
          action: '#238636',      // Primary execution green
          actionHover: '#2ea043',
          purple: '#bc8cff',
          amber: '#d29922',
          red: '#f85149',
          cyan: '#39c5bb',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Noto Sans"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        display: [
          '"Plus Jakarta Sans"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          '"SF Mono"',
          'Menlo',
          'Consolas',
          '"Liberation Mono"',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};
