import { describe, expect, it } from "vitest";
import { telegramRoute, escapeTelegram } from "../../supabase/functions/_shared/telegram-routing";

describe("deposit notification routing", () => {
  it("sends successful credits to the dedicated admin fund bot", () => {
    expect(telegramRoute("deposit_success")).toBe("fund");
  });
  it("keeps fraud and provider alerts away from the fund bot", () => {
    for (const kind of ["deposit", "provider_balance", "subscription_request", undefined]) {
      expect(telegramRoute(kind)).toBe("operations");
    }
  });
  it("escapes untrusted Telegram HTML values", () => {
    expect(escapeTelegram('<a href="bad">&')).toBe("&lt;a href=&quot;bad&quot;&gt;&amp;");
  });
});