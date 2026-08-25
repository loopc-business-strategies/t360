# Admin stay logged in — smoke checklist

After deploying admin web + mobile with this change:

## Web admin (`t360-admin`)

1. Sign in at `/login`.
2. Confirm tokens in DevTools → Application → **Local Storage** (`t360_admin_token`, `t360_admin_refresh`), not sessionStorage.
3. Close the tab completely; reopen the admin URL → still signed in (shell loads, not redirected to login).
4. Leave idle past access JWT (~15m) or force expiry; next navigation/API call should refresh silently and stay on page.
5. Disconnect network briefly and trigger an API call → error toast/message, **still signed in** after reconnect.
6. Profile → Log out → tokens cleared; must sign in again.

## Mobile admin

1. Staff login → mode `staff` in secure storage.
2. Open several admin screens that load in parallel after access may be expired → single refresh, no bounce to `/admin/login`.
3. Airplane mode during a load → error UI; reconnect → still logged in.
4. Explicit logout → requires login again.

## Not expected

- Customer storefront OTP sessions unchanged.
- Refresh still expires after ~30 days (`JWT_REFRESH_TTL_DAYS`).
