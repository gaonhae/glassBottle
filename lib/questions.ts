import { getSeoulDateKey, parseSeoulDate, SEOUL_TIME_ZONE } from "@/lib/time";

export const QUESTION_TIMEZONE = SEOUL_TIME_ZONE;

export function getQuestionPublishDate(now = new Date()): string {
  return getSeoulDateKey(now);
}

export function getQuestionTemplateIndex(publishDate: string, templateCount: number): number {
  if (templateCount <= 0) {
    throw new Error("templateCount must be greater than 0.");
  }

  const dayNumber = Math.floor(parseSeoulDate(publishDate).getTime() / 86400000);
  return ((dayNumber % templateCount) + templateCount) % templateCount;
}

export function canRevealFamilyAnswers(hasOwnAnswer: boolean): boolean {
  return hasOwnAnswer;
}
