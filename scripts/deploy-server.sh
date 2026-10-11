#!/usr/bin/env bash
# Запуск на VPS: bash scripts/deploy-server.sh
set -euo pipefail
cd /var/www/vechera-cafe
git pull origin main
npm run build
if [ -f .env ]; then
  grep -q '^FRONTPAD_HOOK_URL=' .env || echo 'FRONTPAD_HOOK_URL=https://vechera-cafe.ru/api/frontpad/webhook' >> .env
  if grep -q '^FRONTPAD_HOOK_STATUSES=' .env; then
    if grep -qE '^FRONTPAD_HOOK_STATUSES=.*(13|14|15)' .env; then
      sed -i 's/^FRONTPAD_HOOK_STATUSES=.*/FRONTPAD_HOOK_STATUSES=1,3,4,12,10,11/' .env
      echo "Updated FRONTPAD_HOOK_STATUSES to 1,3,4,12,10,11"
    fi
  else
    echo 'FRONTPAD_HOOK_STATUSES=1,3,4,12,10,11' >> .env
  fi
fi
grep -q '^TELEGRAM_STANDALONE_POLLER=' .env 2>/dev/null || echo 'TELEGRAM_STANDALONE_POLLER=1' >> .env
pm2 restart vechera --update-env
if pm2 describe vechera-telegram >/dev/null 2>&1; then
  pm2 restart vechera-telegram --update-env
else
  pm2 start scripts/telegram-poller.mjs --name vechera-telegram --cwd /var/www/vechera-cafe
fi
pm2 save || true
sleep 2
curl -s http://127.0.0.1:3000/api/frontpad/health
