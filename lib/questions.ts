import { getSeoulDateKey, parseSeoulDate, SEOUL_TIME_ZONE } from "@/lib/time";
import type { QuestionRecord } from "@/lib/types";

export const QUESTION_TIMEZONE = SEOUL_TIME_ZONE;
export const QUESTION_ROTATION_START_DATE = "2026-03-26";

const QUESTION_ROTATION_START_DAY_NUMBER = Math.floor(parseSeoulDate(QUESTION_ROTATION_START_DATE).getTime() / 86400000);

export function getQuestionPublishDate(now = new Date()): string {
  return getSeoulDateKey(now);
}

export function getQuestionTemplateIndex(publishDate: string, templateCount: number): number {
  if (templateCount <= 0) {
    throw new Error("templateCount must be greater than 0.");
  }

  const dayNumber = Math.floor(parseSeoulDate(publishDate).getTime() / 86400000);
  const dayOffset = dayNumber - QUESTION_ROTATION_START_DAY_NUMBER;
  return ((dayOffset % templateCount) + templateCount) % templateCount;
}

export function canRevealFamilyAnswers(hasOwnAnswer: boolean): boolean {
  return hasOwnAnswer;
}

export function splitQuestionsForDisplay(questionRows: QuestionRecord[]): {
  todayQuestion: QuestionRecord | null;
  pastQuestions: QuestionRecord[];
} {
  const [todayQuestion, ...pastQuestions] = questionRows;

  return {
    todayQuestion: todayQuestion ?? null,
    pastQuestions
  };
}
