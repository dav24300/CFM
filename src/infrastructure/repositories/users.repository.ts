import bcrypt from "bcryptjs";
import {
  getStoreAsync,
  updateStoreAsync,
  nextId,
} from "@/infrastructure/persistence/store-access";
import { domainError } from "@/domain/errors/domain-error";
import { normalizePhoneRdc } from "@/domain/phone";
import { decryptHelpRequest } from "@/infrastructure/encryption/aes.adapter";
import { isPgMode } from "@/infrastructure/persistence/sql/sql-client";
import * as sqlForms from "@/infrastructure/repositories/sql/forms.sql";
import * as sqlUsers from "@/infrastructure/repositories/sql/users.sql";
import type {
  User,
  HelpRequestUpdate,
  MembershipType,
  UserRole,
} from "@/domain/entities/v2";

/**
 * Agrégat utilisateurs (AUTH) — dual-mode :
 * - PG (DATABASE_URL) : SQL ciblé (sql/users.sql.ts), unicité email par
 *   contrainte users_email_key — concurrent-safe.
 * - JSON (dev) : branche Store historique inchangée.
 * Validations, hash bcrypt et codes d'erreur domaine restent communs.
 */

const SALT_ROUNDS = 10;

export async function getUserById(id: number): Promise<User | undefined> {
  if (isPgMode()) return sqlUsers.getUserById(id);
  const store = await getStoreAsync();
  return store.users.find((u) => u.id === id);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  // Garde d'entrée : `email` arrive parfois d'un champ nullish (liens familiaux,
  // child_email/parent_email), et `email.trim()` sur `undefined` lève une
  // TypeError avalée par mapPgError → 500 « pg_error » opaque.
  if (!email?.trim()) return undefined;
  if (isPgMode()) return sqlUsers.getUserByEmail(email);
  const store = await getStoreAsync();
  const needle = email.trim().toLowerCase();
  // Garde sur la ligne : dès que des comptes ont un email NULL (connexion par
  // téléphone), `u.email.toLowerCase()` ferait exploser TOUTE lecture par email
  // en mode JSON — connexion, mot de passe oublié, inscription suivante.
  return store.users.find((u) => u.email?.toLowerCase() === needle);
}

export async function registerUser(data: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  province?: string;
  membership_type: MembershipType;
  military_link?: string;
  parent_military_name?: string;
  skills?: string;
}): Promise<User> {
  if (data.password.length < 8) throw domainError("PASSWORD_TOO_SHORT");
  if (await getUserByEmail(data.email)) throw domainError("EMAIL_EXISTS");
  if (data.membership_type === "famille" && !data.military_link) {
    throw domainError("MILITARY_LINK_REQUIRED");
  }

  // SÉCURITÉ — le rôle n'est JAMAIS déduit d'une auto-déclaration.
  // Cocher « Bénévole » dans le formulaire public donnait `role: "volunteer"`,
  // et `getAdminAccess()` (src/lib/admin-access.ts:9) accorde à ce rôle l'accès
  // au back-office : édition du contenu public, des médias, des partenaires, du
  // live, et validation de dons — sans jamais avoir eu le mot de passe admin.
  // Avec une activation en lot, toute la salle passait bénévole d'un clic.
  // Le type d'adhésion déclaré reste enregistré dans `membership_type` ; la
  // promotion effective se fait à la main via PATCH /api/admin/users/[id]/role,
  // qui exige un vrai administrateur.
  const role: UserRole = "member";
  const hash = await bcrypt.hash(data.password, SALT_ROUNDS);

  if (isPgMode()) {
    // Le pré-check getUserByEmail ci-dessus préserve l'ordre des erreurs ;
    // la contrainte users_email_key reste le garde-fou concurrent-safe
    // (23505 → EMAIL_EXISTS) — plus de scan mémoire.
    const { password: _password, ...fields } = data;
    return sqlUsers.createUser({ ...fields, password_hash: hash, role });
  }

  let created!: User;

  await updateStoreAsync((store) => {
    if (!store.users) store.users = [];
    created = {
      id: nextId(store),
      email: data.email.trim().toLowerCase(),
      password_hash: hash,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      phone_e164: normalizePhoneRdc(data.phone),
      province: data.province || null,
      role,
      membership_type: data.membership_type,
      military_link: data.military_link || null,
      parent_military_name: data.parent_military_name || null,
      skills: data.skills || null,
      status: "pending",
      verified_at: null,
      created_at: new Date().toISOString(),
    };
    store.users.push(created);
  });

  return created!;
}

