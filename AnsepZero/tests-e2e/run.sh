#!/bin/sh
# Menjalankan API uji (data bersih) + web statis + E2E. Dari folder proyek: sh tests-e2e/run.sh
cd "$(dirname "$0")/.."
pkill -f tests/dev-server.mjs 2>/dev/null; pkill -f "http.server 8080" 2>/dev/null
(cd backend-cloudflare && node --no-warnings tests/dev-server.mjs >/tmp/api.log 2>&1 &)
(cd frontend && python3 -m http.server 8080 >/tmp/web.log 2>&1 &)
sleep 2
python3 tests-e2e/e2e.py; code=$?
pkill -f tests/dev-server.mjs; pkill -f "http.server 8080"
exit $code
