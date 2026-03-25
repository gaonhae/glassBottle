export type DeviceType = "mobile" | "tablet" | "desktop" | "other";

type DeviceRedirect =
  | {
      pathname: "/prompts";
    }
  | {
      pathname: "/unsupported-device";
      from: string;
    };

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

export function getDeviceRedirect(pathname: string, deviceType?: string): DeviceRedirect | null {
  if (pathname === "/unsupported-device") {
    return isSupportedDeviceType(deviceType) ? { pathname: "/prompts" } : null;
  }

  if (isSupportedDeviceType(deviceType)) {
    return null;
  }

  return {
    pathname: "/unsupported-device",
    from: pathname
  };
}
