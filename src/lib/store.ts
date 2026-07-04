export type {
  News,
  Study,
  Campaign,
  Partner,
  Testimonial,
  Action,
  PressRelease,
} from "@/domain/entities/content";
export type { Store } from "@/domain/entities/store";
export type {
  User,
  FamilyLink,
  Donation,
  Petition,
  PetitionSignature,
  HelpRequestUpdate,
  PasswordResetToken,
  LiveEvent,
  LiveChatMessage,
  LivePoll,
  LivePollVote,
  PushSubscription,
} from "@/domain/entities";

export {
  getStoreAsync,
  updateStoreAsync,
  getStore,
  updateStore,
  nextId,
} from "@/infrastructure/persistence/store-access";

export {
  slugify,
  loadSeedStore,
} from "@/infrastructure/persistence/store-seed";

export { bootstrapPostgresStore } from "@/infrastructure/persistence/postgres-store.adapter";

/** @deprecated No-op — le cache PG est géré par postgresStoreAdapter */
export function hydrateStoreFromPostgres(): void {
  // conservé pour compatibilité imports existants
}
