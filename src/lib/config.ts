const PRODUCTION = process.env.NODE_ENV === "production";

const REQUIRED_IN_PRODUCTION = [
  "SESSION_SECRET",
  "ADMIN_PASSWORD",
  "DATA_ENCRYPTION_KEY",
  // Connexion par téléphone : le compteur d'échecs PAR IDENTIFIANT s'appuie sur
  // checkRateLimitDistributed. Sans Redis, le repli est une Map par instance
  // lambda — en serverless, chaque instance a son propre compteur, donc le
  // plafond par compte est pratiquement inopérant face à une attaque distribuée.
  // Un numéro étant bien plus énumérable qu'un email, ce contrôle n'est pas
  // optionnel : on refuse de démarrer sans lui.
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
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

  if (process.env.ADMIN_PASSWORD === "admin123") {
    if (isBuildTime) {
      console.warn("[CFM] ADMIN_PASSWORD par défaut ignoré pendant build");
    } else {
      throw new Error("[CFM] ADMIN_PASSWORD ne doit pas utiliser la valeur par défaut en production");
    }
  }
}

export function isProduction(): boolean {
  return PRODUCTION;
}
