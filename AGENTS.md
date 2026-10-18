# Project rules

- Keep ads website-link validation in `src/lib/ads-link.ts` and reuse it for single and mass orders so network-independent acceptance stays consistent.
- Derive custom platform options from stored bundles; share manual ads-platform classification between frontend and functions so custom networks display and fulfil consistently without a schema migration.