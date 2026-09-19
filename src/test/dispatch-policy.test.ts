import { describe, it, expect } from "vitest";
import {
  buildTryList,
  classifyDispatchError,
  shouldTryNextProvider,
  resolveBusyOutcome,
  busyBackoffMs,
  MAX_BUSY_RETRIES,
  BUSY_BACKOFF_MAX_MS,
  attemptedProviderExclusions,
  isConflictingProviderOrder,
  type DispatchCandidate,
} from "../../supabase/functions/_shared/dispatch-policy";

const acct = (o: Partial<DispatchCandidate> & { accountId: string }): DispatchCandidate => ({
  name: o.accountId,
  providerServiceId: "1234",
  sortOrder: 999,
  priority: 999,
  lastUsedAt: null,
  isActive: true,
  apiUrl: "https://panel.example.com/api/v2",
  ...o,
});

describe("priority routing", () => {
  it("orders by sort_order, then priority, then least-recently-used", () => {
    const list = buildTryList([
      acct({ accountId: "c", sortOrder: 2 }),
      acct({ accountId: "b", sortOrder: 1, priority: 2 }),
      acct({ accountId: "a", sortOrder: 1, priority: 1 }),
    ]);
    expect(list.map((c) => c.accountId)).toEqual(["a", "b", "c"]);
  });

  it("uses last_used_at ASC only as a tiebreak within equal priority", () => {
    const list = buildTryList([
      acct({ accountId: "recent", sortOrder: 1, priority: 1, lastUsedAt: "2026-09-18T10:00:00Z" }),
      acct({ accountId: "older", sortOrder: 1, priority: 1, lastUsedAt: "2026-09-10T10:00:00Z" }),
      acct({ accountId: "never", sortOrder: 1, priority: 1 }),
    ]);
    expect(list.map((c) => c.accountId)).toEqual(["never", "older", "recent"]);
  });

  it("skips inactive / invalid-url / busy accounts and de-duplicates", () => {
    const list = buildTryList(
      [
        acct({ accountId: "ok", sortOrder: 1 }),
        acct({ accountId: "ok", sortOrder: 1 }),
        acct({ accountId: "off", sortOrder: 2, isActive: false }),
        acct({ accountId: "bad", sortOrder: 3, apiUrl: "not-a-url" }),
        acct({ accountId: "busy", sortOrder: 4 }),
      ],
      ["busy"],
    );
    expect(list.map((c) => c.accountId)).toEqual(["ok"]);
  });
});

describe("failover classification", () => {
  it("treats busy/account/service errors as fall-through to the next provider", () => {
    for (const msg of [
      "You have active order with this link",
      "Please wait until order being completed",
      "Rate limit exceeded",
      "Invalid API key",
      "Quantity less than minimal",
      "Service is inactive",
    ]) {
      expect(shouldTryNextProvider(msg)).toBe(true);
    }
    expect(classifyDispatchError("Invalid API key")).toBe("account");
    expect(classifyDispatchError("Rate limit exceeded")).toBe("busy");
    expect(classifyDispatchError("Service is inactive")).toBe("service");
  });

  it("fails permanently for non-recoverable errors", () => {
    expect(classifyDispatchError("Incorrect link / private account")).toBe("permanent");
    expect(shouldTryNextProvider("Incorrect link / private account")).toBe(false);
  });
});

describe("all-providers-busy handling", () => {
  it("postpones instead of failing while mappings exist", () => {
    const out = resolveBusyOutcome({ hasMappings: true, retryCount: 0 });
    expect(out).toMatchObject({ action: "postpone", attempt: 1 });
    if (out.action === "postpone") expect(out.delayMs).toBe(60_000);
  });

  it("keeps a fixed 60s queue re-check instead of growing the delay", () => {
    expect(busyBackoffMs(0)).toBe(60_000);
    expect(busyBackoffMs(1)).toBe(60_000);
    expect(busyBackoffMs(20)).toBe(BUSY_BACKOFF_MAX_MS);
  });

  it("fails after the retry cap instead of rescheduling forever", () => {
    expect(resolveBusyOutcome({ hasMappings: true, retryCount: MAX_BUSY_RETRIES })).toMatchObject({
      action: "fail",
    });
  });

  it("fails immediately when the service has no mapped accounts", () => {
    expect(resolveBusyOutcome({ hasMappings: false, retryCount: 0 })).toEqual({
      action: "fail",
      reason: "No provider accounts configured",
    });
  });

  it("dispatches again once a provider frees up", () => {
    const busy = ["p1", "p2"];
    expect(buildTryList([acct({ accountId: "p1", sortOrder: 1 }), acct({ accountId: "p2", sortOrder: 2 })], busy))
      .toHaveLength(0);
    const freed = buildTryList(
      [acct({ accountId: "p1", sortOrder: 1 }), acct({ accountId: "p2", sortOrder: 2 })],
      ["p2"],
    );
    expect(freed.map((c) => c.accountId)).toEqual(["p1"]);
  });

  it("does not permanently blacklist providers after a queued busy attempt", () => {
    expect(attemptedProviderExclusions("pending", ["p1", "p2"])).toEqual([]);
    expect(attemptedProviderExclusions("failed", ["p1", "p2"])).toEqual(["p1", "p2"]);
  });

  it("ignores stale active provider status on locally finished runs", () => {
    expect(isConflictingProviderOrder({ status: "completed", providerStatus: "Processing" })).toBe(false);
    expect(isConflictingProviderOrder({ status: "failed", providerStatus: "Pending" })).toBe(false);
    expect(isConflictingProviderOrder({ status: "cancelled", providerStatus: "In progress" })).toBe(false);
  });

  it("blocks only a genuinely started non-terminal provider order", () => {
    expect(isConflictingProviderOrder({ status: "started", providerStatus: "In progress" })).toBe(true);
    expect(isConflictingProviderOrder({ status: "started", providerStatus: "Completed" })).toBe(false);
  });
});
