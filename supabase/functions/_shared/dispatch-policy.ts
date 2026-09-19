// Shared, pure dispatch-policy helpers used by the order/run dispatchers.
// Kept dependency-free so they can be unit tested outside Deno.

export const BUSY_BACKOFF_BASE_MS = 60 * 1000
export const BUSY_BACKOFF_MAX_MS = 60 * 1000
export const MAX_BUSY_RETRIES = 4320 // ~3 days of minute-by-minute queue waiting

/** Busy providers: fixed 60s re-check, so a queued run dispatches as soon as one frees up. */
export function busyBackoffMs(_retryCount: number): number {
  return BUSY_BACKOFF_BASE_MS
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

/**
 * Provider attempt history only excludes accounts for an explicit failed-run
 * fallback. Pending busy runs must retry every account on the next cron tick.
 */
export function attemptedProviderExclusions(
  runStatus: string | null | undefined,
  attemptedProviderIds: unknown,
): string[] {
  if ((runStatus || '').toLowerCase() !== 'failed' || !Array.isArray(attemptedProviderIds)) return []
  return attemptedProviderIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
}

const ACTIVE_PROVIDER_STATUSES = new Set([
  'pending', 'in progress', 'processing', 'processing order', 'inprogress', 'awaiting',
])
const TERMINAL_PROVIDER_STATUSES = new Set([
  'completed', 'complete', 'partial', 'refunded', 'canceled', 'cancelled',
  'error', 'failed', 'success', 'refund', 'canscelled',
])

/** Only a locally started, non-terminal provider order can block another send. */
export function isConflictingProviderOrder(run: {
  status?: string | null
  providerStatus?: string | null
}): boolean {
  if ((run.status || '').toLowerCase().trim() !== 'started') return false
  const providerStatus = (run.providerStatus || '').toLowerCase().trim()
  if (TERMINAL_PROVIDER_STATUSES.has(providerStatus)) return false
  return !providerStatus || ACTIVE_PROVIDER_STATUSES.has(providerStatus)
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
