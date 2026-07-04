import {
  addContactMessage,
  addNewsletter,
  addMembership,
  addHelpRequest,
} from "@/infrastructure/repositories/content.repository";
import {
  sendHelpRequestReceivedEmail,
} from "@/infrastructure/email/nodemailer.adapter";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import { encryptSensitive } from "@/infrastructure/encryption/aes.adapter";
import { domainError } from "@/domain/errors/domain-error";

export async function submitContact(data: {
  name: string;
  email: string;
  subject?: string;
  message: string;
  type?: string;
}): Promise<void> {
  await addContactMessage(data);
}

export async function subscribeNewsletter(email: string): Promise<void> {
  await addNewsletter(email);
}

export async function submitMembership(data: {
  type: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  province?: string;
  military_link?: string;
  parent_military_name?: string;
  skills?: string;
  message?: string;
}): Promise<void> {
  await addMembership(data);
}

export async function submitHelpRequest(body: Record<string, unknown>): Promise<void> {
  const {
    first_name,
    last_name,
    phone,
    province,
    need_type,
    description,
  } = body as {
    first_name?: string;
    last_name?: string;
    phone?: string;
    province?: string;
    need_type?: string;
    description?: string;
    email?: string;
    is_minor?: boolean;
    parental_consent?: boolean;
    age?: number;
    military_status?: string;
  };

  if (!first_name || !last_name || !phone || !province || !need_type || !description) {
    throw domainError("MISSING_FIELDS");
  }

  if (body.is_minor && !body.parental_consent) {
    throw domainError("PARENTAL_CONSENT_REQUIRED");
  }

  const member = await getCurrentMember();

  await addHelpRequest({
    first_name,
    last_name,
    email: (body.email as string) || null,
    phone: encryptSensitive(phone),
    province,
    age: (body.age as number) || null,
    is_minor: body.is_minor ? 1 : 0,
    parental_consent: body.parental_consent ? 1 : 0,
    military_status: (body.military_status as string) || null,
    need_type,
    description: encryptSensitive(description),
    confidential: 1,
    user_id: member?.id ?? null,
  });

  if (body.email && typeof body.email === "string") {
    await sendHelpRequestReceivedEmail(body.email, first_name);
  }
}
