/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#DEDBC8",
        brand: {
          primary: "#0F172A",
          secondary: "#1E293B",
          accent: "#2563EB",
          bg: "#F8FAFC",
          card: "#FFFFFF",
          text: "#0F172A",
          muted: "#64748B",
          success: "#16A34A",
          warning: "#F59E0B",
          error: "#DC2626",
        },
        dark: {
          bg: "#0B0F19",
          card: "#161E2E",
          text: "#F1F5F9",
          muted: "#94A3B8"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'serif'],
      },
    },
  },
  plugins: [],
}
