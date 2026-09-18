import { describe, expect, it } from "vitest";
import { getEffectiveRunStatus, getRunDelivered } from "@/lib/runStatus";

describe("live provider run status", () => {
  it("uses provider completion instead of stale local processing", () => {
    const run = { status: "started", provider_status: "Completed", provider_remains: 0, quantity_to_send: 250 };
    expect(getEffectiveRunStatus(run)).toBe("completed");
    expect(getRunDelivered(run)).toBe(250);
  });

  it("uses zero remains for a dispatched provider order", () => {
    const run = { status: "started", provider_status: "Processing", provider_order_id: "21406087", provider_remains: 0, quantity_to_send: 100 };
    expect(getEffectiveRunStatus(run)).toBe("completed");
    expect(getRunDelivered(run)).toBe(100);
  });

  it("keeps unfinished provider work in progress", () => {
    const run = { status: "started", provider_status: "In progress", provider_order_id: "21406087", provider_remains: 40, quantity_to_send: 100 };
    expect(getEffectiveRunStatus(run)).toBe("started");
    expect(getRunDelivered(run)).toBe(60);
  });
});