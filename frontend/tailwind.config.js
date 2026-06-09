/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      colors: {
        primary: "#000511",
        secondary: "#6b38d4",
        background: "#faf9fc",
        surface: "#faf9fc",
        "on-surface": "#1a1c1e",
        "on-surface-variant": "#44474e",
        "surface-container-lowest": "#ffffff",
        "surface-container-high": "#e9e7eb",
        "outline-variant": "#c4c6cf",
        error: "#ba1a1a",
      },

      spacing: {
        "sidebar-expanded": "320px",
      },
    },
  },
  plugins: [],
}