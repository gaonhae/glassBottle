import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const analyticsEventNames = [
  "signupCompleted",
  "familyGroupCreated",
  "familyMemberJoined",
  "homeViewed",
  "questionViewed",
  "answerCreated",
  "answerCardClicked",
  "answerDetailViewed",
  "commentCreated",
  "bottleLetterCreated",
  "bottleLetterDelivered",
  "bottleLetterRead",
  "unsupportedDeviceViewed"
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

export type AnalyticsEventPayload = {
  eventName: AnalyticsEventName;
  userId?: string | null;
  familyId?: string | null;
  properties?: Record<string, unknown>;
};

export type AnalyticsEventRecord = {
  event_name: AnalyticsEventName;
  user_id: string | null;
  family_id: string | null;
  properties: Record<string, unknown>;
};

export type AnalyticsStore = {
  insert(record: AnalyticsEventRecord): Promise<void>;
};

type AnalyticsClient = Pick<SupabaseClient, "from">;

export function createSupabaseAnalyticsStore(client: AnalyticsClient): AnalyticsStore {
  return {
    async insert(record) {
      const { error } = await client.from("analytics_events").insert(record);

      if (error) {
        throw new Error(error.message);
      }
    }
  };
}

export async function trackAnalyticsEvent(store: AnalyticsStore, payload: AnalyticsEventPayload) {
  await store.insert({
    event_name: payload.eventName,
    user_id: payload.userId ?? null,
    family_id: payload.familyId ?? null,
    properties: payload.properties ?? {}
  });
}

export async function trackServerAnalyticsEvent(payload: AnalyticsEventPayload) {
  const client = await createSupabaseServerClient();
  await trackAnalyticsEvent(createSupabaseAnalyticsStore(client), payload);
}

export async function trackAdminAnalyticsEvent(payload: AnalyticsEventPayload) {
  const client = createSupabaseAdminClient();
  await trackAnalyticsEvent(createSupabaseAnalyticsStore(client), payload);
}

export async function safeTrackServerAnalyticsEvent(payload: AnalyticsEventPayload) {
  try {
    await trackServerAnalyticsEvent(payload);
  } catch {
    // Analytics must never block a user flow.
  }
}

export async function safeTrackAdminAnalyticsEvent(payload: AnalyticsEventPayload) {
  try {
    await trackAdminAnalyticsEvent(payload);
  } catch {
    // Analytics must never block a background flow or public page render.
  }
}
