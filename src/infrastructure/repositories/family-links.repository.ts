import {
  getStoreAsync,
  updateStoreAsync,
  nextId,
} from "@/infrastructure/persistence/store-access";
import { domainError } from "@/domain/errors/domain-error";
import type { FamilyLink } from "@/domain/entities/v2";
import { getUserByEmail, getUserById } from "@/infrastructure/repositories/users.repository";

export async function getFamilyLinksForUser(userId: number): Promise<FamilyLink[]> {
  const store = await getStoreAsync();
  return store.family_links.filter(
    (l) => l.parent_user_id === userId || l.child_user_id === userId
  );
}

export async function requestFamilyLinkByParent(data: {
  parent_user_id: number;
  child_email: string;
  relationship: string;
}): Promise<FamilyLink> {
  const child = await getUserByEmail(data.child_email);
  if (!child) throw domainError("CHILD_NOT_FOUND");
  if (child.id === data.parent_user_id) throw domainError("SELF_LINK");

  const parent = await getUserById(data.parent_user_id);
  if (!parent || parent.membership_type !== "famille") {
    throw domainError("NOT_FAMILY_PARENT");
  }

  let created!: FamilyLink;
  await updateStoreAsync((store) => {
    const exists = store.family_links.some(
      (l) =>
        l.parent_user_id === data.parent_user_id &&
        l.child_user_id === child.id &&
        l.status !== "rejected"
    );
    if (exists) throw domainError("LINK_EXISTS");

    created = {
      id: nextId(store),
      parent_user_id: data.parent_user_id,
      child_user_id: child.id,
      relationship: data.relationship,
      status: "pending_child",
      initiated_by: "parent",
      created_at: new Date().toISOString(),
    };
    store.family_links.push(created);
  });
  return created!;
}

export async function requestFamilyLinkByChild(data: {
  child_user_id: number;
  parent_email: string;
  relationship: string;
}): Promise<FamilyLink> {
  const parent = await getUserByEmail(data.parent_email);
  if (!parent) throw domainError("PARENT_NOT_FOUND");
  if (parent.id === data.child_user_id) throw domainError("SELF_LINK");

  let created!: FamilyLink;
  await updateStoreAsync((store) => {
    const exists = store.family_links.some(
      (l) =>
        l.parent_user_id === parent.id &&
        l.child_user_id === data.child_user_id &&
        l.status !== "rejected"
    );
    if (exists) throw domainError("LINK_EXISTS");

    created = {
      id: nextId(store),
      parent_user_id: parent.id,
      child_user_id: data.child_user_id,
      relationship: data.relationship,
      status: "pending_parent",
      initiated_by: "child",
      created_at: new Date().toISOString(),
    };
    store.family_links.push(created);
  });
  return created!;
}

export async function respondFamilyLink(
  linkId: number,
  userId: number,
  approve: boolean
): Promise<void> {
  await updateStoreAsync((store) => {
    const link = store.family_links.find((l) => l.id === linkId);
    if (!link) throw domainError("NOT_FOUND");

    if (link.status === "pending_child" && link.child_user_id !== userId) {
      throw domainError("FORBIDDEN");
    }
    if (link.status === "pending_parent" && link.parent_user_id !== userId) {
      throw domainError("FORBIDDEN");
    }

    link.status = approve ? "approved" : "rejected";
  });
}

export async function adminApproveFamilyLink(linkId: number): Promise<void> {
  await updateStoreAsync((store) => {
    const link = store.family_links.find((l) => l.id === linkId);
    if (link) link.status = "approved";
  });
}

export async function adminRejectFamilyLink(linkId: number): Promise<void> {
  await updateStoreAsync((store) => {
    const link = store.family_links.find((l) => l.id === linkId);
    if (link) link.status = "rejected";
  });
}

export async function getAllFamilyLinks(): Promise<FamilyLink[]> {
  const store = await getStoreAsync();
  return [...store.family_links].reverse();
}
