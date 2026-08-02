// The app's own users are all in Sri Lanka — a Date's calendar day/time-of-day need to render in
// Sri Lanka local time specifically, not whatever timezone the Node process happens to be running
// in (plain `.toISOString()` is UTC, which can land on the wrong calendar day entirely for a
// timestamp taken late at night SL time).
const SRI_LANKA_TIME_ZONE = "Asia/Colombo";
const SRI_LANKA_OFFSET_MS = 5.5 * 60 * 60 * 1000;

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

/** [start, end) UTC instants bounding the Sri Lanka calendar month `referenceDate` falls in — for
 *  Mongo range queries like `{ createdAt: { $gte: start, $lt: end } }` that need to mean "this
 *  month" in Sri Lanka local time, not whatever timezone the Node process is running in. */
export function getSriLankaMonthRange(referenceDate: Date = new Date()): { start: Date; end: Date } {
  const { year, month } = getSriLankaDateParts(referenceDate);
  const start = new Date(Date.UTC(Number(year), Number(month) - 1, 1) - SRI_LANKA_OFFSET_MS);
  const end = new Date(Date.UTC(Number(year), Number(month), 1) - SRI_LANKA_OFFSET_MS);
  return { start, end };
}

/** Days left in the Sri Lanka calendar month `referenceDate` falls in, not counting today itself
 *  (e.g. the 2nd of a 31-day month returns 29) — same "days remaining" convention Staff's own
 *  Monthly Target card uses, just computed in Sri Lanka local time instead of server-local time. */
export function getSriLankaDaysRemainingInMonth(referenceDate: Date = new Date()): number {
  const { year, month, day } = getSriLankaDateParts(referenceDate);
  const daysInMonth = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  return daysInMonth - Number(day);
}

/** The last `count` Sri Lanka calendar months (oldest first, current month last), each with a
 *  "Mon YYYY" label and its own [start, end) UTC range — for bucketing a query's results into a
 *  monthly trend without a separate query per month. */
export function getRecentSriLankaMonths(
  count: number,
  referenceDate: Date = new Date(),
): { label: string; start: Date; end: Date }[] {
  const { year, month } = getSriLankaDateParts(referenceDate);
  const months: { label: string; start: Date; end: Date }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const monthIndex = Number(month) - 1 - i;
    const start = new Date(Date.UTC(Number(year), monthIndex, 1) - SRI_LANKA_OFFSET_MS);
    const end = new Date(Date.UTC(Number(year), monthIndex + 1, 1) - SRI_LANKA_OFFSET_MS);
    const label = new Date(Date.UTC(Number(year), monthIndex, 1)).toLocaleString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
    months.push({ start, end, label });
  }
  return months;
}
