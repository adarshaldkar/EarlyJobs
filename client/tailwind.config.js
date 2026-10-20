/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '8px',
      },
      colors: {
        canvas: '#FAFAF9',       // Warm off-white background
        surface: '#FFFFFF',      // Flat card & table surface
        subtle: '#E7E5E4',       // Crisp 1px border color (stone-200)
        ink: {
          primary: '#1C1917',    // Deep stone text (stone-900)
          secondary: '#78716C',  // Muted metadata text (stone-500)
          tertiary: '#A8A29E',   // Light tertiary text (stone-400)
        },
        accent: {
          DEFAULT: '#0F766E',    // Deep teal accent
          hover: '#115E59',      // Darker teal on hover
          light: '#F0FDFA',      // Tint for highlights
          ring: '#0F766E',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
