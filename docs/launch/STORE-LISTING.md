# Store Listing Prep — Play Store / App Store

Actual upload requires client Apple Developer + Google Play Console accounts. This package prepares assets and copy only.

## App identity

| Field | Value / placeholder |
|-------|---------------------|
| Display name | Tharagai |
| Android applicationId | See `apps/mobile/android` (`com…` — confirm before submit) |
| iOS bundle id | See `apps/mobile/ios` |
| Version | From `apps/mobile/pubspec.yaml` (`1.0.0+1`) |
| Support URL | `https://<production-web>/policies/privacy` (or dedicated support page) |
| Privacy policy URL | `https://<production-web>/policies/privacy` |

Metadata stubs: [apps/mobile/store/metadata](../../apps/mobile/store/metadata/).

## Asset checklist

| Asset | Spec (typical) | Ready |
|-------|----------------|-------|
| App icon | 512×512 (Play); App Store icon set | [ ] |
| Feature graphic (Play) | 1024×500 | [ ] |
| Phone screenshots | Min 2; portrait | [ ] |
| Tablet screenshots | Optional | [ ] |
| Short description | ≤80 chars | [ ] copy in metadata |
| Full description | Store listing body | [ ] |
| Content rating questionnaire | Complete in console | [ ] |

## Pre-submit

- [ ] Production API URL in release builds (no localhost)
- [ ] Privacy / terms linked from store listing
- [ ] Payment / data safety declarations match actual SDKs (Razorpay, etc.)
- [ ] Staging signed build tested on devices
- [ ] Rollback build retained (previous store version)

## Out of scope here

Fastlane automation can be added later; first release may be manual console upload.
