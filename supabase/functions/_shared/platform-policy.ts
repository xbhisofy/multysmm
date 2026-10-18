const SOCIAL_PLATFORMS = ['instagram', 'youtube', 'tiktok', 'twitter', 'facebook', 'telegram'];

/** Custom platforms are manual ad networks; existing social platforms keep API delivery. */
export function isManualAdsPlatform(platform: string): boolean {
  return Boolean(platform.trim()) && !SOCIAL_PLATFORMS.includes(platform.toLowerCase());
}