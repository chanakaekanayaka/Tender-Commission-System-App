/** Normalizes to lowercase with punctuation/whitespace stripped (e.g. "TenderCMS (Pvt) Ltd." ->
 *  "tendercmsPvtLtd" -> "tendercmspvtltd") so minor formatting differences between how a vendor's
 *  own Excel spells their name and how it's set in System Config don't block a match. */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Loose substring match either direction — "Lanka Trading" should match a System Config
 *  companyName of "Lanka Trading (Pvt) Ltd" and vice versa. Empty companyName never matches
 *  anything, so an unconfigured System Config never falsely flags a vendor block as "ours". */
export function isOurVendor(vendorName: string, companyName: string): boolean {
  const normalizedCompany = normalize(companyName);
  if (!normalizedCompany) return false;
  const normalizedVendor = normalize(vendorName);
  if (!normalizedVendor) return false;
  return normalizedVendor.includes(normalizedCompany) || normalizedCompany.includes(normalizedVendor);
}
