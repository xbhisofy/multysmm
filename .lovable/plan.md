# Admin Dashboard — Advanced Analytics & Time-Based Filters

This is a large, multi-week feature. To ship something useful fast without breaking the current dashboard, I'll split it into **Phase 1 (build now)** and **Phase 2 (later)**. Please confirm the split before I start.

## Phase 1 — build now

### Filter bar (top of `/admin`)
- Presets: Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Last Month, This Year, Lifetime, Custom (start + end date)
- Stored in URL query (`?range=last7`) so refresh keeps the view
- Instant refresh via a single RPC call — no page reload

### Analytics cards (period-aware)
Every card recomputes for the selected range. Compared vs previous equal-length window for the growth arrow (green ↑ / red ↓ / gray –).

- **Financial:** Total Deposits, Gross Revenue (order value), Net Revenue (deposits − refunds), Total Profit (revenue − provider cost), Average / Largest / Smallest Deposit, Pending Deposits, Failed Deposits, Refunded Amount
- **Orders:** Total, Completed, Processing, Pending, Cancelled, Failed, Refunded, Avg/Highest/Lowest Order Value (single + engagement orders combined, plus a small breakdown)
- **Users:** New Registrations, Users Who Added Funds (in range), First-Time Depositors (in range), VIP Users (LTV ≥ ₹10k), Banned Users, Active Users (signed in during range), Inactive Users
- **Wallet:** Current Total Wallet Balance (live), Total Wallet Credits (in range), Total Wallet Debits (in range)
- **Platform breakdown:** Order counts per platform — Instagram, TikTok, YouTube, Facebook, Telegram, X/Twitter, Other (from `services.category`)
- **Top lists (in range):** Top 10 Depositors, Top 10 Spenders, Top 10 by Order Count, Top 10 by Profit (LTV proxy)

### UX
- Cards grouped in collapsible sections (Financial / Orders / Users / Wallet / Platform / Top lists)
- Growth chip on each stat card
- CSV export of the current range's stats + top lists
- Mobile: filter collapses into a bottom-sheet, cards stack 1-col → 2-col → 3-col

### Backend
- Single new RPC `get_admin_analytics(from_ts, to_ts)` returning one JSON payload with every card + previous-period counterparts. Security-definer + admin check, same pattern as `get_admin_dashboard_stats`.
- Uses existing tables — no schema change beyond one or two helper indexes on `transactions(type, status, created_at)` and `orders(status, created_at)` if missing.
- Frontend caches per `(from, to)` key via React Query for 30 s.

### Files
```text
supabase/migrations/<ts>_admin_analytics_rpc.sql   -- new RPC + indexes
src/lib/admin-analytics.ts                          -- range presets, formatting, CSV
src/components/admin/AnalyticsRangeBar.tsx          -- filter bar + custom range
src/components/admin/AnalyticsStatCard.tsx          -- card w/ growth chip
src/pages/admin/Admin.tsx                           -- wire filter + new sections
```

## Phase 2 — later (on request)
- **Withdrawals** — no withdrawal system exists yet in the DB, so "Total Withdrawals" is skipped in Phase 1
- **Suspended Users** — no `suspended` state exists, only `banned`; treated same as banned in Phase 1
- **Returning Customers** — needs a stricter definition; will confirm later
- **Provider analytics** (success/failure rate, provider revenue) — needs an `order → provider_account_id` join not yet stored on `orders`; will add tracking first
- **Excel / PDF export** — CSV covers 95% of needs; add later if wanted
- **Charts** — Phase 1 is numeric cards only; line/bar charts come next
- **Super-admin permission gating** for financial analytics — currently every admin sees everything; will add a role split later
- **Caching layer** beyond React Query (e.g. materialised view) — only if queries get slow at scale

## Technical notes (safe to skip)
- All order rows counted = `orders` + `engagement_orders` unioned.
- "Profit" = Σ(order price − Σ(run cost via `services.price` × qty / 1000)). Same math as existing top-up plan RPC.
- Growth = `((current − previous) / previous) * 100`, previous window = same length immediately before `from_ts`.
- Custom range max 366 days to keep queries fast.

Reply **"go"** to build Phase 1, or tell me what to add/remove first.