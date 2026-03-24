import { describe, expect, it } from "vitest";

import { canRevealFamilyAnswers, getQuestionPublishDate, getQuestionTemplateIndex } from "@/lib/questions";

describe("getQuestionPublishDate", () => {
  it("uses Asia/Seoul date even when UTC date is different", () => {
    expect(getQuestionPublishDate(new Date("2026-03-24T15:30:00.000Z"))).toBe("2026-03-25");
  });
});

describe("getQuestionTemplateIndex", () => {
  it("returns a stable template index for a given publish date", () => {
    expect(getQuestionTemplateIndex("2026-03-25", 12)).toBeGreaterThanOrEqual(0);
    expect(getQuestionTemplateIndex("2026-03-25", 12)).toBeLessThan(12);
    expect(getQuestionTemplateIndex("2026-03-25", 12)).toBe(getQuestionTemplateIndex("2026-03-25", 12));
  });

  it("throws when there are no templates", () => {
    expect(() => getQuestionTemplateIndex("2026-03-25", 0)).toThrow();
  });
});

describe("canRevealFamilyAnswers", () => {
  it("reveals answers only after the user has answered", () => {
    expect(canRevealFamilyAnswers(true)).toBe(true);
    expect(canRevealFamilyAnswers(false)).toBe(false);
  });
});
