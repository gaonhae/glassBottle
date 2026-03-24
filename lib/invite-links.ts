export type AuthMode = "login" | "signup";

export function normalizeInviteCode(inviteCode: string): string {
  return inviteCode.trim().toUpperCase();
}

export function getInvitePath(inviteCode: string): string {
  return `/invite/${encodeURIComponent(normalizeInviteCode(inviteCode))}`;
}

export function getInviteUrl(inviteCode: string, siteUrl: string): string {
  return new URL(getInvitePath(inviteCode), siteUrl).toString();
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