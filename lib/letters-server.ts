import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { toSeoulIsoOffsetString } from "@/lib/time";

type DueLetter = {
  id: string;
  scheduled_at: string;
};

export type LetterPromotionStore = {
  listDueLettersForUser(userId: string, nowIso: string): Promise<DueLetter[]>;
  markDelivered(ids: string[], deliveredAt: string): Promise<number>;
};

export async function promoteDueLetters(
  store: LetterPromotionStore,
  userId: string,
  now = new Date()
): Promise<number> {
  const dueLetters = await store.listDueLettersForUser(userId, toSeoulIsoOffsetString(now));

  if (dueLetters.length === 0) {
    return 0;
  }

  const idsByScheduledAt = new Map<string, string[]>();

  for (const letter of dueLetters) {
    const ids = idsByScheduledAt.get(letter.scheduled_at) ?? [];
    ids.push(letter.id);
    idsByScheduledAt.set(letter.scheduled_at, ids);
  }

  let promotedCount = 0;

  for (const [scheduledAt, ids] of idsByScheduledAt) {
    promotedCount += await store.markDelivered(ids, scheduledAt);
  }

  return promotedCount;
}

export function createSupabaseLetterPromotionStore(): LetterPromotionStore {
  const admin = createSupabaseAdminClient();

  return {
    async listDueLettersForUser(userId, nowIso) {
      const { data, error } = await admin
        .from("letters")
        .select("id, scheduled_at")
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
        return 0;
      }

      const { data, error } = await admin
        .from("letters")
        .update({
          status: "delivered",
          delivered_at: deliveredAt
        })
        .in("id", ids)
        .eq("status", "scheduled")
        .select("id");

      if (error) {
        throw new Error(error.message);
      }

      return data?.length ?? 0;
    }
  };
}

export async function promoteDueLettersForUser(userId: string, now = new Date()) {
  return promoteDueLetters(createSupabaseLetterPromotionStore(), userId, now);
}
