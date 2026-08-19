/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sarvam: {
          bg: "#FAFAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
          dark: "#090D16",
          accent: "#10B981", // Emerald accent
          indigo: "#4F46E5", // Deep indigo
          glow: "rgba(16, 185, 129, 0.15)",
          text: "#0F172A",
          muted: "#64748B"
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'sarvam-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'sarvam-md': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'sarvam-lg': '0 10px 25px -5px rgba(0, 0, 0, 0.06), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.25)',
        'glow-indigo': '0 0 20px -3px rgba(79, 70, 229, 0.25)',
      }
    },
  },
  plugins: [],
}
