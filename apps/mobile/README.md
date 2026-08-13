# Tharagai customer app (`tharagai_mobile`)

Flutter customer client for t360 — OTP auth, catalog, cart, checkout (Razorpay/COD), orders, wishlist, account, AI chat.

## Stack

Riverpod, GoRouter, Dio, `flutter_secure_storage`, EN/TA string maps, `Tharagai*` design system.

## Local run

```bash
cd apps/mobile
flutter pub get
flutter analyze
flutter test

# Android emulator → host machine API
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api/v1

# iOS simulator / desktop
flutter run --dart-define=API_BASE_URL=http://localhost:4000/api/v1
```

Default without define: `http://localhost:4000/api/v1` ([lib/core/env.dart](lib/core/env.dart)).

Design gallery (`/gallery`) and stub device-register are **debug/profile only**.

## Release builds (store)

### Project script (APK)

From repo root (defaults API to staging Railway):

```bash
pnpm build:mobile:apk
# or: .\scripts\launch\build-mobile-apk.ps1
# or: ./scripts/launch/build-mobile-apk.sh
```

Override:

```powershell
$env:API_BASE_URL = "https://YOUR_PRODUCTION_API/api/v1"
$env:RAZORPAY_KEY_ID = "rzp_live_xxx"
pnpm build:mobile:apk
```

Output: `apps/mobile/build/app/outputs/flutter-apk/app-release.apk`

### Manual appbundle / IPA

Bake production API (and Razorpay public key if not returned by checkout payload):

```bash
cd apps/mobile

flutter build appbundle --release \
  --dart-define=API_BASE_URL=https://YOUR_PRODUCTION_API/api/v1 \
  --dart-define=RAZORPAY_KEY_ID=rzp_live_xxx

flutter build ipa --release \
  --dart-define=API_BASE_URL=https://YOUR_PRODUCTION_API/api/v1 \
  --dart-define=RAZORPAY_KEY_ID=rzp_live_xxx
```

Use the live Railway API base (same host as web `NEXT_PUBLIC_API_URL`, including `/api/v1`).

### Android signing

1. Create a Play upload keystore (operator).
2. Copy [android/key.properties.example](android/key.properties.example) → `android/key.properties` (gitignored).
3. Point `storeFile` at the `.jks` path; fill passwords and alias.
4. `flutter build appbundle --release …` will use the release signing config.

Without `key.properties`, release falls back to debug signing (local only — **not** for Play upload).

### iOS signing

Configure Apple Developer team + distribution profile in Xcode (`ios/Runner.xcworkspace`) before Archive / `flutter build ipa`.

## Store listing

Metadata stubs: [store/metadata](store/metadata/). Checklist: [docs/launch/STORE-LISTING.md](../../docs/launch/STORE-LISTING.md).

| Field | Value |
|-------|--------|
| Display name | Tharagai |
| Android applicationId | `com.loopc.tharagai.tharagai_mobile` |
| iOS bundle id | `com.loopc.tharagai.tharagaiMobile` |
| Privacy policy | `https://t360-web.vercel.app/policies/privacy` |

## Docs

- [docs/api/FLUTTER-APP.md](../../docs/api/FLUTTER-APP.md)
- [docs/launch/GO-LIVE.md](../../docs/launch/GO-LIVE.md)
