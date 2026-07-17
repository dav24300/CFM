export type MobileMoneyMode = "demo" | "sandbox" | "production";

// Toute valeur inconnue retombe sur "demo" (fail-safe : aucun encaissement).
export function getMobileMoneyMode(): MobileMoneyMode {
  const raw = (process.env.MOBILE_MONEY_MODE || "").trim().toLowerCase();
  if (raw === "production") return "production";
  if (raw === "sandbox") return "sandbox";
  return "demo";
}
