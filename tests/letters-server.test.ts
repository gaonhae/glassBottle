import { describe, expect, it, vi } from "vitest";

import { promoteDueLetters, type DeliveredLetter, type LetterPromotionStore } from "@/lib/letters-server";

function createLetterStore(overrides: Partial<LetterPromotionStore> = {}): LetterPromotionStore {
  return {
    listDueLettersForUser: vi.fn(async () => []),
    markDelivered: vi.fn(async (ids) => ids.map((id) => ({ id, family_id: "family-1" }) satisfies DeliveredLetter)),
    ...overrides
  };
}

describe("promoteDueLetters", () => {
  it("does nothing when there are no due letters", async () => {
    const store = createLetterStore();

    const promoted = await promoteDueLetters(store, "user-1", new Date("2026-03-25T00:00:00.000Z"));

    expect(promoted).toEqual([]);
    expect(store.markDelivered).not.toHaveBeenCalled();
  });

  it("promotes due letters grouped by scheduled_at and preserves delivered_at", async () => {
    const store = createLetterStore({
      listDueLettersForUser: vi.fn(async () => [
        { id: "letter-1", scheduled_at: "2026-03-25T09:00:00.000Z", family_id: "family-1" },
        { id: "letter-2", scheduled_at: "2026-03-25T09:00:00.000Z", family_id: "family-1" },
        { id: "letter-3", scheduled_at: "2026-03-25T10:00:00.000Z", family_id: "family-1" }
      ])
    });

    const promoted = await promoteDueLetters(store, "user-1", new Date("2026-03-25T12:00:00.000Z"));

    expect(promoted).toEqual([
      { id: "letter-1", family_id: "family-1" },
      { id: "letter-2", family_id: "family-1" },
      { id: "letter-3", family_id: "family-1" }
    ]);
    expect(store.markDelivered).toHaveBeenCalledTimes(2);
    expect(store.markDelivered).toHaveBeenNthCalledWith(1, ["letter-1", "letter-2"], "2026-03-25T09:00:00.000Z");
    expect(store.markDelivered).toHaveBeenNthCalledWith(2, ["letter-3"], "2026-03-25T10:00:00.000Z");
  });

  it("passes the request timestamp to the due-letter lookup", async () => {
    const store = createLetterStore();
    const now = new Date("2026-03-25T12:34:56.000Z");

    await promoteDueLetters(store, "user-1", now);

    expect(store.listDueLettersForUser).toHaveBeenCalledWith("user-1", "2026-03-25T21:34:56.000+09:00");
  });
});
