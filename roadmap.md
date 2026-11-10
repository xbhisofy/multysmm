# Roadmap

- [ ] Add compact platform-scoped bundle selection, admin primary designation, selected-bundle pricing/dispatch, tests and VPS deployment.

- [x] Fix Admin Bundles mobile service-card overflow: wrap full service names, move linked/provider controls below, remove mobile indentation and allow price rows to shrink/wrap. VPS build passed, environment unchanged, live Bundles HTTP 200; authenticated visual verification remains unavailable (preview Access Denied). Pricing/mappings untouched.

- [x] Restore admin total user deposits, today's deposits and live wallet balance from existing dashboard stats; deployed VPS build passed, source hash/live asset and admin HTTP 200 verified, environment unchanged. Authenticated visual check unavailable because self-hosted session minting is not permitted; payment data untouched.

- [x] Replace green theme with shared white/sky-blue tokens and compact OYO Media-style text, icons and spacing. Deployed frontend to VPS; environment hash unchanged and self-hosted backend target verified. Live mobile homepage/auth show blue theme without overflow or runtime errors; all six routes return 200, Single Order/History source hashes match, and BottingPro HTTPS returns 200. Authenticated member visual check remains unverified.

- [x] Add colorful platform icons to category/services/history and owner-scoped ordinary provider order status reconciliation; deployed on live VPS, 14 tests passed, authenticated mobile menus/history and status endpoint verified.
- [ ] Reconcile 21 historical Single Orders without recorded dispatch provider: blocked by missing provenance and dispatch logs; do not guess accounts or resend paid orders. New dispatches persist provider identity.

- [x] Remove sidebar Ads Monetization link, Engagement Console header and Draw Your Growth Curve section; preserve order forms and delivery behavior.

- [x] Match Single Order and Order History to supplied mobile references with mint theme: searchable category/service menus, facts and numbered steps, status filters, scrollable table and copy IDs. Five pricing tests and controlled desktop/mobile UI checks passed; real authenticated data check blocked by paused preview backend. No VPS deployment requested in this turn.

- [x] Add private admin fund-bot /bal and tap controls; live balance and top-up reports delivered for six provider groups, unauthorized/duplicate updates rejected. Fixed missing-mapping crash and bounded website loading; VPS build/tests passed. Authenticated website view not rechecked; unavailable providers remain explicitly incomplete.

- [x] Configure dedicated Telegram successful-deposit alerts for ZapUPI and OxaPay; live VPS test message delivered, five unit tests passed. Real payment not performed; paused Cloud preview deployment unavailable.

- [x] Audit and repair provider financial reporting; verified authenticated live report and Refresh, using upstream rates and historical paid value with no customer-data changes.
- [ ] Complete Whop cost verification: blocked because its API times out (DNS also fails from the sandbox); report marks its 53 runs unpriced instead of inventing a cost.

- [x] Add a simple Single Order page with service search, platform/category filters, price, wallet payment and separate history.
- [x] Restore admin service import and invalidate the Single Order catalog immediately after imports and edits.
- [x] Verify Single Order quantity/pricing rules and signed-out protection; preserve legacy order pricing and engagement/ads flows.
- [x] Verify Single Order quantity/pricing rules and signed-out protection; preserve legacy order pricing and engagement/ads flows.
- [x] Deploy Single Order feature and engagement toggle-card removal to the VPS (multysmm.com serving build 5d34d321, functions synced and restarted, worker cron intact).

- [ ] Separate Ads Monetization platforms from normal social engagement ordering and verify both entry points.

- [x] Deploy the Monetag platform icon crash fix to the VPS; verified live asset matches the VPS build and login opens without errors (authenticated order-page check unavailable).

- [x] Add Monetag beside Adsterra as a separate ads platform with its own combined Impressions / Visits bundle.

- [x] Combine default ads Impressions / Visits into one service, card and quantity while preserving custom services and existing orders.

- [x] Allow admin-named custom platforms, bundles and service types, and show custom platforms on order screens.

- [x] Keep default ads bundle limited to Impressions and Visits while preserving admin-added custom types.

- [x] Show complete ads order details with separate copy-link and copy-all actions in admin.
- [x] Accept valid website links from any domain for ads orders, in single and mass mode.

- [x] Share current UI deployment steps for the user’s VPS.

- [x] Restyle every authenticated user page and shared navigation to match the Catalis sky-blue editorial design.

- [x] Synchronize live provider completion status and stop completed orders displaying as processing.

- [x] Restore automatic dispatch by allowing queued busy runs to retry providers on every cron cycle.

- [x] Recolor the whole app — homepage, auth, member area, payment cards and admin — to the light green palette.

- [x] Make the mobile bottom navigation icons professional: one uniform inactive style, one green gradient active tile, solid white bar with no bleed-through.

- [x] Rename Order tab to New Order with always-green tabs; deploy everything (Monetag platform, green palette, ads feature, New Order nav) live to the VPS with Monetag bundle in the VPS database.
- [x] Remove the Total User Deposits (All Time) hero card from the admin dashboard and deploy live to the VPS; verified the string is absent from every served bundle and the live index matches the fresh build.

- [x] Migrate full MultySMM (code, self-hosted backend, database, functions, payments, cron, backups) from old VPS to the new shared VPS without touching BottingPro/ProxyPulse; old VPS now forwards the backend to the new one.
- [x] DNS for multysmm.com, www and api now points to the new VPS; SSL renewal, worker, backups verified there.
