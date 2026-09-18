// Shared, pure dispatch-policy helpers used by the order/run dispatchers.
// Kept dependency-free so they can be unit tested outside Deno.

export const BUSY_BACKOFF_BASE_MS = 60 * 1000
export const BUSY_BACKOFF_MAX_MS = 30 * 60 * 1000
export const MAX_BUSY_RETRIES = 30

/** Exponential backoff for busy providers: ~60s, growing, hard-capped at 30 minutes. */
export function busyBackoffMs(retryCount: number): number {
  const attempt = Math.max(0, Number(retryCount || 0))
  const delay = BUSY_BACKOFF_BASE_MS * Math.pow(1.6, attempt)
  return Math.min(BUSY_BACKOFF_MAX_MS, Math.round(delay))
}

/** Least-recently-used ordering key (never-used accounts sort first). */
export function lastUsedMs(value: string | null | undefined): number {
  if (!value) return 0
  const t = new Date(value).getTime()
  return Number.isFinite(t) ? t : 0
}

export interface DispatchCandidate {
  accountId: string
  name: string
  providerServiceId: string
  sortOrder: number
  priority: number
  lastUsedAt: string | null
  isActive: boolean
  apiUrl: string
}

export function isValidDispatchUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Canonical try-list order:
 * sort_order ASC -> account priority ASC -> last_used_at ASC (LRU) -> name.
 * Inactive / invalid-url / busy accounts are removed, duplicates collapsed.
 */
export function buildTryList(
  candidates: DispatchCandidate[],
  busyAccountIds: string[] = [],
): DispatchCandidate[] {
  const busy = new Set(busyAccountIds)
  const seen = new Set<string>()
  return candidates
    .filter((c) =>
      c.isActive &&
      isValidDispatchUrl(c.apiUrl) &&
      !!c.providerServiceId &&
      !busy.has(c.accountId))
    .filter((c) => {
      const key = `${c.accountId}|${c.providerServiceId}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
      if (a.priority !== b.priority) return a.priority - b.priority
      const au = lastUsedMs(a.lastUsedAt), bu = lastUsedMs(b.lastUsedAt)
      if (au !== bu) return au - bu
      return a.name.localeCompare(b.name)
    })
}

const BUSY_ERRORS = [
  'active order with this link', 'wait until order being completed', 'already has an order',
  'order in progress', 'link currently active', 'processing previous order',
  'processing another transaction', 'balance', 'not have enough', 'rate limit',
  'timeout', 'temporarily', 'too many requests',
]
const ACCOUNT_ERRORS = ['invalid api key', 'api key not found', 'unauthorized', 'invalid key']
const SERVICE_ERRORS = [
  'quantity less than minimal', 'quantity less than minimum', 'min quantity', 'minimum order',
  'minimum quantity', 'max quantity', 'maximum quantity', 'service not found',
  'incorrect service', 'invalid service', 'service unavailable', 'service is inactive',
  'service is not available', 'disabled', 'maintenance', 'not found',
]

export type DispatchErrorClass = 'busy' | 'account' | 'service' | 'permanent'

export function classifyDispatchError(message: string | null | undefined): DispatchErrorClass {
  const lower = (message || '').toLowerCase()
  if (ACCOUNT_ERRORS.some((e) => lower.includes(e))) return 'account'
  if (BUSY_ERRORS.some((e) => lower.includes(e))) return 'busy'
  if (SERVICE_ERRORS.some((e) => lower.includes(e))) return 'service'
  return 'permanent'
}

/** busy/account/service errors should roll over to the next provider; permanent ones fail. */
export function shouldTryNextProvider(message: string | null | undefined): boolean {
  return classifyDispatchError(message) !== 'permanent'
}

/** Decide what happens when the try-list is exhausted or empty. */
export function resolveBusyOutcome(params: { hasMappings: boolean; retryCount: number }):
  { action: 'fail'; reason: string } | { action: 'postpone'; delayMs: number; attempt: number } {
  if (!params.hasMappings) return { action: 'fail', reason: 'No provider accounts configured' }
  const attempt = Math.max(0, Number(params.retryCount || 0)) + 1
  if (attempt > MAX_BUSY_RETRIES) {
    return { action: 'fail', reason: `All providers busy after ${MAX_BUSY_RETRIES} postpone attempts` }
  }
  return { action: 'postpone', delayMs: busyBackoffMs(attempt - 1), attempt }
}
