# Roadmap

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
