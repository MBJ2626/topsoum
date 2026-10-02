import type { Config } from "tailwindcss";

import { ACCENT_COLOR } from "./lib/theme";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: ACCENT_COLOR,
          strong: "#2a47e0",
          soft: "#eef1ff",
          foreground: "#ffffff",
        },
        // Neutres froids "carton et etagere" : remplacent le gris Tailwind
        // partout, pour que chaque ecran herite de la meme matiere.
        gray: {
          50: "#f6f7f9",
          100: "#eef0f3",
          200: "#e2e5e9",
          300: "#cdd1d7",
          400: "#9aa0a9",
          500: "#5f646d",
          600: "#4a4f57",
          700: "#363a41",
          800: "#23262c",
          900: "#15171c",
        },
        // Bord des champs de saisie : 3:1 minimum sur blanc et sur etagere (WCAG 1.4.11).
        field: "#80868f",
        green: { 700: "#0f7a55" },
        red: { 600: "#d92d2d" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        key: "12px",
      },
      letterSpacing: {
        display: "-0.03em",
      },
    },
  },
  plugins: [],
};

export default config;
