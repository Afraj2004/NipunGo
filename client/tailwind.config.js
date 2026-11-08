// Brand palette taken from the NipunGo logo: deep blue + orange.
// `indigo` is re-pointed at the brand blue so every existing indigo-* class on the site
// becomes on-brand without touching each file. `primary` is the main action colour.
const blue = {
  50: '#EEF3FF',
  100: '#DCE6FF',
  200: '#BDD0FF',
  300: '#8FADFF',
  400: '#5C84F5',
  500: '#3A63E0',
  600: '#2549C4',
  700: '#1B3AA0',
  800: '#172F80',
  900: '#112561',
  950: '#0A1740',
};

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        primary: { DEFAULT: '#2549C4', ...blue },
        indigo: blue,
        // a touch deeper than the logo orange so it stays readable as text on white
        secondary: {
          DEFAULT: '#EA580C',
          50: '#FFF4EC',
          100: '#FFE6D2',
          200: '#FFCBA3',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.05), 0 1px 3px rgba(16,24,40,.08)',
        lift: '0 10px 30px -8px rgba(16,24,40,.18)',
      },
    },
  },
  plugins: [],
};
