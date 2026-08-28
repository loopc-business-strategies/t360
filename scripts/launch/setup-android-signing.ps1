# Create Play upload keystore + android/key.properties for release APK/AAB signing.
# Usage (from repo root):
#   .\scripts\launch\setup-android-signing.ps1
# Optional env overrides:
#   KEYSTORE_PASSWORD, KEY_PASSWORD, KEY_ALIAS (default: upload)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$AndroidDir = Join-Path $RepoRoot "apps\mobile\android"
$KeystorePath = Join-Path $AndroidDir "upload-keystore.jks"
$PropsPath = Join-Path $AndroidDir "key.properties"
$CredsPath = Join-Path $AndroidDir "signing-credentials.local.txt"

$KeyAlias = if ($env:KEY_ALIAS) { $env:KEY_ALIAS.Trim() } else { "upload" }
$StorePassword = if ($env:KEYSTORE_PASSWORD) { $env:KEYSTORE_PASSWORD } else { $null }
$KeyPassword = if ($env:KEY_PASSWORD) { $env:KEY_PASSWORD } else { $null }

if (-not (Get-Command keytool -ErrorAction SilentlyContinue)) {
  Write-Error "keytool not found. Install JDK 17+ and ensure keytool is on PATH."
  exit 1
}

if (Test-Path $PropsPath) {
  Write-Host "key.properties already exists at $PropsPath"
  Write-Host "Delete it (and upload-keystore.jks if regenerating) to run setup again."
  exit 0
}

function New-RandomPassword {
  param([int]$Length = 24)
  $bytes = New-Object byte[] $Length
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return [Convert]::ToBase64String($bytes).Substring(0, $Length)
}

if (-not $StorePassword) { $StorePassword = New-RandomPassword }
if (-not $KeyPassword) { $KeyPassword = $StorePassword }

Write-Host "Generating upload keystore at $KeystorePath"

$keytoolArgs = @(
  "-genkeypair",
  "-v",
  "-keystore", $KeystorePath,
  "-alias", $KeyAlias,
  "-keyalg", "RSA",
  "-keysize", "2048",
  "-validity", "10000",
  "-storepass", $StorePassword,
  "-keypass", $KeyPassword,
  "-dname", "CN=Tharagai, OU=Mobile, O=LoopC, L=Chennai, ST=TN, C=IN"
)

& keytool @keytoolArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$propsContent = @"
storePassword=$StorePassword
keyPassword=$KeyPassword
keyAlias=$KeyAlias
storeFile=../upload-keystore.jks
"@

Set-Content -Path $PropsPath -Value $propsContent -Encoding ascii

$credsContent = @"
Tharagai Android upload keystore (local only - do NOT commit)
Generated: $(Get-Date -Format o)
Keystore: $KeystorePath
Alias: $KeyAlias
Store password: $StorePassword
Key password: $KeyPassword

Back up upload-keystore.jks and these passwords securely (1Password / Play Console).
"@
Set-Content -Path $CredsPath -Value $credsContent -Encoding ascii

Write-Host ""
Write-Host "Android release signing ready."
Write-Host "  key.properties -> $PropsPath"
Write-Host "  keystore       -> $KeystorePath"
Write-Host "  credentials    -> $CredsPath (gitignored - back up elsewhere)"
Write-Host ""
Write-Host "Rebuild release APK: pnpm build:mobile:apk"
