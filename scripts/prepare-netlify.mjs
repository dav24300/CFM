import fs from "fs";
import path from "path";

const root = process.cwd();
const dataDir = path.join(root, "data");
const seed = path.join(dataDir, "store.seed.json");
const store = path.join(dataDir, "store.json");
const localStore = store;

function copy(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

if (fs.existsSync(seed)) {
  copy(seed, store);
  console.log("✓ data/store.seed.json → data/store.json");
} else if (fs.existsSync(localStore)) {
  copy(localStore, store);
  console.log("✓ data/store.json local utilisé pour le build");
} else {
  console.error("❌ Aucune donnée : ajoutez data/store.seed.json");
  process.exit(1);
}

const mediaDir = path.join(root, "public", "media");
if (fs.existsSync(mediaDir)) {
  let count = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/\.(svg|png|jpe?g|webp)$/i.test(entry.name)) count++;
    }
  };
  walk(mediaDir);
  console.log(`✓ ${count} fichier(s) média dans public/media/`);
}

console.log("✓ Prêt pour next build");
