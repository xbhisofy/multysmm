# Restyle All User Pages

## Goal
Bring every signed-in user screen into the same calm sky-blue, editorial visual system as the new homepage while preserving all existing account, ordering, wallet, support, and settings behavior.

## Scope
- Redesign sign-in and sign-up with the homepage’s sky imagery, serif headlines, white panels, and blue controls.
- Restyle the shared desktop sidebar, mobile navigation, page background, user/balance card, active states, and buttons once so every signed-in page stays consistent.
- Update Dashboard, Full Engagement, Mass Order, Engagement Orders and order detail screens.
- Update AI Assistant, Wallet, API Access, Support, Settings, and standard Orders screens.
- Remove accidental empty visual space and improve mobile framing, card spacing, readable text, and sticky/floating controls.
- Preserve all current forms, data loading, links, order logic, payments, authentication, and admin behavior.

## Visual Direction
- Reuse the existing scenic sky asset throughout the inner experience as restrained headers and atmospheric backgrounds.
- Use the homepage’s editorial serif hierarchy, soft white surfaces, sky blue accents, dark ink text, and compact rounded controls.
- Replace the current purple/red/yellow visual treatment in user screens with semantic homepage-aligned tokens.
- Keep imagery purposeful and text contrast strong; no decorative clutter or fake metrics.

## Technical Details
- Introduce shared authenticated-page style utilities/tokens rather than repeating hardcoded colors.
- Refactor shared layout/navigation first, then apply the system page-by-page to existing components.
- Keep the existing React routes and Lovable Cloud calls unchanged.
- Verify the main signed-in flow at desktop and mobile widths, check console errors, and confirm the preview build succeeds.

## Completion Check
- Every user-visible route uses the same visual language.
- Navigation remains usable on mobile and desktop.
- Forms and major actions remain available and unchanged in behavior.
- No page has clipping, overlapping controls, or unintended blank sections.