/**
 * Résolution d'un compte par son numéro normalisé E.164. Le téléphone est un
 * identifiant UNIQUE (index partiel idx_users_phone_e164_unique) : 0 ou 1 compte.
 */
export async function getUserByPhoneE164(e164: string): Promise<User | undefined> {
  if (!e164) return undefined;
  if (isPgMode()) return sqlUsers.getUserByPhoneE164(e164);
  const store = await getStoreAsync();
  return store.users.find((u) => u.phone_e164 === e164);
}

/**
 * Résout un identifiant de connexion : email OU téléphone. La présence d'un « @ »
 * désambiguïse trivialement. Un numéro est normalisé avant la recherche, si bien
 * que `0812345678` et `+243812345678` retrouvent le même compte.
 */
export async function findUserByIdentifier(identifier: string): Promise<User | undefined> {
  const raw = (identifier ?? "").trim();
  if (!raw) return undefined;
  if (raw.includes("@")) return getUserByEmail(raw);
  const e164 = normalizePhoneRdc(raw);
  if (!e164) return undefined;
  return getUserByPhoneE164(e164);
}

// Hash bcrypt syntaxiquement valide, jamais égalé (60 caractères, coût 10, il
// déclenche un vrai calcul). Il garantit un coût de comparaison CONSTANT même
// quand l'identifiant est inconnu : sans lui, « identifiant inconnu » répond en
// ~1 ms et « mot de passe faux » en ~80 ms — un oracle d'existence de compte,
// d'autant plus exploitable qu'un numéro est bien plus énumérable qu'un email.
const DUMMY_HASH = "$2a$10$" + "x".repeat(53);

export async function verifyUserCredentials(
  identifier: string,
  password: string
): Promise<User | null> {
  const user = await findUserByIdentifier(identifier);
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    return null;
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? user : null;
}

export async function activateUser(userId: number): Promise<User | undefined> {
  if (isPgMode()) return sqlUsers.activateUser(userId);
  let user: User | undefined;
  await updateStoreAsync((store) => {
    const u = store.users?.find((x) => x.id === userId);
    if (u) {
      u.status = "active";
      u.verified_at = new Date().toISOString();
      user = u;
    }
  });
  return user;
}

/**
 * Active un lot de comptes et renvoie ceux qui ont réellement changé d'état.
 * Idempotent : les comptes déjà actifs (ou inexistants) sont ignorés.
 */
export async function activateUsers(userIds: number[]): Promise<User[]> {
  if (userIds.length === 0) return [];
  if (isPgMode()) return sqlUsers.activateUsers(userIds);

  // Mode JSON : une seule mutation du store pour tout le lot — surtout pas un
  // updateStoreAsync par identifiant (chaque appel réécrit le fichier entier).
  const wanted = new Set(userIds);
  const activated: User[] = [];
  await updateStoreAsync((store) => {
    activated.length = 0;
    for (const u of store.users ?? []) {
      if (!wanted.has(u.id) || u.status === "active") continue;
      u.status = "active";
      u.verified_at = new Date().toISOString();
      activated.push(u);
    }
  });
  return activated;
}

export async function setUserRole(
  userId: number,
  role: UserRole
): Promise<User | undefined> {
  if (isPgMode()) return sqlUsers.setUserRole(userId, role);
  let user: User | undefined;
  await updateStoreAsync((store) => {
    const u = store.users?.find((x) => x.id === userId);
    if (u) {
      u.role = role;
      user = u;
    }
  });
  return user;
}

