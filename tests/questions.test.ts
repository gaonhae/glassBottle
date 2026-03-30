import { describe, expect, it } from "vitest";

import { canRevealFamilyAnswers, getQuestionPublishDate, getQuestionTemplateIndex, splitQuestionsForDisplay } from "@/lib/questions";

describe("getQuestionPublishDate", () => {
  it("uses Asia/Seoul date even when UTC date is different", () => {
    expect(getQuestionPublishDate(new Date("2026-03-24T15:30:00.000Z"))).toBe("2026-03-25");
  });
});

describe("getQuestionTemplateIndex", () => {
  it("maps 2026-03-26 to the first template", () => {
    expect(getQuestionTemplateIndex("2026-03-26", 10)).toBe(0);
  });

  it("advances one template per day after 2026-03-26", () => {
    expect(getQuestionTemplateIndex("2026-03-27", 10)).toBe(1);
    expect(getQuestionTemplateIndex("2026-03-28", 10)).toBe(2);
  });

  it("remains stable for the same publish date", () => {
    expect(getQuestionTemplateIndex("2026-03-26", 10)).toBe(getQuestionTemplateIndex("2026-03-26", 10));
  });

  it("throws when there are no templates", () => {
    expect(() => getQuestionTemplateIndex("2026-03-26", 0)).toThrow();
  });
});

describe("canRevealFamilyAnswers", () => {
  it("reveals answers only after the user has answered", () => {
    expect(canRevealFamilyAnswers(true)).toBe(true);
    expect(canRevealFamilyAnswers(false)).toBe(false);
  });
});

describe("splitQuestionsForDisplay", () => {
  it("uses the newest question as today and excludes it from past questions", () => {
    const questionRows = [
      {
        id: "today-question",
        prompt_text: "Today",
        publish_date: "2026-03-25",
        created_at: "2026-03-25T00:00:00.000Z"
      },
      {
        id: "older-question",
        prompt_text: "Older",
        publish_date: "2026-03-24",
        created_at: "2026-03-24T00:00:00.000Z"
      }
    ];

    expect(splitQuestionsForDisplay(questionRows)).toEqual({
      todayQuestion: questionRows[0],
      pastQuestions: [questionRows[1]]
    });
  });

  it("returns no today question when the list is empty", () => {
    expect(splitQuestionsForDisplay([])).toEqual({
      todayQuestion: null,
      pastQuestions: []
    });
  });
});
