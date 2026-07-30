# Бэкап-промпт: FrontPad × Вечера

Скопируйте блок ниже в новый чат с агентом, если нужно продолжить внедрение FrontPad или восстановить контекст.

---

## ПРОМПТ (копировать отсюда)

```
Проект: сайт кафе «Вечера» (Next.js App Router + TypeScript + Tailwind).
Путь: c:\Users\vovav\Desktop\vechera cafe
Прод: vechera-cafe.ru, VPS Timeweb, PM2 app `vechera`, путь /var/www/vechera-cafe
GitHub: vovavdovin123-wq/vechera-cafe (ветка main)

ЦЕЛЬ
Довести интеграцию FrontPad до полного пользовательского функционала на витрине
(среда API уже подготовлена — см. docs/FRONTPAD.md).

ЧТО УЖЕ ЕСТЬ В КОДЕ
- src/lib/frontpad.ts — клиент всех методов:
  new_order, get_status, get_client, get_certificate, get_products, get_stops
- Типы заказа расширены в src/lib/types.ts (OrderPayload): email, sale, score,
  card, certificate, person, pay, datetime, product_mod
- API:
  POST /api/orders → sendOrderToFrontPad
  POST /api/frontpad/webhook → статусы
  GET  /api/frontpad/health
  GET  /api/frontpad/products (admin)
  GET  /api/frontpad/status?orderId=|&phone=
  GET  /api/frontpad/client?phone=
  GET  /api/frontpad/certificate?code=
  GET  /api/frontpad/stops (admin)
- Корзина: CartDrawer → заказ delivery/pickup
- Админка /admin: поле frontpadArticle у блюд
- .env: FRONTPAD_SECRET, AFFILIATE/POINT по точкам, CHANNEL, TAGS, HOOK_*, SEND_PRICES
- Чеклист для владельца: docs/FRONTPAD.md

ЧТО СДЕЛАТЬ ДАЛЬШЕ (по приоритету)
1) Корзина: по blur телефона вызвать /api/frontpad/client и автозаполнить
   имя, улицу, дом, подъезд, этаж, кв., применить sale/score если есть.
2) После успешного заказа: экран статуса (webhook уже пишет в orders-store;
   опционально кнопка «Обновить» → /api/frontpad/status).
3) Поле сертификата в корзине → /api/frontpad/certificate → подставить
   sale / sale_amount / товар в заказ.
4) Админка: кнопка «Синхронизировать с FrontPad» (get_products, кэш 1 час),
   сопоставление по frontpadArticle, обновление name/price.
5) Периодический/ручной стоп-лист (get_stops) → available=false по артикулам.
6) Опционально: способ оплаты (pay), предзаказ (datetime), модификаторы.

ПРАВИЛА FRONTPAD
- POST form-urlencoded, UTF-8, https://app.frontpad.ru/api/index.php?METHOD
- ≤30 req/min; get_products ≤1/час; без циклов на get_status/client/certificate
- new_order только по клику пользователя
- Артикулы товаров — цифровые, совпадают с FP
- Без FRONTPAD_SECRET — stub-режим (не ломать)

НЕ ДЕЛАТЬ
- Не коммитить .env с секретами
- Не пушить force на main
- Не выдумывать методы вне официального API FrontPad

ДЕПЛОЙ ПОСЛЕ ИЗМЕНЕНИЙ
cd /var/www/vechera-cafe && git pull && npm run build && pm2 restart vechera

ОТВЕТЬ: сначала краткий план, затем код. Документацию не раздувать —
обновляй docs/FRONTPAD.md только если меняется контракт API или чеклист.
```

## Конец промпта

---

Сохранено: подготовка среды FrontPad для проекта Вечера.  
Обновляйте этот файл, если сильно меняется архитектура интеграции.
