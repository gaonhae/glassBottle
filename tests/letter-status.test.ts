import { describe, expect, it } from "vitest";

import { canTransition, type LetterStatus } from "@/lib/letter-status";

describe("canTransition", () => {
  const validCases: Array<[LetterStatus, LetterStatus]> = [
    ["scheduled", "scheduled"],
    ["scheduled", "delivered"],
    ["scheduled", "canceled"],
    ["delivered", "read"],
    ["read", "read"],
    ["canceled", "canceled"]
  ];

  validCases.forEach(([from, to]) => {
    it(`allows ${from} -> ${to}`, () => {
      expect(canTransition(from, to)).toBe(true);
    });
  });

  const invalidCases: Array<[LetterStatus, LetterStatus]> = [
    ["delivered", "scheduled"],
    ["read", "delivered"],
    ["canceled", "delivered"],
    ["canceled", "read"],
    ["read", "canceled"]
  ];

  invalidCases.forEach(([from, to]) => {
    it(`rejects ${from} -> ${to}`, () => {
      expect(canTransition(from, to)).toBe(false);
    });
  });
});
