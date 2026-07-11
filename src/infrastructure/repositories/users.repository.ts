import bcrypt from "bcryptjs";
import {
  getStoreAsync,
  updateStoreAsync,
  nextId,
} from "@/infrastructure/persistence/store-access";
import { domainError } from "@/domain/errors/domain-error";
import { decryptHelpRequest } from "@/infrastructure/encryption/aes.adapter";
import type {
  User,
  HelpRequestUpdate,
  MembershipType,
  UserRole,
} from "@/domain/entities/v2";

const SALT_ROUNDS = 10;

export async function getUserById(id: number): Promise<User | undefined> {
  const store = await getStoreAsync();
  return store.users.find((u) => u.id === id);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const store = await getStoreAsync();
  return store.users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );
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

  const role: UserRole = data.membership_type === "benevole" ? "volunteer" : "member";
  const hash = await bcrypt.hash(data.password, SALT_ROUNDS);
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

export async function verifyUserPassword(
  email: string,
  password: string
): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? user : null;
}

export async function activateUser(userId: number): Promise<User | undefined> {
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

export async function updateMemberProfile(
  userId: number,
  data: { first_name?: string; last_name?: string; phone?: string; province?: string }
): Promise<User | undefined> {
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
  await updateStoreAsync((store) => {
    const user = store.users?.find((u) => u.id === userId);
    if (user) user.status = "suspended";
  });
}

export async function getAllUsers(): Promise<User[]> {
  const store = await getStoreAsync();
  return [...store.users].reverse();
}

/** Dates de création (created_at brutes) de tous les utilisateurs. */
export async function listUserCreationDates(): Promise<string[]> {
  const store = await getStoreAsync();
  return store.users.map((u) => u.created_at);
}

/** Nombre de comptes « famille », optionnellement filtrés par province. */
export async function countFamilyUsers(
  province?: string | null
): Promise<number> {
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
  const store = await getStoreAsync();
  return store.help_requests
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
  const store = await getStoreAsync();
  return store.help_request_updates.filter((u) => u.help_request_id === helpRequestId);
}
