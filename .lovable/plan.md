# Fix live provider completion status

## Changes
- Let the order detail page securely request a status check only for runs belonging to the signed-in user; admins may check any run.
- Make the minute-by-minute order worker trigger the provider-status checker before dispatch decisions, so the existing VPS cron updates completed orders automatically.
- Keep provider response as the source of truth: `Completed` or valid `remains = 0` marks the run completed, then recalculates item and order status.
- Add focused tests for provider status normalization and completion handling.

## Verification
- Run the status tests and confirm the preview build remains healthy.
- Verify unauthorized bulk status checks stay blocked while owned single-run checks work.

## VPS update
- The final instructions will include copying both changed functions and restarting the functions container.
