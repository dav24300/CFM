import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import {
  getStore,
  updateStore,
  nextId,
} from "@/infrastructure/persistence/store-access";
import { domainError } from "@/domain/errors/domain-error";
import type { PasswordResetToken } from "@/domain/entities/v2";

const TOKEN_BYTES = 32;
const EXPIRY_HOURS = 1;

export function createPasswordResetToken(userId: number): string {
  const token = randomBytes(TOKEN_BYTES).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  updateStore((store) => {
    store.password_reset_tokens = store.password_reset_tokens.filter(
      (t) => t.user_id !== userId || t.used === 1
    );
    store.password_reset_tokens.push({
      id: nextId(store),
      user_id: userId,
      token,
      expires_at: expiresAt,
      used: 0,
      created_at: new Date().toISOString(),
    });
  });

  return token;
}

export function getValidResetToken(token: string): PasswordResetToken | null {
  const store = getStore();
  const entry = store.password_reset_tokens.find(
    (t) => t.token === token && t.used === 0
  );
  if (!entry) return null;
  if (new Date(entry.expires_at) < new Date()) return null;
  return entry;
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<void> {
  if (newPassword.length < 8) throw domainError("PASSWORD_TOO_SHORT");

  const entry = getValidResetToken(token);
  if (!entry) throw domainError("INVALID_TOKEN");

  const hash = await bcrypt.hash(newPassword, 10);
  updateStore((store) => {
    const user = store.users.find((u) => u.id === entry.user_id);
    if (!user) throw domainError("USER_NOT_FOUND");
    user.password_hash = hash;

    const t = store.password_reset_tokens.find((x) => x.id === entry.id);
    if (t) t.used = 1;
  });
}

export function petitionSignaturesToCsv(
  petitionTitle: string,
  signatures: { name: string; email: string; signed_at: string }[]
): string {
  const header = "Nom,Email,Date de signature\n";
  const rows = signatures
    .map((s) => {
      const name = `"${s.name.replace(/"/g, '""')}"`;
      const email = s.email;
      const date = s.signed_at;
      return `${name},${email},${date}`;
    })
    .join("\n");
  return `\uFEFF${header}${rows}`;
}
