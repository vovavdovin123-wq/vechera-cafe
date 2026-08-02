#!/usr/bin/env bash
# Запуск на VPS: bash scripts/deploy-server.sh
set -euo pipefail
cd /var/www/vechera-cafe
git pull origin main
npm run build
if [ -f .env ]; then
  grep -q '^FRONTPAD_HOOK_URL=' .env || echo 'FRONTPAD_HOOK_URL=https://vechera-cafe.ru/api/frontpad/webhook' >> .env
  grep -q '^FRONTPAD_HOOK_STATUSES=' .env || echo 'FRONTPAD_HOOK_STATUSES=1,3,4,12,10,11' >> .env
fi
pm2 restart vechera --update-env
sleep 2
curl -s http://127.0.0.1:3000/api/frontpad/health
