/**
 * Tests unitaires légers (sans framework) — logique partagée refactor.
 * Usage: npm run test:repos
 */
import assert from "node:assert/strict";

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

function pngToSvgFallback(publicPath) {
  if (!publicPath) return publicPath;
  if (publicPath.endsWith(".svg")) return publicPath;
  if (publicPath.endsWith(".png")) return publicPath.replace(/\.png$/i, ".svg");
  return publicPath;
}

assert.equal(slugify("Réforme Protection"), "reforme-protection");
assert.equal(slugify("Test 123!"), "test-123");
console.log("✓ slugify");

assert.equal(pngToSvgFallback("/media/hero.png"), "/media/hero.svg");
assert.equal(pngToSvgFallback("/media/hero.svg"), "/media/hero.svg");
assert.equal(pngToSvgFallback(""), "");
console.log("✓ media-resolver");

console.log("\nAll repository smoke tests passed.");
