import type { Config } from "tailwindcss";

/**
 * CFM ASBL — deux design systems.
 * `site-*`  : public + portail (bleu institutionnel, coins nets, Newsreader/Archivo).
 * `admin-*` : console (teal, coins 8px, Space Grotesk/IBM Plex).
 * Remplace l'ancien pairing cfm-navy/gold/warm/cream/earth + Playfair/Nunito.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ---- Public & Portail (institutionnel, éditorial) — hex figés (pas de dark) ----
        site: {
          ink: "#14171c",
          muted: "#4a4d54",
          "muted-2": "#6b6b63",
          hairline: "#e6e6e2",
          surface: "#f6f8fc",
          primary: "#14418a",
          "primary-dark": "#0f367a",
          deep: "#0b1a38",
          navy: "#12325f",
          light: "#7aa7f5",
          pale: "#eaf0fb",
          live: "#e23b3b",
          success: "#1f8a5b",
          // Hero (récurrents, auparavant en hex brut)
          "hero-dark": "#0f1622",
          "hero-eyebrow": "#9fbdf0",
          // Statuts (miroir des statuts admin, pour le portail)
          danger: "#c0362c",
          "danger-bg": "#fbeae8",
          "warn-fg": "#b7791f",
          "warn-bg": "#fef3e2",
          "ok-fg": "#127d73",
          "ok-bg": "#e3f3f0",
          "info-fg": "#2563aa",
          "info-bg": "#e7effa",
        },
        // ---- Admin (console de travail, teal) — canaux RGB pour thème sombre + opacités ----
        admin: {
          bg: "rgb(var(--admin-bg) / <alpha-value>)",
          sidebar: "rgb(var(--admin-sidebar) / <alpha-value>)",
          "sidebar-active": "rgb(var(--admin-sidebar-active) / <alpha-value>)",
          ink: "rgb(var(--admin-ink) / <alpha-value>)",
          muted: "rgb(var(--admin-muted) / <alpha-value>)",
          "muted-2": "rgb(var(--admin-muted-2) / <alpha-value>)",
          border: "rgb(var(--admin-border) / <alpha-value>)",
          accent: "rgb(var(--admin-accent) / <alpha-value>)",
          "accent-dark": "rgb(var(--admin-accent-dark) / <alpha-value>)",
          deep: "rgb(var(--admin-deep) / <alpha-value>)",
          "warn-fg": "rgb(var(--admin-warn-fg) / <alpha-value>)",
          "warn-bg": "rgb(var(--admin-warn-bg) / <alpha-value>)",
          "ok-fg": "rgb(var(--admin-ok-fg) / <alpha-value>)",
          "ok-bg": "rgb(var(--admin-ok-bg) / <alpha-value>)",
          "info-fg": "rgb(var(--admin-info-fg) / <alpha-value>)",
          "info-bg": "rgb(var(--admin-info-bg) / <alpha-value>)",
          "danger-fg": "rgb(var(--admin-danger-fg) / <alpha-value>)",
          "danger-bg": "rgb(var(--admin-danger-bg) / <alpha-value>)",
        },
      },
      fontFamily: {
        serif: ["var(--font-newsreader)", "Georgia", "serif"],
        sans: ["var(--font-archivo)", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        ui: ["var(--font-plex-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      animation: {
        "live-pulse": "live-pulse 2s ease-in-out infinite",
        "fade-in": "fade-in 0.6s ease-out forwards",
      },
      keyframes: {
        "live-pulse": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 0 0 rgba(226, 59, 59, 0.4)" },
          "50%": { opacity: "0.85", boxShadow: "0 0 0 8px rgba(226, 59, 59, 0)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        "site-hover": "0 18px 40px rgba(20, 40, 90, 0.13)",
        "admin-drawer": "-16px 0 48px rgba(12, 14, 18, 0.14)",
      },
      borderRadius: {
        admin: "8px",
        "admin-ctrl": "7px",
      },
      maxWidth: {
        site: "1240px",
        portal: "1140px",
      },
    },
  },
  plugins: [],
};

export default config;
