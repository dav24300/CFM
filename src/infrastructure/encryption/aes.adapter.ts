import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ENC_PREFIX = "cfm_enc:v1:";

// scryptSync coûte ~50-100 ms de CPU BLOQUANT (N=16384) : le recalculer à
// chaque champ gelait l'event loop dès qu'on déchiffrait une liste (2 champs
// par demande d'aide × toute la table). La dérivation est déterministe, on la
// mémoïse. Le secret sert de clé de cache : une rotation à chaud reste prise
// en compte (cf. procédure de rotation du runbook).
let derivedKey: { secret: string; key: Buffer } | null = null;

function getKey(): Buffer | null {
  const secret = process.env.DATA_ENCRYPTION_KEY;
  if (!secret) return null;
  if (derivedKey?.secret === secret) return derivedKey.key;
  const key = scryptSync(secret, "cfm-asbl-salt", 32);
  derivedKey = { secret, key };
  return key;
}

export function isEncryptionEnabled(): boolean {
  return Boolean(process.env.DATA_ENCRYPTION_KEY);
}

export function encryptSensitive(value: string): string {
  if (!value) return value;
  const key = getKey();
  if (!key) {
    // Fail-closed : en production, ne jamais stocker une donnée sensible en clair.
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[CFM] DATA_ENCRYPTION_KEY absente : refus de stocker une donnée sensible non chiffrée en production."
      );
    }
    return value;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString("base64");
  return `${ENC_PREFIX}${payload}`;
}

export function decryptSensitive(value: string): string {
  if (!value || !value.startsWith(ENC_PREFIX)) return value;
  const key = getKey();
  if (!key) return "[chiffré — clé DATA_ENCRYPTION_KEY manquante]";

  try {
    const raw = Buffer.from(value.slice(ENC_PREFIX.length), "base64");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return "[erreur déchiffrement]";
  }
}

export function decryptHelpRequest<T extends Record<string, unknown>>(req: T): T {
  return {
    ...req,
    phone: typeof req.phone === "string" ? decryptSensitive(req.phone) : req.phone,
    description:
      typeof req.description === "string" ? decryptSensitive(req.description) : req.description,
  };
}
