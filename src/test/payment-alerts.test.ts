import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.unstubAllGlobals());

describe("payment credit alert destinations", () => {
  for (const method of ["ZapUPI", "OxaPay"] as const) {
    it(`routes ${method} credits to fund alerts without exposing configuration`, async () => {
      vi.stubGlobal("Deno", { env: { get: () => "test-config" } });
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal("fetch", fetchMock);
      const rows: Record<string, unknown> = {
        zapupi_deposits: { user_id: "user-1", amount_inr: 50 },
        oxapay_deposits: { user_id: "user-1", amount_inr: 50, amount_usd: 50 / 83.5 },
        profiles: { email: "user@example.com", full_name: "User" },
        wallets: { balance: 1 },
      };
      const admin = { from: (table: string) => {
        const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: rows[table] }) };
        return query;
      } };
      if (method === "ZapUPI") {
        const { telegramCreditAlert } = await import("../../supabase/functions/_shared/zapupi-security");
        await telegramCreditAlert(admin, "test-order", "webhook");
      } else {
        const { telegramOxapayCreditAlert } = await import("../../supabase/functions/_shared/oxapay-alerts");
        await telegramOxapayCreditAlert(admin, "test-order", "webhook");
      }
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(payload.alert_kind).toBe("deposit_success");
      expect(payload.force).toBe(true);
    });
  }
});