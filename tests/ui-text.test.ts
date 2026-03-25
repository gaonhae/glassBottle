import { describe, expect, it } from "vitest";

import { getUiErrorCode, getUiErrorMessage } from "@/lib/ui-text";

describe("getUiErrorCode", () => {
  it("maps Supabase password minimum-length errors to the weak-password code", () => {
    expect(getUiErrorCode("Password should be at least 6 characters")).toBe("auth-weak-password");
    expect(getUiErrorCode("Password must be at least 6 characters")).toBe("auth-weak-password");
  });
});

describe("getUiErrorMessage", () => {
  it("returns a generic project-password-policy message for weak passwords", () => {
    expect(getUiErrorMessage("Password must be at least 6 characters")).toBe(
      "\uBE44\uBC00\uBC88\uD638\uAC00 \uD504\uB85C\uC81D\uD2B8 \uBCF4\uC548 \uC815\uCC45\uC744 \uCDA9\uC871\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
    );
  });
});
