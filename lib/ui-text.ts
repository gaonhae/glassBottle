import type { LetterStatus } from "@/lib/letter-status";

export const BRAND_NAME = "glassbottle";

const letterStatusLabels: Record<LetterStatus, string> = {
  scheduled: "예약됨",
  delivered: "전달됨",
  read: "읽음",
  canceled: "취소됨"
};

const uiErrorMessages = {
  "auth-invalid-input": "이메일과 비밀번호를 다시 확인해 주세요.",
  "auth-signup-invalid-input": "회원가입 정보를 다시 확인해 주세요.",
  "auth-invalid-credentials": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "auth-email-not-confirmed": "이메일 인증을 완료한 뒤 로그인해 주세요.",
  "auth-user-already-registered": "이미 가입된 이메일입니다.",
  "auth-weak-password": "비밀번호는 8자 이상으로 입력해 주세요.",
  "auth-password-mismatch": "비밀번호가 서로 일치하지 않습니다.",
  "auth-email-invalid": "이메일 형식을 다시 확인해 주세요.",
  "auth-rate-limit": "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  "onboarding-invalid-create-input": "가족 생성 정보를 다시 확인해 주세요.",
  "onboarding-invalid-join-input": "가족 참여 정보를 다시 확인해 주세요.",
  "onboarding-invalid-invite-code": "유효하지 않은 초대 코드입니다.",
  "onboarding-family-full": "가족 인원 제한에 도달했습니다.",
  "onboarding-invite-code-generation-failed": "초대 코드 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
  "letter-invalid-input": "편지 내용을 다시 확인해 주세요.",
  "letter-invalid-recipient": "받는 사람을 다시 선택해 주세요.",
  "letter-invalid-update-input": "수정할 편지 정보를 다시 확인해 주세요.",
  "letter-update-window-expired": "수정 가능 시간이 지났습니다.",
  "letter-invalid-cancel-input": "취소할 편지 정보를 다시 확인해 주세요.",
  "letter-cancel-window-expired": "취소 가능 시간이 지났습니다.",
  "settings-invalid-display-name": "표시 이름을 다시 확인해 주세요.",
  "data-duplicate-value": "이미 등록된 정보입니다.",
  "unexpected-error": "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."
} as const;

type UiErrorCode = keyof typeof uiErrorMessages;

const uiErrorCodeByPattern: Array<[string, UiErrorCode]> = [
  ["Passwords must match", "auth-password-mismatch"],
  ["Invalid login credentials", "auth-invalid-credentials"],
  ["Email not confirmed", "auth-email-not-confirmed"],
  ["User already registered", "auth-user-already-registered"],
  ["Password should be at least", "auth-weak-password"],
  ["Password must be at least", "auth-weak-password"],
  ["Unable to validate email address", "auth-email-invalid"],
  ["Email rate limit exceeded", "auth-rate-limit"],
  ["Invalid invite code", "onboarding-invalid-invite-code"],
  ["Family member limit reached", "onboarding-family-full"],
  ["Update window expired.", "letter-update-window-expired"],
  ["Cancel window expired.", "letter-cancel-window-expired"],
  ["duplicate key value violates unique constraint", "data-duplicate-value"]
];

export function getLetterStatusLabel(status: LetterStatus | string): string {
  return letterStatusLabels[status as LetterStatus] ?? "상태 확인 필요";
}

export function getFamilyRoleLabel(isOwner: boolean): string {
  return isOwner ? "가족 관리자" : "가족 구성원";
}

export function getUiErrorCode(error: string): UiErrorCode {
  const normalized = error.trim();

  if (!normalized) {
    return "unexpected-error";
  }

  if (normalized in uiErrorMessages) {
    return normalized as UiErrorCode;
  }

  const matchedEntry = uiErrorCodeByPattern.find(([pattern]) => normalized.includes(pattern));
  return matchedEntry?.[1] ?? "unexpected-error";
}

export function getUiErrorMessage(error: string): string {
  return uiErrorMessages[getUiErrorCode(error)];
}
