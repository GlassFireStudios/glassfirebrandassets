import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // GlassFire brand colors (from /Logos/Brand Colors)
        fire: "#EE2750",
        glass: "#00A8E4",
        ink: "#0b0b0d",
      },
    },
  },
  plugins: [],
};

export default config;
