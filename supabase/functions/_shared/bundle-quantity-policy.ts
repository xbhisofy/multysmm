export type BundleQuantityOverrides = { min_quantity_override?: number | null; max_quantity_override?: number | null };

export function bundleQuantityLimits(item: BundleQuantityOverrides | undefined, service: { min_quantity?: number | null; max_quantity?: number | null }) {
  return {
    minQuantity: item?.min_quantity_override ?? service.min_quantity ?? 1,
    maxQuantity: item?.max_quantity_override ?? service.max_quantity ?? undefined,
  };
}

export function parseOptionalQuantity(value: string): number | null {
  if (!value.trim()) return null;
  const quantity = Number(value);
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error('Quantity must be a whole number of at least 1.');
  return quantity;
}