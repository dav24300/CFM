import "server-only";
import type {
  MembershipType,
  PasswordResetToken,
  User,
  UserRole,
} from "@/domain/entities/v2";
import { domainError } from "@/domain/errors/domain-error";
import {
  normalizePgRow,
  normalizePgRows,
  toIsoString,
} from "@/infrastructure/persistence/normalize-pg-row";
import { mapPgError } from "@/infrastructure/persistence/sql/pg-errors";
import { query, withTransaction } from "@/infrastructure/persistence/sql/sql-client";

/**
 * Agrégat AUTH en SQL ciblé (mode PG) : users + password_reset_tokens.
 * Mêmes signatures et mêmes comportements que les branches Store de
 * users.repository et auth/password-reset :
 * - email stocké trim + lowercase (comme la branche Store) ; l'unicité est
 *   garantie par la contrainte users_email_key (23505 → EMAIL_EXISTS via
 *   mapPgError), concurrent-safe — plus par un scan mémoire ;
 * - lookups par email via lower(email) = lower($1) (parité avec la
 *   comparaison lowercase du Store ; sert l'index idx_users_email) ;
 * - reset de mot de passe en UNE transaction (token verrouillé FOR UPDATE).
 */

export async function getUserById(id: number): Promise<User | undefined> {
  try {
    const res = await query<User>("SELECT * FROM users WHERE id = $1", [id]);
    return res.rows[0] ? normalizePgRow(res.rows[0]) : undefined;
  } catch (err) {
    mapPgError(err);
  }
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  try {
    const res = await query<User>(
      "SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1",
      [email.trim()]
    );
    return res.rows[0] ? normalizePgRow(res.rows[0]) : undefined;
  } catch (err) {
    mapPgError(err);
  }
}

/**
 * Insertion d'un utilisateur (validations et hash bcrypt chez l'appelant).
 * INSERT sans id : DEFAULT nextval('users_id_seq') fournit l'id, récupéré
 * via RETURNING *. Doublon d'email → users_email_key → EMAIL_EXISTS.
 */
export async function createUser(data: {
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone: string;
  province?: string;
  role: UserRole;
  membership_type: MembershipType;
  military_link?: string;
  parent_military_name?: string;
  skills?: string;
}): Promise<User> {
  try {
    const res = await query<User>(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone,
                          province, role, membership_type, military_link,
                          parent_military_name, skills, status, verified_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', NULL, $12)
       RETURNING *`,
      [
        data.email.trim().toLowerCase(),
        data.password_hash,
        data.first_name,
        data.last_name,
        data.phone,
        data.province || null,
        data.role,
        data.membership_type,
        data.military_link || null,
        data.parent_military_name || null,
        data.skills || null,
        new Date().toISOString(),
      ]
    );
    return normalizePgRow(res.rows[0]);
  } catch (err) {
    mapPgError(err);
  }
}

export async function activateUser(userId: number): Promise<User | undefined> {
  try {
    const res = await query<User>(
      "UPDATE users SET status = 'active', verified_at = $2 WHERE id = $1 RETURNING *",
      [userId, new Date().toISOString()]
    );
    return res.rows[0] ? normalizePgRow(res.rows[0]) : undefined;
  } catch (err) {
    mapPgError(err);
  }
}

export async function setUserRole(
  userId: number,
  role: UserRole
): Promise<User | undefined> {
  try {
    const res = await query<User>(
      "UPDATE users SET role = $2 WHERE id = $1 RETURNING *",
      [userId, role]
    );
    return res.rows[0] ? normalizePgRow(res.rows[0]) : undefined;
  } catch (err) {
    mapPgError(err);
  }
}

/**
 * Parité Store : first_name/last_name appliqués seulement si truthy (+ trim),
 * phone/province si !== undefined ; aucun champ fourni → renvoie l'utilisateur
 * inchangé (comme la mutation Store qui ne modifiait rien).
 */
export async function updateMemberProfile(
  userId: number,
  data: { first_name?: string; last_name?: string; phone?: string; province?: string }
): Promise<User | undefined> {
  const sets: string[] = [];
  const params: unknown[] = [userId];
  const add = (column: string, value: unknown) => {
    params.push(value);
    sets.push(`${column} = $${params.length}`);
  };
  if (data.first_name) add("first_name", data.first_name.trim());
  if (data.last_name) add("last_name", data.last_name.trim());
  if (data.phone !== undefined) add("phone", data.phone.trim());
  if (data.province !== undefined) add("province", data.province);

  try {
    const res = sets.length
      ? await query<User>(
          `UPDATE users SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
          params
        )
      : await query<User>("SELECT * FROM users WHERE id = $1", [userId]);
    return res.rows[0] ? normalizePgRow(res.rows[0]) : undefined;
  } catch (err) {
    mapPgError(err);
  }
}

