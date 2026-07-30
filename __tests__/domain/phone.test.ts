import { describe, it, expect } from "vitest";
import { normalizePhoneRdc } from "@/domain/phone";

describe("normalizePhoneRdc", () => {
  it("accepte les formes RDC valides et converge vers E.164", () => {
    const canonical = "+243812345678";
    const forms = [
      "0812345678", // forme papier standard
      "+243812345678", // déjà canonique
      "243812345678", // indicatif sans +
      "812345678", // NSN nu (9 chiffres)
      "243 81 234 56 78", // séparateurs espaces
      "0812-345-678", // séparateurs tirets
      "(0812) 345 678", // parenthèses
      "0812.345.678", // points
      "0812/345/678", // barres
      "00243812345678", // composition depuis l'étranger (00)
      "011243812345678", // composition depuis l'étranger (011)
      "+2430812345678", // double zéro-tronc (faute fréquente)
      "  0812345678  ", // espaces de bord
      "0812 345 678", // espaces insécables (couverts par \s)
      "0812 345 678", // espaces fines insécables
    ];
    for (const form of forms) {
      expect(normalizePhoneRdc(form), form).toBe(canonical);
    }
  });

  it("accepte les numéros de la diaspora tels quels, sans les valider", () => {
    expect(normalizePhoneRdc("+32475123456")).toBe("+32475123456"); // Belgique
    expect(normalizePhoneRdc("0032475123456")).toBe("+32475123456"); // via 00
    expect(normalizePhoneRdc("+33612345678")).toBe("+33612345678"); // France
  });

  it("normalise le 9 sur les mobiles commençant par 9", () => {
    expect(normalizePhoneRdc("0912345678")).toBe("+243912345678");
    expect(normalizePhoneRdc("912345678")).toBe("+243912345678");
  });

  it("refuse ce qui n'est pas un mobile RDC exploitable", () => {
    const invalid = [
      "0242123456", // fixe Kinshasa (préfixe 2, pas 8/9)
      "+24381234567", // 8 chiffres : un chiffre manque
      "0712345678", // préfixe 7 (hors plan mobile 8/9)
      "081 234 56 78 (papa)", // annotation → l'opérateur doit corriger
      "0O12345678", // O au lieu de 0
      "abc", // texte
      "12345", // trop court
      "٠٨١٢٣٤٥٦٧٨", // chiffres arabes-indiens (limitation assumée)
      "", // vide
      "   ", // blancs
    ];
    for (const value of invalid) {
      expect(normalizePhoneRdc(value), value).toBeNull();
    }
  });

  it("traite null / undefined / non-chaîne comme inexploitable (colonne NULL)", () => {
    expect(normalizePhoneRdc(null)).toBeNull();
    expect(normalizePhoneRdc(undefined)).toBeNull();
    // @ts-expect-error — robustesse runtime face à une valeur inattendue.
    expect(normalizePhoneRdc(243812345678)).toBeNull();
  });

  it("est idempotent : normaliser une sortie canonique la laisse inchangée", () => {
    const once = normalizePhoneRdc("0812345678");
    expect(once).not.toBeNull();
    expect(normalizePhoneRdc(once)).toBe(once);
  });

  it("fait converger toutes les variantes d'un même numéro vers UNE clé", () => {
    const variants = ["0812345678", "+243812345678", "243 81 234 56 78", "0812-345-678"];
    const keys = new Set(variants.map((v) => normalizePhoneRdc(v)));
    expect(keys.size).toBe(1);
  });
});
