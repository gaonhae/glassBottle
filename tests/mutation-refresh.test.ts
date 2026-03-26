import { describe, expect, it } from "vitest";

import { getMutationRefreshMarker } from "@/lib/mutation-refresh";

describe("getMutationRefreshMarker", () => {
  it("returns an empty marker when no watched param is present", () => {
    const searchParams = new URLSearchParams("error=comment-invalid-input");

    expect(getMutationRefreshMarker("/answers/answer-1", searchParams, ["commented"])).toBe("");
  });

  it("builds a marker from the watched success param", () => {
    const searchParams = new URLSearchParams("commented=1");

    expect(getMutationRefreshMarker("/answers/answer-1", searchParams, ["commented"])).toBe(
      "/answers/answer-1?commented=1"
    );
  });

  it("includes only watched params in the marker", () => {
    const searchParams = new URLSearchParams("sent=1&error=letter-invalid-input&updated=1");

    expect(getMutationRefreshMarker("/outbox", searchParams, ["sent"])).toBe("/outbox?sent=1");
  });
});
