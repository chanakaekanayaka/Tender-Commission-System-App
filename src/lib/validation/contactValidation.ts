// Shared by the client-side Metadata form (instant feedback) and the server-side Zod schema
// (source of truth) so the two never drift apart. Empty is always valid here — these fields are
// optional at every wizard step; only a non-empty, malformed value should be flagged.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/;

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === "" || EMAIL_REGEX.test(trimmed);
}

export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === "" || PHONE_REGEX.test(trimmed);
}
