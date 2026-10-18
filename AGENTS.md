# Project rules

- Keep ads website-link validation in `src/lib/ads-link.ts` and reuse it for single and mass orders so network-independent acceptance stays consistent.
- Derive custom platform options from stored bundles; share manual ads-platform classification between frontend and functions so custom networks display and fulfil consistently without a schema migration.
- Filter order platforms by the URL's ads section using shared manual-platform classification; legacy ads-platform links also select that section so social and ads navigation stay separate.
- Model combined ads delivery as its own bundle item type and service so one quantity is billed once without relabelling historical separate-service orders.
- Keep colors in the shared token layers (`src/index.css`, `src/styles/member-experience.css`, `src/pages/smm-home.css`) so one palette drives the whole app; don't add new hardcoded hex accents in components.