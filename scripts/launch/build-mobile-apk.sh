#!/usr/bin/env bash
# Build release APK for Tharagai mobile.
# Usage (from repo root):
#   ./scripts/launch/build-mobile-apk.sh
#   API_BASE_URL=https://api.example.com/api/v1 RAZORPAY_KEY_ID=rzp_live_xxx ./scripts/launch/build-mobile-apk.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
MOBILE_DIR="${REPO_ROOT}/apps/mobile"

API_BASE_URL="${API_BASE_URL:-https://api-staging-7912.up.railway.app/api/v1}"
API_BASE_URL="${API_BASE_URL%/}"
RAZORPAY_KEY_ID="${RAZORPAY_KEY_ID:-}"

if ! command -v flutter >/dev/null 2>&1; then
  echo "flutter not found on PATH. Install Flutter SDK and retry." >&2
  exit 1
fi

cd "${MOBILE_DIR}"

echo "Building release APK"
echo "  API_BASE_URL=${API_BASE_URL}"
if [[ -n "${RAZORPAY_KEY_ID}" ]]; then
  echo "  RAZORPAY_KEY_ID=(set)"
else
  echo "  RAZORPAY_KEY_ID=(omitted - use checkout payload key)"
fi

flutter pub get

DEFINES=(--dart-define="API_BASE_URL=${API_BASE_URL}")
if [[ -n "${RAZORPAY_KEY_ID}" ]]; then
  DEFINES+=(--dart-define="RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}")
fi

flutter build apk --release "${DEFINES[@]}"

APK_PATH="${MOBILE_DIR}/build/app/outputs/flutter-apk/app-release.apk"
if [[ ! -f "${APK_PATH}" ]]; then
  echo "Build finished but APK not found at ${APK_PATH}" >&2
  exit 1
fi

echo "APK ready: ${APK_PATH}"
echo "Note: without android/key.properties this APK uses debug signing (sideload/test only)."
