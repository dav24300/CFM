import {
  getStoreAsync,
  updateStoreAsync,
  nextId,
} from "@/infrastructure/persistence/store-access";
import type { MemberMessage } from "@/domain/entities/v4";

/** Fil de messages d'un membre, trié du plus ancien au plus récent. */
export async function getMessagesForUser(
  userId: number
): Promise<MemberMessage[]> {
  const store = await getStoreAsync();
  return (store.member_messages ?? [])
    .filter((m) => m.user_id === userId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

/**
 * Envoie un message du membre vers CFM (direction "out") et ajoute
 * un accusé de réception automatique du référent (direction "in").
 */
export async function sendMemberMessage(
  userId: number,
  data: { subject?: string; body: string }
): Promise<MemberMessage> {
  let created!: MemberMessage;
  await updateStoreAsync((store) => {
    if (!store.member_messages) store.member_messages = [];
    const now = new Date();

    created = {
      id: nextId(store),
      user_id: userId,
      direction: "out",
      author_name: "Vous",
      subject: data.subject?.trim() ? data.subject.trim() : null,
      body: data.body,
      read: 1,
      created_at: now.toISOString(),
    };
    store.member_messages.push(created);

    const ack: MemberMessage = {
      id: nextId(store),
      user_id: userId,
      direction: "in",
      author_name: "Référent CFM",
      subject: null,
      body: "Message bien reçu — un référent vous répondra sous 48h.",
      read: 0,
      // 1 ms après pour garantir l'ordre chronologique de l'accusé.
      created_at: new Date(now.getTime() + 1).toISOString(),
    };
    store.member_messages.push(ack);
  });
  return created!;
}

/** Marque comme lus tous les messages entrants ("in") du membre. */
export async function markMessagesRead(userId: number): Promise<void> {
  await updateStoreAsync((store) => {
    if (!store.member_messages) store.member_messages = [];
    for (const m of store.member_messages) {
      if (m.user_id === userId && m.direction === "in") m.read = 1;
    }
  });
}
