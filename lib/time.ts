export const SEOUL_TIME_ZONE = "Asia/Seoul";
export const SEOUL_UTC_OFFSET = "+09:00";

type SeoulDatePart = "year" | "month" | "day" | "hour" | "minute" | "second";

const seoulDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: SEOUL_TIME_ZONE,
  dateStyle: "long"
});

const seoulDateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: SEOUL_TIME_ZONE,
  dateStyle: "long",
  timeStyle: "short"
});

const seoulDateTimePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SEOUL_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23"
});

function getDatePartValue(parts: Intl.DateTimeFormatPart[], type: SeoulDatePart) {
  return parts.find((part) => part.type === type)?.value ?? "";
}

function getSeoulDateTimeParts(date: Date) {
  const parts = seoulDateTimePartsFormatter.formatToParts(date);

  return {
    year: getDatePartValue(parts, "year"),
    month: getDatePartValue(parts, "month"),
    day: getDatePartValue(parts, "day"),
    hour: getDatePartValue(parts, "hour"),
    minute: getDatePartValue(parts, "minute"),
    second: getDatePartValue(parts, "second")
  };
}

export function getSeoulDateKey(date = new Date()): string {
  const { year, month, day } = getSeoulDateTimeParts(date);
  return `${year}-${month}-${day}`;
}

export function parseSeoulDate(value: string): Date {
  return new Date(`${value}T00:00:00.000${SEOUL_UTC_OFFSET}`);
}

export function formatSeoulDateTime(value: Date | string | null): string {
  if (!value) {
    return "-";
  }

  return seoulDateTimeFormatter.format(typeof value === "string" ? new Date(value) : value);
}

export function formatSeoulDate(value: Date | string): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return seoulDateFormatter.format(parseSeoulDate(value));
  }

  return seoulDateFormatter.format(typeof value === "string" ? new Date(value) : value);
}

export function toSeoulIsoOffsetString(date: Date): string {
  const { year, month, day, hour, minute, second } = getSeoulDateTimeParts(date);
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0");

  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${milliseconds}${SEOUL_UTC_OFFSET}`;
}

export function isFutureSeoulTime(value: string | null, now = new Date()): boolean {
  if (!value) {
    return false;
  }

  return new Date(value).getTime() > now.getTime();
}
