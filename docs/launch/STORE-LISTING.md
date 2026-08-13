# Store Listing Prep — Play Store / App Store

Actual upload requires client Apple Developer + Google Play Console accounts. This package prepares assets and copy only.

## App identity

| Field | Value |
|-------|--------|
| Display name | Tharagai |
| Android applicationId | `com.loopc.tharagai.tharagai_mobile` |
| iOS bundle id | `com.loopc.tharagai.tharagaiMobile` |
| Version | From `apps/mobile/pubspec.yaml` (`1.0.0+1`) |
| Support URL | `https://t360-web.vercel.app/policies/privacy` (or dedicated support page) |
| Privacy policy URL | `https://t360-web.vercel.app/policies/privacy` |

Metadata: [apps/mobile/store/metadata](../../apps/mobile/store/metadata/).

## Release build (required before submit)

Do **not** ship localhost. From `apps/mobile`:

```bash
flutter build appbundle --release \
  --dart-define=API_BASE_URL=https://YOUR_PRODUCTION_API/api/v1 \
  --dart-define=RAZORPAY_KEY_ID=rzp_live_xxx
```

Android upload signing: copy `apps/mobile/android/key.properties.example` → `android/key.properties` (gitignored) and point at the Play upload keystore. See [apps/mobile/README.md](../../apps/mobile/README.md).

Release builds refuse mock payment completion and hide design gallery / stub device register.

## Asset checklist (operator)

| Asset | Spec (typical) | Ready |
|-------|----------------|-------|
| App icon | 512×512 (Play); App Store icon set | [ ] |
| Feature graphic (Play) | 1024×500 | [ ] |
| Phone screenshots | Min 2; portrait | [ ] |
| Tablet screenshots | Optional | [ ] |
| Short description | ≤80 chars | [x] copy in metadata |
| Full description | Store listing body | [ ] polish placeholder |
| Content rating questionnaire | Complete in console | [ ] |
| Privacy URL in console | Matches metadata | [x] `t360-web.vercel.app/policies/privacy` |

## Pre-submit

- [ ] Production API URL baked via `--dart-define=API_BASE_URL=…` (no localhost)
- [ ] `android/key.properties` + upload keystore (not debug signing)
- [ ] Privacy / terms linked from store listing
- [ ] Payment / data safety declarations match actual SDKs (Razorpay; no FCM yet)
- [ ] Staging/production signed build tested on devices (OTP → checkout → order)
- [ ] Rollback build retained (previous store version)
- [ ] Google Play + Apple Developer accounts (client)

## Out of scope here

Fastlane automation can be added later; first release may be manual console upload. Push/FCM is deferred — declare accordingly in data-safety forms.
