import type { Config } from "tailwindcss";

import { ACCENT_COLOR } from "./lib/theme";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: ACCENT_COLOR,
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
