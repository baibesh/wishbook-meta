#!/usr/bin/env bash
# Starts the built API (mock models) and web app for E2E runs, then waits until both answer.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
: "${DATABASE_URL:?set DATABASE_URL to the e2e database}"
export MODELS=mock MOCK_DELAY_MS="${MOCK_DELAY_MS:-100}" PAGE_COUNT="${PAGE_COUNT:-4}"
export FREE_BOOKS=3 DEMO_CODES=E2E-DEMO ORDER_STAGE_MS="${ORDER_STAGE_MS:-1500}"
# Needs apps/api/geoip/country.mmdb: pnpm --filter @wishbook/api geoip
export GEO_BLOCK=true
# Test-only admin account for the admin flow.
export ADMIN_EMAIL=admin@e2e.test ADMIN_PASSWORD=e2e-admin-password ADMIN_SECRET=e2e-secret
export STORAGE_DIR="${STORAGE_DIR:-$ROOT/apps/api/storage-e2e}" PORT=4000

(cd "$ROOT/apps/api" && node dist/main.js > "$ROOT/e2e/api.log" 2>&1 &)
(cd "$ROOT/apps/web" && API_URL=http://localhost:4000 npx next start --port 3000 > "$ROOT/e2e/web.log" 2>&1 &)

for url in http://localhost:4000/api/health http://localhost:3000; do
  for _ in $(seq 1 60); do curl -sf "$url" > /dev/null && break; sleep 1; done
  curl -sf "$url" > /dev/null || { echo "not up: $url"; tail -n 50 "$ROOT"/e2e/*.log; exit 1; }
done
echo "stack up: web :3000, api :4000"
