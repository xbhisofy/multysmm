// Order Health Monitor — runs every 5 min via pg_cron.
// Detects stuck orders and sends Telegram alerts with dedup + escalation.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STUCK_THRESHOLD_MIN = 30;
// Escalation: minutes since first alert → next reminder delay (minutes from now)
const REMINDER_STEPS_MIN = [30, 60, 180, 360, 720, 1440]; // 30m, 1h, 3h, 6h, 12h, 24h

interface Issue {
  order_kind: "order" | "engagement_order" | "engagement_run";
  order_ref: string;
  issue_code: string;
  priority: "high" | "medium" | "low";
  details: Record<string, any>;
}

function fmtAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function priorityIcon(p: string): string {
  return p === "high" ? "🔴" : p === "medium" ? "🟡" : "🔵";
}

function issueLabel(code: string): string {
  const map: Record<string, string> = {
    stuck_no_progress: "No progress detected",
    debited_no_provider: "Wallet debited but provider order NOT created",
    provider_cancelled: "Provider CANCELLED the order",
    provider_failed: "Provider marked order as FAILED",
    run_overdue: "Organic run overdue",
    unknown_status: "Unknown / unexpected status",
  };
  return map[code] || code;
}

function buildAlertMessage(issue: Issue, isReminder: boolean, reminderStep: number): string {
  const d = issue.details;
  const header = isReminder
    ? `⏰ <b>REMINDER #${reminderStep}</b> — MultySMM Order Alert`
    : `🚨 <b>MultySMM Order Alert</b>`;
  const lines: string[] = [
    header,
    "",
    `${priorityIcon(issue.priority)} <b>${issueLabel(issue.issue_code)}</b>`,
    "",
  ];
  if (d.order_number != null) lines.push(`<b>Order:</b> #${d.order_number}`);
  if (d.user_email) lines.push(`<b>User:</b> ${d.user_email}`);
  if (d.service_name) lines.push(`<b>Service:</b> ${d.service_name}`);
  if (d.provider_name) lines.push(`<b>Provider:</b> ${d.provider_name}`);
  if (d.status) lines.push(`<b>Status:</b> ${d.status}`);
  if (d.link) lines.push(`<b>Link:</b> ${d.link}`);
  if (d.quantity != null) lines.push(`<b>Quantity:</b> ${d.quantity}`);
  if (d.remains != null) lines.push(`<b>Remaining:</b> ${d.remains}`);
  if (d.created_at) lines.push(`<b>Created:</b> ${fmtAgo(d.created_at)}`);
  if (d.updated_at) lines.push(`<b>Last update:</b> ${fmtAgo(d.updated_at)}`);
  if (d.note) lines.push(`\n<i>${d.note}</i>`);
  lines.push("", `🕒 ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`);
  lines.push("\nPlease investigate.");
  return lines.join("\n");
}

