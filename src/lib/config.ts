const PRODUCTION = process.env.NODE_ENV === "production";

const REQUIRED_IN_PRODUCTION = [
  "SESSION_SECRET",
  "ADMIN_PASSWORD",
  "DATA_ENCRYPTION_KEY",
] as const;

export function assertProductionConfig(): void {
  if (!PRODUCTION) return;

  const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

  for (const key of REQUIRED_IN_PRODUCTION) {
    if (!process.env[key]) {
      if (isBuildTime) {
        console.warn(`[CFM] Variable requise absente pendant build : ${key}`);
        continue;
      }
      throw new Error(`[CFM] Variable d'environnement obligatoire manquante : ${key}`);
    }
  }

  const secret = process.env.SESSION_SECRET;
  if (secret === "dev-secret-change-in-production") {
    if (isBuildTime) {
      console.warn("[CFM] SESSION_SECRET par défaut ignoré pendant build");
    } else {
      throw new Error("[CFM] SESSION_SECRET ne doit pas utiliser la valeur par défaut en production");
    }
  }
}

export function isProduction(): boolean {
  return PRODUCTION;
}
