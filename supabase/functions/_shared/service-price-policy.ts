// Provider refreshes own metadata, never the admin's catalog selling price.
export function providerRefreshFields<T extends { price: number }>(service: T): Omit<T, 'price'> {
  const { price: _providerPrice, ...metadata } = service;
  return metadata;
}

export function bundlePriceFromInr(raw: string, inrPerUsd: number): number | null {
  if (!raw.trim()) return null;
  const inr = Number(raw);
  if (!Number.isFinite(inr) || inr <= 0) throw new Error('Enter a price greater than zero, or leave blank for automatic pricing.');
  return Number((inr / inrPerUsd).toFixed(8));
}