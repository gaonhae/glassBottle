import { describe, expect, it } from "vitest";

import {
  formatSeoulDate,
  formatSeoulDateTime,
  getSeoulDateKey,
  isFutureSeoulTime,
  parseSeoulDate,
  toSeoulIsoOffsetString
} from "@/lib/time";

describe("time helpers", () => {
  it("serializes instants with the Asia/Seoul offset", () => {
    expect(toSeoulIsoOffsetString(new Date("2026-03-24T15:30:45.123Z"))).toBe("2026-03-25T00:30:45.123+09:00");
  });

  it("builds the Seoul calendar date key from a UTC instant", () => {
    expect(getSeoulDateKey(new Date("2026-03-24T15:30:00.000Z"))).toBe("2026-03-25");
  });

  it("parses date-only values as Seoul midnight", () => {
    expect(parseSeoulDate("2026-03-25").toISOString()).toBe("2026-03-24T15:00:00.000Z");
  });

  it("formats date-only and date-time values in Seoul time", () => {
    expect(formatSeoulDate("2026-03-25")).toBe("2026년 3월 25일");

    const formatted = formatSeoulDateTime("2026-03-24T15:30:00.000Z");
    expect(formatted).toContain("2026년 3월 25일");
    expect(formatted).toContain("12:30");
  });

  it("checks future timestamps against the current instant", () => {
    const now = new Date("2026-03-25T00:00:00.000Z");

    expect(isFutureSeoulTime("2026-03-25T09:01:00.000+09:00", now)).toBe(true);
    expect(isFutureSeoulTime("2026-03-25T08:59:00.000+09:00", now)).toBe(false);
  });
});
