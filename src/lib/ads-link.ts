/** Ads orders accept public website URLs, independent of the ad network. */
export function isValidAdsLink(raw: string): boolean {
  const value = raw.trim();
  if (!value || value.length > 2048 || /\s/.test(value)) return false;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol)
      && url.hostname.includes('.')
      && !url.username && !url.password;
  } catch {
    return false;
  }
}