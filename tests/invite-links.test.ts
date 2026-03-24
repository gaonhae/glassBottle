import { describe, expect, it } from "vitest";

import { getAuthPath, getInvitePath, getInviteUrl, normalizeInviteCode, sanitizeNextPath } from "@/lib/invite-links";

describe("normalizeInviteCode", () => {
  it("trims and uppercases invite codes", () => {
    expect(normalizeInviteCode(" abcd2345 ")).toBe("ABCD2345");
  });
});

describe("getInvitePath", () => {
  it("builds a normalized invite path", () => {
    expect(getInvitePath("abcd2345")).toBe("/invite/ABCD2345");
  });
});

describe("getInviteUrl", () => {
  it("builds an absolute invite url from the site url", () => {
    expect(getInviteUrl("abcd2345", "https://glassbottle.app")).toBe("https://glassbottle.app/invite/ABCD2345");
  });
});

describe("sanitizeNextPath", () => {
  it("accepts internal paths", () => {
    expect(sanitizeNextPath("/invite/ABCD2345", "/onboarding")).toBe("/invite/ABCD2345");
  });

  it("rejects external urls", () => {
    expect(sanitizeNextPath("https://evil.example", "/onboarding")).toBe("/onboarding");
    expect(sanitizeNextPath("//evil.example", "/onboarding")).toBe("/onboarding");
  });

  it("falls back when the value is missing", () => {
    expect(sanitizeNextPath("", "/onboarding")).toBe("/onboarding");
  });
});

describe("getAuthPath", () => {
  it("preserves mode and next path", () => {
    expect(getAuthPath({ mode: "signup", nextPath: "/invite/ABCD2345" })).toBe(
      "/auth?mode=signup&next=%2Finvite%2FABCD2345"
    );
  });

  it("includes success and error parameters when provided", () => {
    expect(getAuthPath({ mode: "login", nextPath: "/invite/ABCD2345", success: "signup-created" })).toBe(
      "/auth?mode=login&next=%2Finvite%2FABCD2345&success=signup-created"
    );
  });
});