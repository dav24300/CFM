/**
 * Formate une valeur en cellule CSV sûre :
 *  1) neutralise l'injection de formule (CSV/Excel injection) en préfixant d'une
 *     apostrophe toute valeur commençant par un caractère de formule (= + - @, tab, CR) ;
 *  2) applique l'échappement CSV standard (guillemets, virgules, retours ligne).
 * Utilisé par tous les exports admin pour éviter l'exécution de formules côté
 * poste (HYPERLINK / WEBSERVICE / DDE) à l'ouverture dans un tableur.
 */
export function csvCell(value: unknown): string {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
