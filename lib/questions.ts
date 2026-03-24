export const QUESTION_TIMEZONE = "Asia/Seoul";

function getDatePartValue(parts: Intl.DateTimeFormatPart[], type: "year" | "month" | "day") {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function getQuestionPublishDate(now = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: QUESTION_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const parts = formatter.formatToParts(now);
  const year = getDatePartValue(parts, "year");
  const month = getDatePartValue(parts, "month");
  const day = getDatePartValue(parts, "day");

  return `${year}-${month}-${day}`;
}

export function getQuestionTemplateIndex(publishDate: string, templateCount: number): number {
  if (templateCount <= 0) {
    throw new Error("templateCount must be greater than 0.");
  }

  const dayNumber = Math.floor(Date.parse(`${publishDate}T00:00:00.000Z`) / 86400000);
  return ((dayNumber % templateCount) + templateCount) % templateCount;
}

export function canRevealFamilyAnswers(hasOwnAnswer: boolean): boolean {
  return hasOwnAnswer;
}
