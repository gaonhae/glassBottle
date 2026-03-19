import { describe, expect, it } from "vitest";

import {
  MAX_DELAY_SECONDS,
  MIN_DELAY_SECONDS,
  computeSchedule,
  generateRandomDelaySeconds
} from "@/lib/delay";

describe("generateRandomDelaySeconds", () => {
  it("returns lower bound when randomizer returns 0", () => {
    expect(generateRandomDelaySeconds(() => 0)).toBe(MIN_DELAY_SECONDS);
  });

  it("returns upper bound when randomizer returns 1", () => {
    expect(generateRandomDelaySeconds(() => 1)).toBe(MAX_DELAY_SECONDS);
  });

  it("throws for out-of-range randomizer values", () => {
    expect(() => generateRandomDelaySeconds(() => -0.1)).toThrow();
    expect(() => generateRandomDelaySeconds(() => 1.1)).toThrow();
  });

  it("computes scheduled time based on sampled delay", () => {
    const now = new Date("2026-03-19T00:00:00.000Z");
    const { delaySeconds, scheduledAt } = computeSchedule(now, () => 0);

    expect(delaySeconds).toBe(MIN_DELAY_SECONDS);
    expect(scheduledAt.toISOString()).toBe("2026-03-19T05:00:00.000Z");
  });
});
