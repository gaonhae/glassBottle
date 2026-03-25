import { safeTrackAdminAnalyticsEvent } from "@/lib/analytics";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DueLetter = {
  id: string;
  scheduled_at: string;
  family_id: string;
};

export type DeliveredLetter = {
  id: string;
  family_id: string;
};

export type LetterPromotionStore = {
  listDueLettersForUser(userId: string, nowIso: string): Promise<DueLetter[]>;
  markDelivered(ids: string[], deliveredAt: string): Promise<DeliveredLetter[]>;
};

export async function promoteDueLetters(
  store: LetterPromotionStore,
  userId: string,
  now = new Date()
): Promise<DeliveredLetter[]> {
  const dueLetters = await store.listDueLettersForUser(userId, now.toISOString());

  if (dueLetters.length === 0) {
    return [];
  }

  const idsByScheduledAt = new Map<string, string[]>();

  for (const letter of dueLetters) {
    const ids = idsByScheduledAt.get(letter.scheduled_at) ?? [];
    ids.push(letter.id);
    idsByScheduledAt.set(letter.scheduled_at, ids);
  }

  const promotedLetters: DeliveredLetter[] = [];

  for (const [scheduledAt, ids] of idsByScheduledAt) {
    const deliveredLetters = await store.markDelivered(ids, scheduledAt);
    promotedLetters.push(...deliveredLetters);
  }

  return promotedLetters;
}

export function createSupabaseLetterPromotionStore(): LetterPromotionStore {
  const admin = createSupabaseAdminClient();

  return {
    async listDueLettersForUser(userId, nowIso) {
      const { data, error } = await admin
        .from("letters")
        .select("id, scheduled_at, family_id")
        .eq("status", "scheduled")
        .lte("scheduled_at", nowIso)
        .or(`recipient_user_id.eq.${userId},sender_user_id.eq.${userId}`);

      if (error) {
        throw new Error(error.message);
      }

      return data ?? [];
    },
    async markDelivered(ids, deliveredAt) {
      if (ids.length === 0) {
        return [];
      }

      const { data, error } = await admin
        .from("letters")
        .update({
          status: "delivered",
          delivered_at: deliveredAt
        })
        .in("id", ids)
        .eq("status", "scheduled")
        .select("id, family_id");

      if (error) {
        throw new Error(error.message);
      }

      return data ?? [];
    }
  };
}

export async function promoteDueLettersForUser(userId: string, now = new Date()) {
  const promotedLetters = await promoteDueLetters(createSupabaseLetterPromotionStore(), userId, now);

  for (const letter of promotedLetters) {
    await safeTrackAdminAnalyticsEvent({
      eventName: "bottleLetterDelivered",
      familyId: letter.family_id,
      properties: {
        letterId: letter.id
      }
    });
  }

  return promotedLetters.length;
}
