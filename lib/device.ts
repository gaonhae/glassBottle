export type DeviceType = "mobile" | "tablet" | "desktop" | "other";

export function normalizeDeviceType(deviceType?: string): DeviceType {
  if (deviceType === "mobile") {
    return "mobile";
  }

  if (deviceType === "tablet") {
    return "tablet";
  }

  if (!deviceType) {
    return "desktop";
  }

  return "other";
}

export function isSupportedDeviceType(deviceType?: string): boolean {
  return normalizeDeviceType(deviceType) === "mobile";
}
