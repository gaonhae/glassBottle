import { describe, expect, it } from "vitest";

import {
  AUTH_EMAIL_FORMAT_HINT,
  AUTH_EMAIL_PLACEHOLDER,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS_HINT
} from "@/lib/password-policy";

describe("password policy", () => {
  it("defines the supported signup password length range", () => {
    expect(PASSWORD_MIN_LENGTH).toBe(6);
    expect(PASSWORD_MAX_LENGTH).toBe(72);
  });

  it("documents the expected email format with the shared placeholder", () => {
    expect(AUTH_EMAIL_FORMAT_HINT).toContain(AUTH_EMAIL_PLACEHOLDER);
  });

  it("documents the shared password requirements", () => {
    expect(PASSWORD_REQUIREMENTS_HINT).toContain(`${PASSWORD_MIN_LENGTH}자 이상`);
    expect(PASSWORD_REQUIREMENTS_HINT).toContain(`${PASSWORD_MAX_LENGTH}자 이하`);
  });
});
