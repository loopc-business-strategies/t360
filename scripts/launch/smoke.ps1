# Post-deploy API smoke (Windows PowerShell).
# Usage:
#   $env:API_BASE = "https://api.example.com/api/v1"
#   .\scripts\launch\smoke.ps1

$ErrorActionPreference = "Stop"
$ApiBase = if ($env:API_BASE) { $env:API_BASE.TrimEnd("/") } else { "http://localhost:4000/api/v1" }

function Assert-Smoke {
  param([string]$Path, [string]$Expect)
  $url = "$ApiBase$Path"
  try {
    $body = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 15
  } catch {
    Write-Error "SMOKE FAIL: GET $url - $_"
    exit 1
  }
  $json = $body | ConvertTo-Json -Compress -Depth 10
  if ($json -notmatch [regex]::Escape($Expect) -and $json -notmatch '"success"\s*:\s*true') {
    # ConvertTo-Json may reorder; check success property
    if (-not $body.success) {
      Write-Error "SMOKE FAIL: GET $url unexpected: $json"
      exit 1
    }
  }
  if (-not $body.success) {
    Write-Error "SMOKE FAIL: GET $url success=false: $json"
    exit 1
  }
  Write-Host "OK: $Path"
}

Assert-Smoke "/health" "success"
Assert-Smoke "/ready" "success"
Assert-Smoke "/products?pageSize=1" "success"

Write-Host "Smoke passed against $ApiBase"
