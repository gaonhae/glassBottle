import { randomInt } from "node:crypto";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { formatSeoulDate, formatSeoulDateTime } from "@/lib/time";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateInviteCode(length = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < length; i += 1) {
    code += alphabet[randomInt(0, alphabet.length)];
  }

  return code;
}

export function formatDateTime(value: string | null): string {
  return formatSeoulDateTime(value);
}

export function formatDate(value: string): string {
  return formatSeoulDate(value);
}

export function snippet(text: string, maxLength = 80): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}
