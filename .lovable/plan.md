# Smart Order Templates

A reusable "personal order profile" system. User saves every order setting (except the link) once, then future orders = open template → paste link → place order.

---

## 1. Database (single migration)

**Table `public.order_templates`**
- `user_id` (owner, RLS-scoped)
- `name`, `description`, `category` (Instagram/TikTok/YouTube/Facebook/Telegram/X/Other)
- `is_favorite` (bool), `color_label` (blue/orange/green/purple/red/yellow)
- `platform`, `service_id` (nullable — service may later be deleted)
- `service_snapshot` jsonb (name/category cached for display if service removed)
- `config` jsonb — the full snapshot: quantity, runs, interval, interval_unit, drip_feed, AI organic flags, delivery settings, advanced options, filters (country/gender/language/keywords/hashtags), and any engagement-order sub-items
- `usage_count` int, `last_used_at`, `created_at`, `updated_at`
- `is_archived` bool

RLS: user can CRUD only own rows; service_role full access.
Trigger: `updated_at` auto-refresh.

**Table `public.template_settings`** (single row, admin-managed)
- `enabled`, `max_per_user` (default 50)
- allow_categories / allow_favorites / allow_color_labels / allow_descriptions / allow_duplicate / allow_archive / allow_dashboard_widget / allow_save_after_order / allow_save_from_repeat
- `max_name_length` (default 60), `max_description_length` (default 300)

Public SELECT on settings (needed by client to hide/show features); UPDATE only for admin.

---

## 2. Frontend — new files

**Pages**
- `src/pages/Templates.tsx` — list page: search bar, filter chips (platform/category/favorites/recent/most-used), sort dropdown, grid of template cards, "Create Template" button. Favorites pinned first.
- `src/pages/TemplateEditor.tsx` — create/edit form (name required; description, category, color, favorite optional). Also embeds the existing engagement-order config panel so user can define the full snapshot.

**Components**
- `src/components/templates/TemplateCard.tsx` — preview card (icon, name, service, qty, runs, interval, live estimated price via current service pricing, usage count, last used, note, color strip). Buttons: Use / Edit / Duplicate / Favorite / Delete.
- `src/components/templates/SaveAsTemplateDialog.tsx` — reusable dialog to save current config; used from EngagementOrder after successful order and from Repeat Order.
- `src/components/dashboard/QuickTemplatesWidget.tsx` — dashboard card with top 4 favorites/recent + "View All →".

**Hooks / lib**
- `src/hooks/useTemplates.tsx` — CRUD, search, filter, sort, favorite toggle, duplicate, archive, usage tracking (increments `usage_count`, sets `last_used_at` on use).
- `src/lib/template-config.ts` — helpers to serialize the current engagement-order form state into `config` snapshot and to hydrate the form back from a snapshot.

---

## 3. Integration points (edits to existing files)

- `src/components/layout/Sidebar.tsx` — add "Templates" nav item (Bookmark icon) between Engagement Orders and AI Assistant.
- `src/App.tsx` — register `/templates` and `/templates/new`, `/templates/:id/edit` routes.
- `src/pages/EngagementOrder.tsx`:
  - Read `?template=<id>` query param → load template config, hydrate form, clear link field only.
  - After successful order placement → show "Save as Template" button (respects `allow_save_after_order`).
- `src/pages/Dashboard.tsx` — mount `<QuickTemplatesWidget />` when `allow_dashboard_widget` is on.
- Repeat-order flow → add "Save Configuration as Template" action (respects `allow_save_from_repeat`).

---

## 4. Behaviour rules

- **Price is never stored.** Card always recomputes from current service price × quantity.
- **Discontinued service:** if `service_id` no longer exists / inactive, card shows "Discontinued service" banner with `Choose Replacement` or `Delete`. Use button disabled.
- **Only link is empty on use.** Every other saved field is restored exactly.
- **Validation:** name required (respect max length), service must exist + active, quantity/runs/interval > 0, enforce `max_per_user` limit server-side (via trigger) and client-side.
- **Server-side ownership check** on every mutation via RLS.

---

## 5. Admin

- `src/pages/admin/AdminTemplateSettings.tsx` — form bound to `template_settings` singleton with all toggles + limits.
- Add to admin nav.

---

## 6. Out of scope (future, DB shape already supports)

Public marketplace, share/export/import, QR, AI-generated, team/agency templates. No code now, but jsonb `config` + separate settings row leave room.

---

## Build order

1. Migration (tables + RLS + settings singleton).
2. Hook + lib helpers.
3. Templates list page + card + editor.
4. Sidebar entry + routes.
5. EngagementOrder `?template=` hydration + "Save as Template" post-order.
6. Dashboard widget.
7. Repeat-order "Save as Template" entry.
8. Admin settings page.

Approve karo toh migration se shuru karta hun.