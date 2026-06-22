import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // GlassFire design system (colors_and_type.css)
        fire: "#EE2750",
        "fire-deep": "#E50981",
        "fire-warm": "#EF404E",
        glass: "#00A8E4",
        "glass-deep": "#3C5BA9",
        black: "#000000",
        ink: "#0A0A0C",
        graphite: "#1A1A1F",
        iron: "#2A2A30",
        steel: "#6E6E76",
        fog: "#B8B8BE",
        mist: "#E6E6E8",
        paper: "#F5F5F2",
        snow: "#FFFFFF",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "Poppins", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gf-fire": "linear-gradient(180deg, #EF404E 0%, #EE3157 50%, #E50981 100%)",
        "gf-glass": "linear-gradient(180deg, #00A8E4 0%, #178ACD 55%, #3C5BA9 100%)",
        "gf-spark": "linear-gradient(110deg, #00A8E4 0%, #3C5BA9 35%, #E50981 65%, #EE2750 100%)",
      },
      boxShadow: {
        spark: "0 0 0 1px rgba(238,39,80,0.4), 0 12px 40px rgba(238,39,80,0.35)",
        glassglow: "0 0 0 1px rgba(0,168,228,0.35), 0 12px 40px rgba(0,168,228,0.30)",
      },
    },
  },
  plugins: [],
};

export default config;
