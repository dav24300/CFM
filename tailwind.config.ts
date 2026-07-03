import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cfm: {
          navy: "#1a2f4a",
          gold: "#c9a227",
          warm: "#d4845c",
          cream: "#faf7f2",
          earth: "#5c4a3a",
        },
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      animation: {
        "live-pulse": "live-pulse 2s ease-in-out infinite",
        "fade-in": "fade-in 0.6s ease-out forwards",
      },
      keyframes: {
        "live-pulse": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.4)" },
          "50%": { opacity: "0.85", boxShadow: "0 0 0 8px rgba(239, 68, 68, 0)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        cfm: "0 4px 24px rgba(26, 47, 74, 0.08)",
        "cfm-lg": "0 8px 40px rgba(26, 47, 74, 0.12)",
      },
      borderRadius: {
        card: "0.75rem",
        media: "1rem",
      },
      spacing: {
        section: "6rem",
        "section-md": "8rem",
      },
      ringColor: {
        focus: "#c9a227",
      },
    },
  },
  plugins: [],
};

export default config;
