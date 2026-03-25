import { describe, expect, it } from "vitest";

import { getDeviceRedirect, isSupportedDeviceType, normalizeDeviceType } from "@/lib/device";

describe("normalizeDeviceType", () => {
  it("maps mobile explicitly", () => {
    expect(normalizeDeviceType("mobile")).toBe("mobile");
  });

  it("maps tablet explicitly", () => {
    expect(normalizeDeviceType("tablet")).toBe("tablet");
  });

  it("treats undefined as desktop", () => {
    expect(normalizeDeviceType(undefined)).toBe("desktop");
  });

  it("maps other device types into other", () => {
    expect(normalizeDeviceType("smarttv")).toBe("other");
  });
});

describe("isSupportedDeviceType", () => {
  it("allows only mobile", () => {
    expect(isSupportedDeviceType("mobile")).toBe(true);
    expect(isSupportedDeviceType("tablet")).toBe(false);
    expect(isSupportedDeviceType(undefined)).toBe(false);
  });
});

describe("getDeviceRedirect", () => {
  it("redirects non-mobile traffic into the unsupported-device page", () => {
    expect(getDeviceRedirect("/prompts", undefined)).toEqual({
      pathname: "/unsupported-device",
      from: "/prompts"
    });
  });

  it("keeps desktop visitors on the unsupported-device page", () => {
    expect(getDeviceRedirect("/unsupported-device", undefined)).toBeNull();
  });

  it("sends mobile visitors from unsupported-device into prompts", () => {
    expect(getDeviceRedirect("/unsupported-device", "mobile")).toEqual({
      pathname: "/prompts"
    });
  });

  it("allows mobile traffic to supported routes", () => {
    expect(getDeviceRedirect("/prompts", "mobile")).toBeNull();
  });
});