export async function suspendUser(userId: number): Promise<void> {
  try {
    await query("UPDATE users SET status = 'suspended' WHERE id = $1", [userId]);
  } catch (err) {
    mapPgError(err);
  }
}

/** Ordre id DESC — équivalent du [...store.users].reverse() historique. */
export async function getAllUsers(): Promise<User[]> {
  try {
    const res = await query<User>("SELECT * FROM users ORDER BY id DESC");
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

/** Dates de création (created_at) de tous les utilisateurs, ordre d'insertion. */
export async function listUserCreationDates(): Promise<string[]> {
  try {
    const res = await query<{ created_at: unknown }>(
      "SELECT created_at FROM users ORDER BY id"
    );
    return res.rows.map((r) => toIsoString(r.created_at));
  } catch (err) {
    mapPgError(err);
  }
}

/** Nombre de comptes « famille », optionnellement filtrés par province. */
export async function countFamilyUsers(province?: string | null): Promise<number> {
  try {
    const res = province
      ? await query<{ n: number }>(
          "SELECT COUNT(*)::int AS n FROM users WHERE membership_type = 'famille' AND province = $1",
          [province]
        )
      : await query<{ n: number }>(
          "SELECT COUNT(*)::int AS n FROM users WHERE membership_type = 'famille'"
        );
    return res.rows[0].n;
  } catch (err) {
    mapPgError(err);
  }
}

/** Compteurs utilisateurs pour le tableau de bord admin. */
export async function getUserAdminCounters(): Promise<{
  users: number;
  pendingUsers: number;
}> {
  try {
    const [users, pending] = await Promise.all([
      query<{ n: number }>("SELECT COUNT(*)::int AS n FROM users"),
      query<{ n: number }>(
        "SELECT COUNT(*)::int AS n FROM users WHERE status = 'pending'"
      ),
    ]);
    return { users: users.rows[0].n, pendingUsers: pending.rows[0].n };
  } catch (err) {
    mapPgError(err);
  }
}

// ── password_reset_tokens ───────────────────────────────────────────────────

/**
 * Enregistre un nouveau token de reset en invalidant (supprimant) d'abord les
 * tokens non utilisés de l'utilisateur — parité avec le filter Store qui ne
 * conservait que les tokens d'autres utilisateurs ou déjà consommés (used = 1).
 * Les deux écritures partagent UNE transaction.
 */
export async function replacePasswordResetToken(entry: {
  user_id: number;
  token: string;
  expires_at: string;
  created_at: string;
}): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(
      "DELETE FROM password_reset_tokens WHERE user_id = $1 AND used <> 1",
      [entry.user_id]
    );
    await client.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at, used, created_at)
       VALUES ($1, $2, $3, 0, $4)`,
      [entry.user_id, entry.token, entry.expires_at, entry.created_at]
    );
  }).catch((err) => mapPgError(err));
}

/** Token non utilisé et non expiré, sinon null (validation d'expiration en JS, parité Store). */
export async function getValidResetToken(
  token: string
): Promise<PasswordResetToken | null> {
  try {
    const res = await query<PasswordResetToken>(
      "SELECT * FROM password_reset_tokens WHERE token = $1 AND used = 0 LIMIT 1",
      [token]
    );
    if (!res.rows[0]) return null;
    const entry = normalizePgRow(res.rows[0]);
    if (new Date(entry.expires_at) < new Date()) return null;
    return entry;
  } catch (err) {
    mapPgError(err);
  }
}

/**
 * Consommation d'un token de reset en UNE transaction (hash bcrypt calculé par
 * l'appelant) : token verrouillé FOR UPDATE, validations identiques à la
 * branche Store (INVALID_TOKEN si absent/consommé/expiré, USER_NOT_FOUND si
 * l'utilisateur a disparu), puis password_hash remplacé et token marqué used.
 */
export async function resetPasswordWithTokenHash(
  token: string,
  passwordHash: string
): Promise<void> {
  await withTransaction(async (client) => {
    const res = await client.query<PasswordResetToken>(
      "SELECT * FROM password_reset_tokens WHERE token = $1 AND used = 0 FOR UPDATE",
      [token]
    );
    const entry = res.rows[0] ? normalizePgRow(res.rows[0]) : null;
    if (!entry) throw domainError("INVALID_TOKEN");
    if (new Date(entry.expires_at) < new Date()) throw domainError("INVALID_TOKEN");

    const updated = await client.query(
      "UPDATE users SET password_hash = $2 WHERE id = $1",
      [entry.user_id, passwordHash]
    );
    if ((updated.rowCount ?? 0) === 0) throw domainError("USER_NOT_FOUND");

    await client.query("UPDATE password_reset_tokens SET used = 1 WHERE id = $1", [
      entry.id,
    ]);
  }).catch((err) => mapPgError(err));
}
