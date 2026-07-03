import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ENC_PREFIX = "cfm_enc:v1:";

function getKey(): Buffer | null {
  const secret = process.env.DATA_ENCRYPTION_KEY;
  if (!secret) return null;
  return scryptSync(secret, "cfm-asbl-salt", 32);
}

export function isEncryptionEnabled(): boolean {
  return Boolean(process.env.DATA_ENCRYPTION_KEY);
}

export function encryptSensitive(value: string): string {
  if (!value) return value;
  const key = getKey();
  if (!key) return value;

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
