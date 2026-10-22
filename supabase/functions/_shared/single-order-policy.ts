export function singleOrderPrice(pricePerThousand: number, quantity: number): number {
  return Math.round((pricePerThousand * quantity / 1000) * 10000) / 10000;
}

export function singleOrderValidation(link: string, quantity: number, min: number, max: number): string | null {
  if (!link.trim()) return 'Enter a target link.';
  try {
    const url = new URL(link.trim());
    if (!['https:', 'http:'].includes(url.protocol) || !url.hostname.includes('.')) return 'Enter a valid website link.';
  } catch {
    return 'Enter a valid website link starting with https://.';
  }
  if (!Number.isSafeInteger(quantity) || quantity <= 0) return 'Enter a whole-number quantity.';
  if (quantity < min) return `Minimum quantity is ${min.toLocaleString()}.`;
  if (quantity > max) return `Maximum quantity is ${max.toLocaleString()}.`;
  return null;
}

export function servicePlatform(category: string, name: string): string {
  const text = `${category} ${name}`.toLowerCase();
  for (const platform of ['instagram', 'youtube', 'tiktok', 'facebook', 'telegram', 'spotify', 'linkedin']) {
    if (text.includes(platform)) return platform;
  }
  if (text.includes('twitter') || text.includes('twitter/x')) return 'twitter';
  return 'other';
}
// Single Order markup over the catalog per-1000 price. 0 = admin's price is shown to users as-is.
// Change this one number to adjust every single-order price everywhere.
export const SINGLE_ORDER_MARKUP_PERCENT = 0;

// Admin enters service prices in INR per 1,000; wallets settle internally in USD.
export const INR_PER_USD = 83.5;

export function singleOrderMarkedPrice(pricePerThousand: number): number {
  return pricePerThousand * (1 + SINGLE_ORDER_MARKUP_PERCENT / 100);
}
