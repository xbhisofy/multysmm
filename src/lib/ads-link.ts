/** Ads orders accept anything the user enters — no link validation. */
export function isValidAdsLink(raw: string): boolean {
  return raw.trim().length > 0;
}
