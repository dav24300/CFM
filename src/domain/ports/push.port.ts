import type { PushTopic } from "@/domain/entities/v3";

export interface PushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  topics: PushTopic[];
}

export interface PushPort {
  getVapidPublicKey(): string | null;
  subscribe(input: PushSubscriptionInput): void;
  sendToTopic(topic: PushTopic, title: string, body: string): Promise<void>;
}
