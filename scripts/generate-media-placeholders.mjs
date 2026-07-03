import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "public", "media");

function svg(title, subtitle, accent = "gold") {
  const accents = {
    gold: { from: "#c9a227", to: "#1a2f4a" },
    warm: { from: "#d4845c", to: "#1a2f4a" },
    navy: { from: "#1a2f4a", to: "#0f1c2e" },
  };
  const { from, to } = accents[accent] || accents.gold;
  const safe = (s) => s.replace(/[<>&'"]/g, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-label="${safe(title)}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${from}"/>
      <stop offset="100%" style="stop-color:${to}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <circle cx="1050" cy="120" r="180" fill="#ffffff" fill-opacity="0.06"/>
  <text x="600" y="310" text-anchor="middle" fill="#faf7f2" font-family="Georgia, serif" font-size="42" font-weight="700">${safe(title)}</text>
  <text x="600" y="370" text-anchor="middle" fill="#c9a227" font-family="system-ui, sans-serif" font-size="20" letter-spacing="3">${safe(subtitle)}</text>
</svg>`;
}

function portraitSvg(label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" role="img">
  <defs>
    <linearGradient id="p" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a2f4a"/>
      <stop offset="100%" style="stop-color:#c9a227"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#p)"/>
  <circle cx="200" cy="150" r="60" fill="#faf7f2" fill-opacity="0.3"/>
  <ellipse cx="200" cy="320" rx="90" ry="70" fill="#faf7f2" fill-opacity="0.2"/>
  <text x="200" y="380" text-anchor="middle" fill="#faf7f2" font-family="system-ui" font-size="12" opacity="0.7">${label}</text>
</svg>`;
}

const files = {
  "hero/hero-home.svg": svg("Cri de Familles Militaires", "FIKIN 2025 — Kinshasa", "navy"),
  "hero/hero-home-mobile.svg": svg("CFM ASBL", "RDC", "navy"),
  "fikin-2025/rassemblement-01.svg": svg("FIKIN 2025", "Rassemblement historique", "gold"),
  "fikin-2025/rassemblement-02.svg": svg("Familles unies", "Plaidoyer collectif", "warm"),
  "fikin-2025/rassemblement-03.svg": svg("Voix des familles", "Kinshasa", "gold"),
  "fikin-2025/rassemblement-04.svg": svg("Partage & solidarité", "CFM", "navy"),
  "fikin-2025/rassemblement-05.svg": svg("Institutions", "Rencontres & échanges", "gold"),
  "fikin-2025/rassemblement-06.svg": svg("Ensemble", "Pour nos droits", "warm"),
  "axes/social.svg": svg("Axe Social", "Protection & accompagnement", "gold"),
  "axes/economie.svg": svg("Axe Économique", "Autonomisation", "warm"),
  "axes/education.svg": svg("Axe Éducation", "Scolarisation & formation", "navy"),
  "axes/environnement.svg": svg("Axe Environnement", "Cadre de vie", "gold"),
  "axes/sante.svg": svg("Axe Santé", "Soins & prévention", "warm"),
  "temoignages/portrait-01.svg": portraitSvg("Témoignage CFM"),
  "temoignages/portrait-02.svg": portraitSvg("Famille militaire"),
  "equipe/fondateur.svg": svg("Ngonga Mbana Glody", "Fondateur CFM", "navy"),
  "equipe/benevoles.svg": svg("Équipe CFM", "Bénévoles engagés", "gold"),
  "live/fikin-live-thumb.svg": svg("Live FIKIN 2025", "Replay disponible", "navy"),
  "actualites/default.svg": svg("Actualité CFM", "Plaidoyer & actions", "gold"),
};

for (const [rel, content] of Object.entries(files)) {
  const dest = path.join(root, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, "utf8");
}

console.log(`Generated ${Object.keys(files).length} media placeholders in public/media/`);
