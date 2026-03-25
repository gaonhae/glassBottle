import { env } from "@/lib/env";

export const INVITE_CODE_MIN_LENGTH = 6;
export const INVITE_CODE_MAX_LENGTH = 16;

export function normalizeInviteCode(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidInviteCode(value: string): boolean {
  const normalized = normalizeInviteCode(value);

  return (
    normalized.length >= INVITE_CODE_MIN_LENGTH &&
    normalized.length <= INVITE_CODE_MAX_LENGTH &&
    /^[A-Z0-9]+$/.test(normalized)
  );
}

export function getSafeNextPath(value: FormDataEntryValue | string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  return trimmed;
}

export function buildAuthPath(options: {
  mode?: "login" | "signup";
  next?: string | null;
  error?: string | null;
  success?: string | null;
}): string {
  const params = new URLSearchParams();
  params.set("mode", options.mode ?? "login");

  if (options.next) {
    params.set("next", options.next);
  }

  if (options.error) {
    params.set("error", options.error);
  }

  if (options.success) {
    params.set("success", options.success);
  }

  return `/auth?${params.toString()}`;
}

export function buildInvitePath(inviteCode: string): string {
  return `/invite/${normalizeInviteCode(inviteCode)}`;
}

export function buildInviteUrl(inviteCode: string, siteUrl = env.NEXT_PUBLIC_SITE_URL): string {
  return new URL(buildInvitePath(inviteCode), siteUrl).toString();
}

export function buildOnboardingPath(options: {
  mode?: "create" | "join";
  inviteCode?: string | null;
  error?: string | null;
  notice?: string | null;
}): string {
  const params = new URLSearchParams();

  if (options.mode) {
    params.set("mode", options.mode);
  }

  if (options.inviteCode) {
    params.set("inviteCode", normalizeInviteCode(options.inviteCode));
  }

  if (options.error) {
    params.set("error", options.error);
  }

  if (options.notice) {
    params.set("notice", options.notice);
  }

  const query = params.toString();
  return query ? `/onboarding?${query}` : "/onboarding";
}
