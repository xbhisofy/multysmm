## Admin Users – Filters, Sorting & Search Upgrade

Ye large feature hai — realistically 2 phases mein deliver karunga. Phase 1 default sort + core sorts + high-value filters + search + column upgrades cover karega (jo aapki daily need hai). Phase 2 mein optional cheezein (saved presets, PDF/Excel export, country, login-as-user, some "platform usage" filters) baad mein add karunge — kyunki inke liye backend mein naya data track karna padega.

---

### Scope – Phase 1 (build now)

**Default sort**
- "Last Fund Added" ho — sabse recent depositor top par.
- Users jo kabhi fund add nahi kiye, list ke end mein.

**Sort dropdown** (instant, no reload):
- Last Fund Added (default), Highest/Lowest Wallet, Highest/Lowest Deposits, Highest/Lowest Spending, Highest/Lowest Orders, Newest/Oldest Registered, Most/Least Recently Active, Highest LTV (deposits+spending), A→Z, Z→A.

**Filters button (side sheet / drawer)**
- Registration Date: Today / Yesterday / 7d / 30d / Custom
- Last Fund Date: Today / 7d / 30d / Custom / Never
- Wallet Balance: 0 / ₹1–500 / ₹500–5000 / ₹5000+ / Custom
- Total Deposits: 0 / ₹1–1000 / ₹1000–10000 / ₹10000+ / Custom
- Total Spending: same buckets / Custom
- Total Orders: 0 / 1–10 / 10–100 / 100+ / Custom
- User Status: Active / Banned / Suspended (jo hum actually track karte hain)
- Last Login: Today / 7d / 30d / Never (auth.last_sign_in_at)
- Reset all + active filter count badge.

**Search bar** (partial match, instant):
- Username, Email, User ID, Order ID (agar match kare to us user ko dikhaye), Wallet ID.

**Table columns**:
- Username / Email, User ID (short), Wallet, Deposits, Spending, Orders, Last Fund Date, Last Login, Reg Date, Status, LTV.

**Color indicators** (small dot / row accent):
- Green = fund added in last 7d
- Blue = LTV ≥ ₹10,000
- Red = banned/suspended
- Orange = inactive 30+ days
- Gray = never deposited

**CSV export** of currently filtered/sorted list.

**Mobile**: filters as bottom drawer, table becomes card list.

---

### Scope – Phase 2 (later, on request)

- Saved filter presets (needs a new `admin_filter_presets` table).
- Excel/PDF export (needs extra libraries).
- Country filter (needs to start capturing country on signup).
- Platform usage filter (Instagram/YT/etc. per user aggregate).
- "Login as user" (impersonation — security-sensitive, alag design).
- Telegram username / phone search (currently profile pe stored nahi hain).

---

### Technical details

**Backend – `get_admin_users_summary` upgrade**
Function ko rewrite karunga taaki ek hi call mein sab data aaye:

- `last_deposit_at` — max `created_at` from `transactions` where `type='deposit' AND status='completed'`.
- `total_orders` — `orders` + `engagement_orders` count.
- `last_active_at` — max of last order/deposit/`profile.updated_at`.
- `last_sign_in_at` — from `auth.users` (SECURITY DEFINER so allowed).
- `is_banned`, `banned_reason` — already on profiles.
- Return existing fields + all above as JSON array.

Indexes add karunga performance ke liye:
- `transactions(user_id, type, status, created_at desc)`
- `orders(user_id)`, `engagement_orders(user_id)`

Function admin-only rahega (`has_role` check + only `authenticated` execute grant).

**Frontend – `src/pages/admin/AdminUsers.tsx`**
- Query fetches full list once (100k users tak client-side sort/filter fine hai for admin panel; agar aage scale kare to server-side pagination Phase 2).
- Sort state + filter state + search state → `useMemo` derived list.
- New `<UserFiltersSheet>` component using shadcn `Sheet`.
- New `<SortDropdown>` using shadcn `Select`.
- CSV export via client-side blob download.
- Existing tabs (All / No Plan / Monthly / Lifetime) preserved.
- All existing admin actions (add/subtract balance, ban, pause orders, cancel etc.) preserved as row-level buttons in a compact dropdown.

**Files touched**
- `supabase/migrations/*` – rewrite `get_admin_users_summary`, add indexes.
- `src/pages/admin/AdminUsers.tsx` – major refactor.
- `src/components/admin/UserFiltersSheet.tsx` (new).
- `src/components/admin/UserSortSelect.tsx` (new).
- `src/lib/admin-users-filters.ts` (new — pure filter/sort logic).

---

Confirm karo to Phase 1 start karta hoon.