/**
 * Copie les photos CFM depuis assets/incoming/ vers public/media/
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const incoming = path.join(root, "assets", "incoming");

const map = [
  { key: "fondateur", dest: "public/media/equipe/fondateur.png" },
  { key: "rassemblement-terrain", dest: "public/media/fikin-2025/rassemblement-02.png" },
  { key: "affiche-rassemblement", dest: "public/media/fikin-2025/rassemblement-01.png" },
  { key: "affiche-congo", dest: "public/media/hero/hero-home.png" },
];

/** Noms partiels des fichiers Cursor / WhatsApp pour détection auto */
const aliases = {
  fondateur: ["fondateur", "be670a20"],
  "rassemblement-terrain": ["7.25.28", "adbcf348", "rassemblement-terrain"],
  "affiche-rassemblement": ["bbf0fe6f", "affiche-rassemblement", "2-bbf0"],
  "affiche-congo": ["7.25.27", "ed9528f3", "affiche-congo", "indivisible"],
};

const extras = [
  { key: "affiche-congo", dest: "public/media/hero/hero-home-mobile.png" },
  { key: "affiche-rassemblement", dest: "public/media/live/fikin-live-thumb.png" },
  { key: "affiche-congo", dest: "public/media/fikin-2025/rassemblement-03.png" },
  { key: "rassemblement-terrain", dest: "public/media/fikin-2025/rassemblement-04.png" },
  { key: "affiche-rassemblement", dest: "public/media/actualites/fikin-2025.png" },
];

function listIncomingImages() {
  if (!fs.existsSync(incoming)) return [];
  return fs.readdirSync(incoming).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
}

function resolveSource(key) {
  const exact = path.join(incoming, `${key}.png`);
  if (fs.existsSync(exact)) return exact;
  for (const ext of [".jpg", ".jpeg", ".webp", ".PNG", ".JPG"]) {
    const p = path.join(incoming, `${key}${ext}`);
    if (fs.existsSync(p)) return p;
  }
  const needles = aliases[key] || [key];
  for (const file of listIncomingImages()) {
    const lower = file.toLowerCase();
    if (needles.some((n) => lower.includes(n.toLowerCase()))) {
      return path.join(incoming, file);
    }
  }
  return null;
}

function copyTo(src, dest) {
  const to = path.join(root, dest);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(src, to);
  console.log(`✓ ${path.basename(src)} → ${dest}`);
}

let ok = 0;
const resolved = new Map();

for (const { key, dest } of map) {
  const src = resolveSource(key);
  if (!src) {
    console.warn(`⚠ Manquant : ${key} (assets/incoming/${key}.png ou alias)`);
    continue;
  }
  resolved.set(key, src);
  copyTo(src, dest);
  ok++;
}

for (const { key, dest } of extras) {
  const src = resolved.get(key);
  if (src) copyTo(src, dest);
}

if (ok === 0) {
  console.error("\nAucune image importée.");
  console.error("Placez vos 4 photos dans assets/incoming/ (voir LISEZMOI.txt)");
  process.exit(1);
}

console.log(`\nImport terminé (${ok}/${map.length} fichiers principaux).`);
