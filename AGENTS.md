# Project rules

- Generate provider funding reports in an admin-only function using fresh upstream rates, unsent work only, and historical paid totals for user exposure; never infer provider costs from mutable retail prices.

- Keep ads website-link validation in `src/lib/ads-link.ts` and reuse it for single and mass orders so network-independent acceptance stays consistent.
- Derive custom platform options from stored bundles; share manual ads-platform classification between frontend and functions so custom networks display and fulfil consistently without a schema migration.
- Filter order platforms by the URL's ads section using shared manual-platform classification; legacy ads-platform links also select that section so social and ads navigation stay separate.
- Model combined ads delivery as its own bundle item type and service so one quantity is billed once without relabelling historical separate-service orders.
- Keep colors in the shared token layers (`src/index.css`, `src/styles/member-experience.css`, `src/pages/smm-home.css`) so one palette drives the whole app; don't add new hardcoded hex accents in components.
- Keep Single Order on `/single-order` with `/orders` history and use `place-order` for server-priced wallet payment and mapped provider dispatch; never insert orders from the browser.
- Query provider-backed Single Order services without the persistent engagement cache and invalidate that catalog after admin changes so imports appear immediately without bundles.
- Use the shared single-order policy for quantity validation and final per-1000 pricing so the displayed charge and server debit agree without double markup.
- When deploying to the VPS, never overwrite its `.env`; the live build must point at the self-hosted backend (`https://api.multysmm.com`), not Lovable Cloud, or live users, admins and bundles disappear.
- The live MultySMM stack runs on the new shared VPS (credentials in the NEW_VPS_* secrets) beside other sites; touch only the `multysmm` nginx site, `/var/www/multysmm` and `/root/supabase/docker`, and start backend services with `--no-deps` (studio, pooler, meta and imgproxy stay off to fit memory).
