import { describe, expect, it } from "vitest";

import {
  buildAuthPath,
  buildInvitePath,
  buildInviteUrl,
  buildOnboardingPath,
  getSafeNextPath,
  isValidInviteCode,
  normalizeInviteCode
} from "@/lib/invite";

describe("invite helpers", () => {
  it("normalizes invite codes", () => {
    expect(normalizeInviteCode(" abcd2345 ")).toBe("ABCD2345");
  });

  it("validates invite code length and format", () => {
    expect(isValidInviteCode("ABCD2345")).toBe(true);
    expect(isValidInviteCode("abc")).toBe(false);
    expect(isValidInviteCode("ABC-1234")).toBe(false);
  });

  it("accepts only safe relative next paths", () => {
    expect(getSafeNextPath("/invite/ABCD2345")).toBe("/invite/ABCD2345");
    expect(getSafeNextPath("https://example.com")).toBeNull();
    expect(getSafeNextPath("//evil.example.com")).toBeNull();
  });

  it("builds auth paths with next", () => {
    expect(buildAuthPath({ mode: "signup", next: "/invite/ABCD2345" })).toBe(
      "/auth?mode=signup&next=%2Finvite%2FABCD2345"
    );
  });

  it("builds onboarding join paths with notice and invite code", () => {
    expect(buildOnboardingPath({ mode: "join", inviteCode: "abcd2345", notice: "invite-link-ready" })).toBe(
      "/onboarding?mode=join&inviteCode=ABCD2345&notice=invite-link-ready"
    );
  });

  it("builds invite path and absolute url", () => {
    expect(buildInvitePath("abcd2345")).toBe("/invite/ABCD2345");
    expect(buildInviteUrl("abcd2345", "https://glassbottle.example")).toBe("https://glassbottle.example/invite/ABCD2345");
  });
});
