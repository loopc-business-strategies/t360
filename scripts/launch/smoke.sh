#!/usr/bin/env bash
# Post-deploy API smoke. Usage:
#   API_BASE=https://api.example.com/api/v1 ./scripts/launch/smoke.sh
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:4000/api/v1}"
API_BASE="${API_BASE%/}"

fail() {
  echo "SMOKE FAIL: $*" >&2
  exit 1
}

ok() {
  echo "OK: $*"
}

check_json() {
  local path="$1"
  local expect_substr="$2"
  local url="${API_BASE}${path}"
  local body
  body="$(curl -fsS --max-time 15 "$url")" || fail "GET $url"
  echo "$body" | grep -q "$expect_substr" || fail "GET $url missing '$expect_substr' in: $body"
  ok "$path"
}

check_json "/health" '"success":true'
check_json "/ready" '"success":true'
check_json "/products?pageSize=1" '"success":true'

echo "Smoke passed against ${API_BASE}"
