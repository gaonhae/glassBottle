import type { LetterStatus } from "@/lib/letter-status";

export const BRAND_NAME = "glassbottle";

const letterStatusLabels: Record<LetterStatus, string> = {
  scheduled: "전송 대기",
  delivered: "도착",
  read: "읽음",
  canceled: "취소됨"
};

const uiErrorMessages = {
  "auth-invalid-input": "입력한 정보를 다시 확인해 주세요.",
  "auth-signup-invalid-input": "회원가입 정보를 다시 확인해 주세요.",
  "auth-invalid-credentials": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "auth-email-not-confirmed": "이메일 인증이 아직 완료되지 않았습니다.",
  "auth-user-already-registered": "이미 가입된 이메일입니다.",
  "auth-weak-password": "비밀번호는 8자 이상이어야 합니다.",
  "auth-password-mismatch": "비밀번호 확인이 일치하지 않습니다.",
  "auth-email-invalid": "이메일 형식이 올바르지 않습니다.",
  "auth-rate-limit": "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  "onboarding-invalid-create-input": "가족 생성 정보를 다시 확인해 주세요.",
  "onboarding-invalid-join-input": "가족 참여 정보를 다시 확인해 주세요.",
  "onboarding-invalid-invite-code": "초대 코드가 유효하지 않습니다.",
  "onboarding-family-full": "이 가족은 이미 최대 인원에 도달했습니다.",
  "onboarding-invite-code-generation-failed": "초대 코드를 만들지 못했습니다. 다시 시도해 주세요.",
  "invite-invalid-link": "초대 링크가 유효하지 않습니다.",
  "invite-already-in-family": "이미 가족에 속해 있어 이 초대로 참여할 수 없습니다.",
  "letter-invalid-input": "편지 내용을 다시 확인해 주세요.",
  "letter-invalid-recipient": "받는 사람을 다시 확인해 주세요.",
  "letter-invalid-update-input": "편지 수정 내용을 다시 확인해 주세요.",
  "letter-update-window-expired": "편지를 수정할 수 있는 시간이 지났습니다.",
  "letter-invalid-cancel-input": "편지 취소 요청을 다시 확인해 주세요.",
  "letter-cancel-window-expired": "편지를 취소할 수 있는 시간이 지났습니다.",
  "settings-invalid-display-name": "표시 이름을 다시 확인해 주세요.",
  "answer-invalid-input": "답변 내용을 다시 확인해 주세요.",
  "answer-already-submitted": "이 질문에는 이미 답변을 남겼습니다.",
  "comment-invalid-input": "댓글 내용을 다시 확인해 주세요.",
  "comment-invalid-answer": "댓글을 남길 답변을 찾을 수 없습니다.",
  "data-duplicate-value": "이미 사용 중인 값입니다.",
  "unexpected-error": "예상치 못한 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
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
  ["Invalid invite code", "invite-invalid-link"],
  ["Family member limit reached", "onboarding-family-full"],
  ["Update window expired.", "letter-update-window-expired"],
  ["Cancel window expired.", "letter-cancel-window-expired"],
  ['duplicate key value violates unique constraint "answers_question_id_author_user_id_key"', "answer-already-submitted"],
  ["duplicate key value violates unique constraint", "data-duplicate-value"]
];

export function getLetterStatusLabel(status: LetterStatus | string): string {
  return letterStatusLabels[status as LetterStatus] ?? "알 수 없는 상태";
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
