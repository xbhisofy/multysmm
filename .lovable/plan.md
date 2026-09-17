# Fix admin manual fund management

## Changes
- Remove the hardcoded single-email restriction from the admin user screen and wallet function.
- Authorize manual add/subtract using the existing database-backed admin role.
- Keep wallet updates atomic through the existing admin wallet operation and preserve audit records.
- Improve the visible error handling so failed requests show the real reason.

## Verification
- Confirm non-admin users remain blocked.
- Test fund addition with an authenticated admin and verify wallet balance, transaction, and audit entry.
- Check the app build and relevant runtime logs.

## Technical details
- The function will validate the caller token, resolve the caller's admin role server-side, then call the existing `admin_adjust_wallet` operation.
- No payment, pricing, or provider-routing behavior will be changed.
