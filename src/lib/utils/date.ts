// The app's own users are all in Sri Lanka — a Date's calendar day/time-of-day need to render in
// Sri Lanka local time specifically, not whatever timezone the Node process happens to be running
// in (plain `.toISOString()` is UTC, which can land on the wrong calendar day entirely for a
// timestamp taken late at night SL time).
const SRI_LANKA_TIME_ZONE = "Asia/Colombo";

function getSriLankaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SRI_LANKA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

/** Formats a Date as "YYYY-MM-DD HH:MM" in Sri Lanka local time (UTC+5:30) — used wherever an exact
 *  upload/action timestamp needs to be shown, not just the calendar date. */
export function formatDateTime(date: Date): string {
  const { year, month, day, hour, minute } = getSriLankaDateParts(date);
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

/** Formats a Date as "YYYY-MM-DD" in Sri Lanka local time (UTC+5:30) — for a Date/timestamp field
 *  (e.g. `reviewedAt`) shown as a calendar date only. Unlike `.toISOString().slice(0, 10)` (UTC),
 *  this lands on the calendar day it actually happened on Sri Lanka local time. */
export function formatDateOnly(date: Date): string {
  const { year, month, day } = getSriLankaDateParts(date);
  return `${year}-${month}-${day}`;
}
