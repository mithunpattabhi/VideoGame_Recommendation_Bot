/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#7c3aed",   // neon purple
        accent: "#06b6d4",    // cyan glow
        darkbg: "#0f172a",    // deep dark blue
      },
    },
  },
  plugins: [],
}