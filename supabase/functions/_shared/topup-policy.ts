export const REPORT_INR_PER_USD = 83.5;

/** Historical paid totals are immutable USD; catalog prices are never a valuation basis. */
export function remainingPaidValue(paidUsd: number, orderedQuantity: number, pendingQuantity: number): number {
  if (orderedQuantity <= 0 || paidUsd < 0) return 0;
  return paidUsd * Math.min(1, Math.max(0, pendingQuantity) / orderedQuantity);
}

export function requiresNewFunding(run: { status: string; provider_order_id: string | null }): boolean {
  return run.status === 'pending' && !run.provider_order_id;
}

export function providerCostInr(rate: number, currency: string, quantity: number, minimum: number, multiplier: number): number | null {
  if (!Number.isFinite(rate) || rate < 0) return null;
  const conversion = currency.toUpperCase() === 'INR' ? 1 : currency.toUpperCase() === 'USD' ? REPORT_INR_PER_USD : null;
  if (conversion === null) return null;
  const adjusted = multiplier > 1 ? Math.max(1, Math.round(quantity / multiplier)) : quantity;
  return rate * Math.max(adjusted, minimum) / 1000 * conversion;
}