export async function updateMemberProfile(
  userId: number,
  data: { first_name?: string; last_name?: string; phone?: string; province?: string }
): Promise<User | undefined> {
  if (isPgMode()) return sqlUsers.updateMemberProfile(userId, data);
  let updated: User | undefined;
  await updateStoreAsync((store) => {
    const u = store.users?.find((x) => x.id === userId);
    if (!u) return;
    if (data.first_name) u.first_name = data.first_name.trim();
    if (data.last_name) u.last_name = data.last_name.trim();
    if (data.phone !== undefined) u.phone = data.phone.trim();
    if (data.province !== undefined) u.province = data.province;
    updated = u;
  });
  return updated;
}

export async function suspendUser(userId: number): Promise<void> {
  if (isPgMode()) return sqlUsers.suspendUser(userId);
  await updateStoreAsync((store) => {
    const user = store.users?.find((u) => u.id === userId);
    if (user) user.status = "suspended";
  });
}

export async function getAllUsers(): Promise<User[]> {
  if (isPgMode()) return sqlUsers.getAllUsers();
  const store = await getStoreAsync();
  return [...store.users].reverse();
}

/** Dates de création (created_at brutes) de tous les utilisateurs. */
export async function listUserCreationDates(): Promise<string[]> {
  if (isPgMode()) return sqlUsers.listUserCreationDates();
  const store = await getStoreAsync();
  return store.users.map((u) => u.created_at);
}

/** Nombre de comptes « famille », optionnellement filtrés par province. */
export async function countFamilyUsers(
  province?: string | null
): Promise<number> {
  if (isPgMode()) return sqlUsers.countFamilyUsers(province);
  const store = await getStoreAsync();
  const users = store.users ?? [];
  return users.filter((u) => {
    if (u.membership_type !== "famille") return false;
    if (province && u.province !== province) return false;
    return true;
  }).length;
}

/** Compteurs utilisateurs pour le tableau de bord admin. */
export async function getUserAdminCounters(): Promise<{
  users: number;
  pendingUsers: number;
}> {
  if (isPgMode()) return sqlUsers.getUserAdminCounters();
  const store = await getStoreAsync();
  const users = store.users || [];
  return {
    users: users.length,
    pendingUsers: users.filter((u) => u.status === "pending").length,
  };
}

export async function getHelpRequestsForUser(userId: number) {
  const user = await getUserById(userId);
  if (!user) return [];
  const helpRequests = isPgMode()
    ? await sqlForms.listHelpRequestsRaw()
    : (await getStoreAsync()).help_requests;
  return helpRequests
    .filter((h) => {
      const linkedUserId = h.user_id as number | undefined;
      if (linkedUserId && linkedUserId === userId) return true;
      const email = h.email as string | undefined;
      const phone = h.phone as string | undefined;
      return (
        (email && email.toLowerCase() === user.email) ||
        (phone && user.phone && phone === user.phone)
      );
    })
    .map((h) => decryptHelpRequest(h));
}

export async function addHelpRequestUpdate(data: {
  help_request_id: number;
  status: string;
  note: string;
  updated_by: string;
}): Promise<HelpRequestUpdate> {
  if (isPgMode()) return sqlForms.addHelpRequestUpdate(data);
  let created!: HelpRequestUpdate;
  await updateStoreAsync((store) => {
    created = {
      id: nextId(store),
      help_request_id: data.help_request_id,
      status: data.status,
      note: data.note,
      updated_by: data.updated_by,
      created_at: new Date().toISOString(),
    };
    store.help_request_updates.push(created);

    const req = store.help_requests.find((h) => h.id === data.help_request_id);
    if (req) req.status = data.status;
  });
  return created!;
}

export async function getHelpRequestUpdates(
  helpRequestId: number
): Promise<HelpRequestUpdate[]> {
  if (isPgMode()) return sqlForms.getHelpRequestUpdates(helpRequestId);
  const store = await getStoreAsync();
  return store.help_request_updates.filter((u) => u.help_request_id === helpRequestId);
}
