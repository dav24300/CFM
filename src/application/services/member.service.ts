import {
  registerUser,
  verifyUserPassword,
  updateMemberProfile,
  getUserByEmail,
  getUserById,
  getHelpRequestsForUser,
} from "@/infrastructure/repositories/users.repository";
import {
  requestFamilyLinkByParent,
  requestFamilyLinkByChild,
  respondFamilyLink,
  getFamilyLinksForUser,
} from "@/infrastructure/repositories/family-links.repository";
import { getDonationsForUser } from "@/infrastructure/repositories/donations.repository";
import {
  createMemberSession,
  destroyMemberSession,
  getCurrentMember,
  getMemberSessionUserId,
  toPublicUser,
} from "@/infrastructure/auth/member-auth";
import {
  sendRegistrationPendingEmail,
  sendPasswordResetEmail,
} from "@/infrastructure/email/nodemailer.adapter";
import {
  createPasswordResetToken,
  resetPasswordWithToken,
} from "@/infrastructure/auth/password-reset";
import type { MembershipType, PublicUser, User } from "@/domain/entities/v2";
import type { FamilyLink } from "@/domain/entities/v2";

export async function registerMember(
  data: Parameters<typeof registerUser>[0]
): Promise<{ userId: number; status: string }> {
  const user = await registerUser(data);
  await sendRegistrationPendingEmail(user.email, user.first_name);
  return { userId: user.id, status: user.status };
}

export async function loginMember(
  email: string,
  password: string
): Promise<PublicUser | null> {
  const user = await verifyUserPassword(email, password);
  if (!user) return null;
  await createMemberSession(user.id);
  return toPublicUser(user);
}

export async function logoutMember(): Promise<void> {
  await destroyMemberSession();
}

export async function getMemberProfile(): Promise<PublicUser | null> {
  return getCurrentMember();
}

export async function getMemberDashboard() {
  const user = await getCurrentMember();
  if (!user) return null;

  const helpRequests = (await getHelpRequestsForUser(user.id)).map((h) => ({
    id: h.id as number,
    need_type: String(h.need_type ?? "aide"),
    status: String(h.status ?? "new"),
    description: String(h.description ?? ""),
  }));

  const donations = (await getDonationsForUser(user.id)).map((d) => ({
    id: d.id,
    amount: d.amount,
    currency: d.currency,
    provider: d.provider,
    status: d.status,
  }));

  return { user, helpRequests, donations };
}

export async function updateProfile(
  userId: number,
  data: { first_name?: string; last_name?: string; phone?: string; province?: string }
): Promise<PublicUser | undefined> {
  const updated = await updateMemberProfile(userId, data);
  return updated ? toPublicUser(updated) : undefined;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await getUserByEmail(email);
  if (!user) return;
  const token = await createPasswordResetToken(user.id);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/membre/reinitialiser-mot-de-passe?token=${token}`;
  await sendPasswordResetEmail(user.email, user.first_name, resetUrl);
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await resetPasswordWithToken(token, newPassword);
}

export type FamilyLinkWithUsers = FamilyLink & {
  parent?: User;
  child?: User;
};

export async function getFamilyLinks(): Promise<FamilyLinkWithUsers[]> {
  const user = await getCurrentMember();
  if (!user) return [];
  const links = await getFamilyLinksForUser(user.id);
  return Promise.all(
    links.map(async (link) => ({
      ...link,
      parent: await getUserById(link.parent_user_id),
      child: await getUserById(link.child_user_id),
    }))
  );
}

export async function manageFamilyLink(
  userId: number,
  body: Record<string, unknown>
): Promise<FamilyLink | void> {
  const { action } = body;

  if (action === "parent_invite") {
    return requestFamilyLinkByParent({
      parent_user_id: userId,
      child_email: body.child_email as string,
      relationship: body.relationship as string,
    });
  }

  if (action === "child_request") {
    return requestFamilyLinkByChild({
      child_user_id: userId,
      parent_email: body.parent_email as string,
      relationship: body.relationship as string,
    });
  }

  if (action === "respond") {
    await respondFamilyLink(body.link_id as number, userId, body.approve === true);
    return;
  }

  throw new Error("UNKNOWN_ACTION");
}

export { getMemberSessionUserId, getCurrentMember, toPublicUser };
export type { MembershipType };
