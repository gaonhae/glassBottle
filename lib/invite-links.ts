export type AuthMode = "login" | "signup";

type HeaderBag = Pick<Headers, "get">;

function readHeaderValue(headersList: HeaderBag, key: string): string | null {
  const value = headersList.get(key);

  if (!value) {
    return null;
  }

  const [firstValue] = value.split(",");
  const normalizedValue = firstValue?.trim();

  return normalizedValue ? normalizedValue : null;
}
export function normalizeInviteCode(inviteCode: string): string {
  return inviteCode.trim().toUpperCase();
}

export function getInvitePath(inviteCode: string): string {
  return `/invite/${encodeURIComponent(normalizeInviteCode(inviteCode))}`;
}

export function getInviteUrl(inviteCode: string, siteUrl: string): string {
  return new URL(getInvitePath(inviteCode), siteUrl).toString();
}

export function getRequestOrigin(headersList: HeaderBag, fallbackSiteUrl: string): string {
  const forwardedHost = readHeaderValue(headersList, "x-forwarded-host");
  const host = readHeaderValue(headersList, "host");
  const requestHost = forwardedHost ?? host;

  if (!requestHost) {
    return fallbackSiteUrl;
  }

  const forwardedProto = readHeaderValue(headersList, "x-forwarded-proto");
  const protocol =
    forwardedProto ?? (requestHost.includes("localhost") || requestHost.startsWith("127.0.0.1") ? "http" : "https");

  return `${protocol}://${requestHost}`;
}

export function sanitizeNextPath(nextPath: string | null | undefined, fallback = "/onboarding"): string {
  if (!nextPath) {
    return fallback;
  }

  const trimmed = nextPath.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  return trimmed;
}

export function getAuthPath(options: {
  mode?: AuthMode;
  nextPath?: string | null;
  error?: string;
  success?: string;
} = {}): string {
  const params = new URLSearchParams();
  params.set("mode", options.mode ?? "login");

  const nextPath = options.nextPath?.trim();
  if (nextPath) {
    params.set("next", nextPath);
  }

  if (options.error) {
    params.set("error", options.error);
  }

  if (options.success) {
    params.set("success", options.success);
  }

  return `/auth?${params.toString()}`;
}
