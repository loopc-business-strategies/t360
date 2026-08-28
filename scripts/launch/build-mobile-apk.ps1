# Build release APK for Tharagai mobile (Windows PowerShell).
# Usage (from repo root):
#   pnpm build:mobile:apk
#   .\scripts\launch\build-mobile-apk.ps1
# Override API / Razorpay:
#   $env:API_BASE_URL = "https://api.example.com/api/v1"
#   $env:RAZORPAY_KEY_ID = "rzp_live_xxx"
#   .\scripts\launch\build-mobile-apk.ps1

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$MobileDir = Join-Path $RepoRoot "apps\mobile"

$ApiBase = if ($env:API_BASE_URL) {
  $env:API_BASE_URL.TrimEnd("/")
} else {
  "https://api-production-7d30.up.railway.app/api/v1"
}

$RazorpayKey = if ($env:RAZORPAY_KEY_ID) { $env:RAZORPAY_KEY_ID.Trim() } else { "" }

if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
  Write-Error "flutter not found on PATH. Install Flutter SDK and retry."
  exit 1
}

Set-Location $MobileDir

Write-Host "Building release APK"
Write-Host "  API_BASE_URL=$ApiBase"
if ($RazorpayKey) {
  Write-Host "  RAZORPAY_KEY_ID=(set)"
} else {
  Write-Host "  RAZORPAY_KEY_ID=(omitted - use checkout payload key)"
}

flutter pub get
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$defines = @(
  "--dart-define=API_BASE_URL=$ApiBase"
)
if ($RazorpayKey) {
  $defines += "--dart-define=RAZORPAY_KEY_ID=$RazorpayKey"
}

flutter build apk --release @defines
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$ApkPath = Join-Path $MobileDir "build\app\outputs\flutter-apk\app-release.apk"
if (-not (Test-Path $ApkPath)) {
  Write-Error "Build finished but APK not found at $ApkPath"
  exit 1
}

Write-Host "APK ready: $ApkPath"
if (Test-Path (Join-Path $MobileDir "android\key.properties")) {
  Write-Host "Signed with release keystore (android/key.properties)."
} else {
  Write-Host "Note: without android/key.properties this APK uses debug signing (sideload/test only)."
}
