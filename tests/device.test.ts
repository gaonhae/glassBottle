import { describe, expect, it } from "vitest";

import { isSupportedDeviceType, normalizeDeviceType } from "@/lib/device";

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
