// Shared by the client-side Metadata form (instant feedback) and the server-side Zod schema
// (source of truth) so the two never drift apart. Empty is always valid here — these fields are
// optional at every wizard step; only a non-empty, malformed value should be flagged.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Sri Lankan numbers only: local "0" + 9 digits (07X mobile, 0XX landline), or "+94" + 9 digits
// (the same number without the leading 0) — e.g. 0771234567 or +94771234567. The second digit
// can't be 0 (no real SL number starts 00...), matching how the network actually assigns numbers.
const SL_PHONE_REGEX = /^(?:\+94|0)[1-9]\d{8}$/;

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === "" || EMAIL_REGEX.test(trimmed);
}

export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "") return true;
  // Staff can type spaces/dashes as visual separators (e.g. "077 123 4567") — strip them before
  // checking the real shape.
  const normalized = trimmed.replace(/[\s-]/g, "");
  return SL_PHONE_REGEX.test(normalized);
}
