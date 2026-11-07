export function normalizeProviderOrderStatus(value: unknown): string | null {
  const status = String(value ?? '').trim().toLowerCase().replace(/[ _-]+/g, '');
  if (['completed', 'complete', 'success'].includes(status)) return 'completed';
  if (['processing', 'inprogress', 'inprocessing', 'running', 'active'].includes(status)) return 'processing';
  if (['pending', 'awaiting', 'queued'].includes(status)) return 'pending';
  if (['cancelled', 'canceled', 'canscelled', 'refunded', 'refund'].includes(status)) return 'cancelled';
  if (['partial', 'partiallycompleted'].includes(status)) return 'partial';
  if (['failed', 'error'].includes(status)) return 'failed';
  return null;
}
export function providerCount(value: unknown): number | null {
  if (value == null || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}
export function canRefreshOrder(caller: string | null, owner: string, trusted: boolean): boolean {
  return trusted || Boolean(caller && caller === owner);
}