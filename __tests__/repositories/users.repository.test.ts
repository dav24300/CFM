import { beforeEach, describe, expect, it, vi } from "vitest";

let mockStore: any;

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async () => "mock-hash"),
    compare: vi.fn(async () => true),
  },
}));

vi.mock("@/infrastructure/persistence/store-access", () => ({
  getStoreAsync: vi.fn(() => Promise.resolve(mockStore)),
  updateStoreAsync: vi.fn((mutator: (store: any) => void) => {
    mutator(mockStore);
    return Promise.resolve(mockStore);
  }),
  nextId: vi.fn(() => 42),
}));

vi.mock("@/infrastructure/encryption/aes.adapter", () => ({
  decryptHelpRequest: vi.fn((payload: Record<string, unknown>) => payload),
}));

import { activateUser, addHelpRequestUpdate, getHelpRequestUpdates } from "@/infrastructure/repositories/users.repository";
import {
  getAllUsers,
  getHelpRequestsForUser,
  getUserByEmail,
  getUserByPhoneE164,
  findUserByIdentifier,
  registerUser,
  setUserPassword,
  suspendUser,
  updateMemberProfile,
  verifyUserCredentials,
} from "@/infrastructure/repositories/users.repository";

describe("users.repository", () => {
  beforeEach(() => {
    mockStore = {
      users: [
        {
          id: 1,
          email: "user@cfm.org",
          password_hash: "hash",
          first_name: "Old",
          last_name: "Name",
          phone: "0101",
          membership_type: "famille",
          status: "pending",
          verified_at: null,
        },
      ],
      help_requests: [{ id: 100, status: "new", user_id: 1, email: "user@cfm.org", phone: "0101" }],
      help_request_updates: [],
      _counters: { global: 1 },
    };
  });

  it("activates user and sets verified date", async () => {
    const activated = await activateUser(1);
    expect(activated?.status).toBe("active");
    expect(activated?.verified_at).toBeTruthy();
    expect(mockStore.users[0].status).toBe("active");
  });

  it("creates help request update and mirrors status to request", async () => {
    const update = await addHelpRequestUpdate({
      help_request_id: 100,
      status: "processing",
      note: "Contacted family",
      updated_by: "admin",
    });

    expect(update).toMatchObject({
      id: 42,
      help_request_id: 100,
      status: "processing",
      note: "Contacted family",
      updated_by: "admin",
    });
    expect(mockStore.help_requests[0].status).toBe("processing");
    expect(await getHelpRequestUpdates(100)).toHaveLength(1);
  });

  it("registers user and validates credential flow", async () => {
    const created = await registerUser({
      email: "new@cfm.org",
      password: "longsecret",
      first_name: "New",
      last_name: "User",
      phone: "0812345670",
      membership_type: "soutien",
    });
    expect(created.email).toBe("new@cfm.org");
    expect(created.phone_e164).toBe("+243812345670");
    expect((await getUserByEmail("NEW@CFM.ORG"))?.id).toBe(created.id);
    const ok = await verifyUserCredentials("new@cfm.org", "longsecret");
    expect(ok?.id).toBe(created.id);
  });

  it("résout un compte par son numéro, toutes variantes confondues", async () => {
    mockStore.users.push({
      id: 5,
      email: null,
      password_hash: "hash",
      first_name: "Tel",
      last_name: "Seul",
      phone: "0812345678",
      phone_e164: "+243812345678",
      membership_type: "famille",
      status: "active",
      verified_at: null,
    });
    // Le numéro brut, la forme internationale et la forme espacée pointent tous
    // vers le même compte : la résolution normalise avant de chercher.
    for (const form of ["0812345678", "+243812345678", "243 81 234 56 78"]) {
      expect((await findUserByIdentifier(form))?.id, form).toBe(5);
    }
    expect((await getUserByPhoneE164("+243812345678"))?.id).toBe(5);
  });

  it("ne résout aucun compte pour un identifiant inconnu ou illisible", async () => {
    expect(await findUserByIdentifier("+243999999999")).toBeUndefined();
    expect(await findUserByIdentifier("pas-un-numero")).toBeUndefined();
    // Identifiant inconnu → null (le coût bcrypt constant est assuré par le
    // DUMMY_HASH ; le mock renvoie true, mais sans candidat on renvoie bien null).
    expect(await verifyUserCredentials("+243999999999", "x")).toBeNull();
  });

  it("updates profile, suspends user and exposes user collections", async () => {
    const updated = await updateMemberProfile(1, {
      first_name: "Jane",
      phone: "0900",
    });
    expect(updated?.first_name).toBe("Jane");
    expect(updated?.phone).toBe("0900");

    await suspendUser(1);
    expect(mockStore.users[0].status).toBe("suspended");
    expect(await getAllUsers()).toHaveLength(1);
  });

  it("returns help requests resolved for user identities", async () => {
    const list = await getHelpRequestsForUser(1);
    expect(list).toHaveLength(1);
  });

  it("setUserPassword remplace le hash ET horodate le changement (révocation)", async () => {
    expect(mockStore.users[0].password_changed_at ?? null).toBeNull();
    await setUserPassword(1, "nouveau-hash");
    expect(mockStore.users[0].password_hash).toBe("nouveau-hash");
    // password_changed_at doit être posé : c'est ce que getLoggedInMember
    // compare à l'émission de la session pour révoquer un accès antérieur.
    expect(mockStore.users[0].password_changed_at).toBeTruthy();
  });
});
