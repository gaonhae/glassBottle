import { describe, expect, it, vi } from "vitest";

import { ensureQuestionForDate, type QuestionStore } from "@/lib/questions-server";

function createQuestionStore(overrides: Partial<QuestionStore> = {}): QuestionStore {
  return {
    getQuestionByPublishDate: vi.fn(async () => null),
    listTemplates: vi.fn(async () => [
      { id: "template-1", body_text: "Question 1", sort_order: 1 },
      { id: "template-2", body_text: "Question 2", sort_order: 2 }
    ]),
    insertQuestion: vi.fn(async ({ publishDate }) => ({
      id: "question-1",
      publish_date: publishDate
    })),
    ...overrides
  };
}

describe("ensureQuestionForDate", () => {
  it("reuses an existing question for the same publish date", async () => {
    const store = createQuestionStore({
      getQuestionByPublishDate: vi.fn(async () => ({
        id: "existing-question",
        publish_date: "2026-03-25"
      }))
    });

    const question = await ensureQuestionForDate(store, "2026-03-25");

    expect(question).toEqual({
      id: "existing-question",
      publish_date: "2026-03-25"
    });
    expect(store.listTemplates).not.toHaveBeenCalled();
    expect(store.insertQuestion).not.toHaveBeenCalled();
  });

  it("creates a question when none exists", async () => {
    const store = createQuestionStore();

    const question = await ensureQuestionForDate(store, "2026-03-25");

    expect(question).toEqual({
      id: "question-1",
      publish_date: "2026-03-25"
    });
    expect(store.insertQuestion).toHaveBeenCalledTimes(1);
  });

  it("re-reads the created question after a duplicate insert race", async () => {
    const getQuestionByPublishDate = vi
      .fn<Required<QuestionStore>["getQuestionByPublishDate"]>()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "raced-question",
        publish_date: "2026-03-25"
      });

    const store = createQuestionStore({
      getQuestionByPublishDate,
      insertQuestion: vi.fn(async () => {
        throw {
          code: "23505",
          message: 'duplicate key value violates unique constraint "questions_publish_date_key"'
        };
      })
    });

    const question = await ensureQuestionForDate(store, "2026-03-25");

    expect(question).toEqual({
      id: "raced-question",
      publish_date: "2026-03-25"
    });
  });
});