function buildResolutionMessage(alert: any, currentDetails: Record<string, any>): string {
  const d = currentDetails;
  const lines = [
    `✅ <b>Issue Resolved</b>`,
    "",
    `<b>Was:</b> ${issueLabel(alert.issue_code)}`,
  ];
  if (d.order_number != null) lines.push(`<b>Order:</b> #${d.order_number}`);
  if (d.status) lines.push(`<b>Current status:</b> ${d.status}`);
  if (d.remains != null && d.quantity != null) {
    lines.push(`<b>Progress:</b> ${d.quantity - d.remains} / ${d.quantity}`);
  }
  lines.push(`\nNo further action required.`);
  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  let lastSendAt = 0;
  const MIN_GAP_MS = 1200; // ≥1.2s between sends to respect Telegram + edge rate limits
  let sendBudget = 20;     // hard cap per run to avoid floods after backlogs

  const sendTelegram = async (message: string) => {
    if (sendBudget <= 0) return false;
    const gap = Date.now() - lastSendAt;
    if (gap < MIN_GAP_MS) await sleep(MIN_GAP_MS - gap);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/send-telegram-notification`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message, parse_mode: "HTML" }),
        });
        lastSendAt = Date.now();
        if (res.ok) { sendBudget--; return true; }
        if (res.status === 429) {
          const retry = Number(res.headers.get("retry-after")) || 2;
          await sleep(Math.min(retry * 1000, 5000));
          continue;
        }
        return false;
      } catch (e) {
        console.error("telegram send failed", e);
        await sleep(1500);
      }
    }
    return false;
  };

  const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MIN * 60_000).toISOString();
  // Only alert for orders placed within the last 24h — older ones are ignored.
  const maxAgeCutoff = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const issues: Issue[] = [];

  // 1. Regular orders — stuck / provider issues
  const { data: orders } = await admin
    .from("orders")
    .select(
      "id, order_number, user_id, service_id, provider_order_id, status, quantity, remains, link, price, created_at, updated_at",
    )
    .in("status", ["pending", "processing", "in_progress"])
    .gt("created_at", maxAgeCutoff)
    .lt("updated_at", cutoff);

  const orderList = orders || [];

  // Batch fetch services + users for enrichment
  const serviceIds = [...new Set(orderList.map((o: any) => o.service_id).filter(Boolean))];
  const userIds = [...new Set(orderList.map((o: any) => o.user_id).filter(Boolean))];
  const [servicesRes, profilesRes] = await Promise.all([
    serviceIds.length
      ? admin.from("services").select("id, name, provider_id").in("id", serviceIds)
      : Promise.resolve({ data: [] as any[] }),
    userIds.length
      ? admin.from("profiles").select("user_id, email").in("user_id", userIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const serviceMap = new Map((servicesRes.data || []).map((s: any) => [s.id, s]));
  const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p]));
  const providerIds = [
    ...new Set(
      (servicesRes.data || []).map((s: any) => s.provider_id).filter(Boolean),
    ),
  ];
  const { data: providersData } = providerIds.length
    ? await admin.from("providers").select("id, name").in("id", providerIds)
    : { data: [] as any[] };
  const providerMap = new Map((providersData || []).map((p: any) => [p.id, p]));

  for (const o of orderList) {
    const svc = serviceMap.get(o.service_id);
    const prov = svc?.provider_id ? providerMap.get(svc.provider_id) : null;
    const profile = profileMap.get(o.user_id);

    const baseDetails = {
      order_number: o.order_number,
      user_email: profile?.email,
      service_name: svc?.name,
      provider_name: prov?.name,
      status: o.status,
      quantity: o.quantity,
      remains: o.remains,
      link: o.link,
      created_at: o.created_at,
      updated_at: o.updated_at,
    };

    // wallet debited but no provider order
    if (o.status === "pending" && !o.provider_order_id) {
      issues.push({
        order_kind: "order",
        order_ref: o.id,
        issue_code: "debited_no_provider",
        priority: "high",
        details: { ...baseDetails, note: "Order was paid but provider order was never created." },
      });
      continue;
    }

    // Stuck no progress
    issues.push({
      order_kind: "order",
      order_ref: o.id,
      issue_code: "stuck_no_progress",
      priority: "medium",
      details: { ...baseDetails, note: `No status change for ${STUCK_THRESHOLD_MIN}+ minutes.` },
    });
  }

  // Provider cancelled / failed (regardless of updated_at, always alert once)
  const { data: badOrders } = await admin
    .from("orders")
    .select("id, order_number, user_id, service_id, status, quantity, remains, link, created_at, updated_at")
    .in("status", ["provider_cancelled", "cancelled_by_provider", "failed", "provider_failed"])
    .gt("created_at", new Date(Date.now() - 7 * 24 * 3600_000).toISOString());
  for (const o of badOrders || []) {
    const svc = serviceMap.get(o.service_id) || (await admin.from("services").select("id, name, provider_id").eq("id", o.service_id).maybeSingle()).data;
    const prov = svc?.provider_id ? providerMap.get(svc.provider_id) : null;
    const profile = profileMap.get(o.user_id) || (await admin.from("profiles").select("user_id, email").eq("user_id", o.user_id).maybeSingle()).data;
    const code = (o.status || "").includes("cancel") ? "provider_cancelled" : "provider_failed";
    issues.push({
      order_kind: "order",
      order_ref: o.id,
      issue_code: code,
      priority: "high",
      details: {
        order_number: o.order_number,
        user_email: profile?.email,
        service_name: svc?.name,
        provider_name: prov?.name,
        status: o.status,
        quantity: o.quantity,
        remains: o.remains,
        link: o.link,
        created_at: o.created_at,
        updated_at: o.updated_at,
      },
    });
  }

  // 2. Engagement orders — stuck
  const { data: engOrders } = await admin
    .from("engagement_orders")
    .select("id, order_number, user_id, link, status, total_price, base_quantity, created_at, updated_at")
    .in("status", ["pending", "processing", "in_progress"])
    .gt("created_at", maxAgeCutoff)
    .lt("updated_at", cutoff);

  const engUserIds = [...new Set((engOrders || []).map((e: any) => e.user_id).filter(Boolean))];
  const { data: engProfiles } = engUserIds.length
    ? await admin.from("profiles").select("user_id, email").in("user_id", engUserIds)
    : { data: [] as any[] };
  const engProfileMap = new Map((engProfiles || []).map((p: any) => [p.user_id, p]));

  for (const eo of engOrders || []) {
    const profile = engProfileMap.get(eo.user_id);
    issues.push({
      order_kind: "engagement_order",
      order_ref: eo.id,
      issue_code: "stuck_no_progress",
      priority: "medium",
      details: {
        order_number: eo.order_number,
        user_email: profile?.email,
        status: eo.status,
        link: eo.link,
        quantity: eo.base_quantity,
        created_at: eo.created_at,
        updated_at: eo.updated_at,
        note: `Engagement order stuck ${STUCK_THRESHOLD_MIN}+ minutes.`,
      },
    });
  }

  // 3. Organic runs overdue — scheduled to run but still pending 30+ min later
  const { data: overdueRuns } = await admin
    .from("organic_run_schedule")
    .select("id, run_number, scheduled_at, quantity_to_send, engagement_order_item_id, order_id")
    .eq("status", "pending")
    .gt("scheduled_at", maxAgeCutoff)
    .lt("scheduled_at", cutoff);
  for (const r of overdueRuns || []) {
    issues.push({
      order_kind: "engagement_run",
      order_ref: r.id,
      issue_code: "run_overdue",
      priority: "medium",
      details: {
        run_number: r.run_number,
        status: "pending",
        quantity: r.quantity_to_send,
        created_at: r.scheduled_at,
        updated_at: r.scheduled_at,
        note: `Run was scheduled ${fmtAgo(r.scheduled_at)} but still pending.`,
      },
    });
  }

  // ─── Dedup + escalation ───────────────────────────────────
  const now = new Date();
  let sent = 0;
  let reminders = 0;
  let resolved = 0;

  // Build a Set of current active issue keys for resolution detection
  const activeKeys = new Set(issues.map((i) => `${i.order_kind}|${i.order_ref}|${i.issue_code}`));

  for (const issue of issues) {
    const { data: existing } = await admin
      .from("order_health_alerts")
      .select("*")
      .eq("order_kind", issue.order_kind)
      .eq("order_ref", issue.order_ref)
      .eq("issue_code", issue.issue_code)
      .maybeSingle();

    if (!existing) {
      const nextStepMin = REMINDER_STEPS_MIN[0];
      const nextReminderAt = new Date(now.getTime() + nextStepMin * 60_000).toISOString();
      const ok = await sendTelegram(buildAlertMessage(issue, false, 0));
      if (ok) sent++;
      await admin.from("order_health_alerts").insert({
        order_kind: issue.order_kind,
        order_ref: issue.order_ref,
        issue_code: issue.issue_code,
        priority: issue.priority,
        next_reminder_at: nextReminderAt,
        reminder_step: 0,
        notification_count: 1,
        last_details: issue.details,
      });
      continue;
    }

    if (existing.resolved) {
      // Was resolved before but issue re-appeared → reopen as fresh alert
      const nextStepMin = REMINDER_STEPS_MIN[0];
      const ok = await sendTelegram(buildAlertMessage(issue, false, 0));
      if (ok) sent++;
      await admin
        .from("order_health_alerts")
        .update({
          resolved: false,
          resolved_at: null,
          first_alerted_at: now.toISOString(),
          last_alerted_at: now.toISOString(),
          next_reminder_at: new Date(now.getTime() + nextStepMin * 60_000).toISOString(),
          reminder_step: 0,
          notification_count: existing.notification_count + 1,
          last_details: issue.details,
        })
        .eq("id", existing.id);
      continue;
    }

    // Active alert — check if it's time for reminder
    const dueAt = existing.next_reminder_at ? new Date(existing.next_reminder_at) : null;
    if (dueAt && dueAt <= now) {
      const nextStep = Math.min(existing.reminder_step + 1, REMINDER_STEPS_MIN.length - 1);
      const nextStepMin = REMINDER_STEPS_MIN[nextStep];
      const ok = await sendTelegram(buildAlertMessage(issue, true, existing.reminder_step + 1));
      if (ok) reminders++;
      await admin
        .from("order_health_alerts")
        .update({
          last_alerted_at: now.toISOString(),
          next_reminder_at: new Date(now.getTime() + nextStepMin * 60_000).toISOString(),
          reminder_step: nextStep,
          notification_count: existing.notification_count + 1,
          last_details: issue.details,
        })
        .eq("id", existing.id);
    } else {
      // Just refresh details snapshot
      await admin
        .from("order_health_alerts")
        .update({ last_details: issue.details })
        .eq("id", existing.id);
    }
  }

  // Resolve alerts whose issue no longer appears
  const { data: openAlerts } = await admin
    .from("order_health_alerts")
    .select("*")
    .eq("resolved", false);

  for (const a of openAlerts || []) {
    const key = `${a.order_kind}|${a.order_ref}|${a.issue_code}`;
    if (activeKeys.has(key)) continue;

    // Fetch current state for resolution message
    let currentDetails: Record<string, any> = a.last_details || {};
    try {
      if (a.order_kind === "order") {
        const { data } = await admin
          .from("orders")
          .select("order_number, status, quantity, remains")
          .eq("id", a.order_ref)
          .maybeSingle();
        if (data) currentDetails = { ...currentDetails, ...data };
      } else if (a.order_kind === "engagement_order") {
        const { data } = await admin
          .from("engagement_orders")
          .select("order_number, status")
          .eq("id", a.order_ref)
          .maybeSingle();
        if (data) currentDetails = { ...currentDetails, ...data };
      } else if (a.order_kind === "engagement_run") {
        const { data } = await admin
          .from("organic_run_schedule")
          .select("run_number, status, quantity_to_send")
          .eq("id", a.order_ref)
          .maybeSingle();
        if (data) currentDetails = { ...currentDetails, status: data.status };
      }
    } catch (_) {}

    const ok = await sendTelegram(buildResolutionMessage(a, currentDetails));
    if (ok) resolved++;
    await admin
      .from("order_health_alerts")
      .update({ resolved: true, resolved_at: now.toISOString() })
      .eq("id", a.id);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      scanned: issues.length,
      new_alerts: sent,
      reminders_sent: reminders,
      resolved_sent: resolved,
      at: now.toISOString(),
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
