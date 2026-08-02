#!/usr/bin/env bash
set -euo pipefail

cd /var/www/vechera-cafe

echo "→ git pull"
git pull origin main

echo "→ build (staging dir, site keeps serving old .next)"
rm -rf .next-build
NEXT_DIST_DIR=.next-build npm run build

echo "→ swap build"
rm -rf .next-old
if [ -d .next ]; then
  mv .next .next-old
fi
mv .next-build .next

echo "→ pm2 reload"
pm2 reload vechera --update-env || pm2 restart vechera --update-env

rm -rf .next-old

if [ -f .env ]; then
  grep -q '^FRONTPAD_HOOK_URL=' .env || echo 'FRONTPAD_HOOK_URL=https://vechera-cafe.ru/api/frontpad/webhook' >> .env
  if grep -qE '^FRONTPAD_HOOK_STATUSES=.*(13|14|15)' .env 2>/dev/null; then
    sed -i 's/^FRONTPAD_HOOK_STATUSES=.*/FRONTPAD_HOOK_STATUSES=1,3,4,12,10,11/' .env
  elif ! grep -q '^FRONTPAD_HOOK_STATUSES=' .env; then
    echo 'FRONTPAD_HOOK_STATUSES=1,3,4,12,10,11' >> .env
  fi
fi

sleep 2
curl -sf http://127.0.0.1:3000/api/frontpad/health | head -c 400 || true
echo
echo "✓ Deploy complete"
