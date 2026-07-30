# FrontPad × сайт «Вечера» — чеклист внедрения

Полная подготовка среды уже в репозитории: клиент API, маршруты, типы заказа, webhook.
Ниже — **что сделать вам** в FrontPad и на сервере, чтобы включить почти весь функционал API.

Официальные методы: `new_order`, `get_status`, `get_client`, `get_certificate`, `get_products` (+ `get_stops`, webhook).

Бэкап-промпт на случай продолжения работы с другим агентом: [`FRONTPAD_PROMPT_BACKUP.md`](./FRONTPAD_PROMPT_BACKUP.md).

---

## 1. В FrontPad (обязательно)

1. **Настройки → Общие → API** — включить API, скопировать **Секрет**.
2. Убедиться, что тариф поддерживает API (`invalid_plant` = тариф без API).
3. Каждому блюду, которое продаётся на сайте, в карточке товара задать **уникальный цифровой артикул**.
4. Открыть **смену** в программе (иначе `cash_close`).
5. Для двух точек на сайте:
   - в справочнике **Филиалы** взять «Код API» → в `.env` как `FRONTPAD_AFFILIATE_CENTER` / `_HIPPODROME`;
   - при необходимости **Точки продаж** → `FRONTPAD_POINT_*`.
6. Создать **канал продаж** «Сайт» (или аналог) → код в `FRONTPAD_CHANNEL`.
7. (Опционально) теги заказов → `FRONTPAD_TAGS=сайт,онлайн`.
8. В справочнике **Варианты оплаты** посмотреть коды (наличные / карта / онлайн) — пригодятся для поля `pay`.
9. Включить **автосохранение клиентов**, если нужен email (`mail`) и накопление карт/скидок.

---

## 2. На сервере сайта (обязательно)

В `/var/www/vechera-cafe/.env` (или локальном `.env`):

```env
FRONTPAD_SECRET=ваш_секрет_из_fp
FRONTPAD_AFFILIATE_CENTER=...
FRONTPAD_AFFILIATE_HIPPODROME=...
FRONTPAD_POINT_CENTER=...
FRONTPAD_POINT_HIPPODROME=...
FRONTPAD_CHANNEL=...
FRONTPAD_HOOK_URL=https://vechera-cafe.ru/api/frontpad/webhook
FRONTPAD_HOOK_STATUSES=1,2,3,4,5
FRONTPAD_SEND_PRICES=0
```

Затем:

```bash
cd /var/www/vechera-cafe
# после git pull при обновлении кода:
npm run build && pm2 restart vechera
```

Проверка: открыть `https://vechera-cafe.ru/api/frontpad/health`  
Ожидание: `{ "configured": true, "mode": "live" }`.

---

## 3. В админке сайта (обязательно)

1. Зайти на `/admin`.
2. Для **каждого** блюда в меню обеих точек указать **Артикул FrontPad** — тот же, что в карточке товара FP.
3. Сделать тестовый заказ с телефона → в FrontPad должен появиться заказ со звуком (подгрузка ~ до 2 мин).

Без артикулов сайт вернёт ошибку и **не** отправит заказ в live.

---

## 4. Что уже работает на сайте

| Функция FrontPad | Статус на сайте |
| --- | --- |
| `new_order` — заказ с сайта | ✅ Корзина → `/api/orders` |
| Адрес доставки (улица, дом, подъезд, этаж, кв.) | ✅ |
| Имя / телефон / комментарий | ✅ |
| Филиал / точка / канал / теги | ✅ через `.env` |
| Webhook статусов | ✅ `/api/frontpad/webhook` |
| Stub без секрета | ✅ |
| Админка: артикулы у блюд | ✅ |
| `get_products` | ✅ API `/api/frontpad/products` (админ) |
| `get_status` | ✅ API `/api/frontpad/status` |
| `get_client` | ✅ API `/api/frontpad/client` |
| `get_certificate` | ✅ API `/api/frontpad/certificate` |
| `get_stops` | ✅ API `/api/frontpad/stops` (админ) |
| Health | ✅ `/api/frontpad/health` |

---

## 5. Что ещё подключить в UI (следующий этап разработки)

Среда и API **готовы**; на витрине пока не выведены:

1. **Автозаполнение адреса** по телефону (`get_client`) в корзине.
2. **Статус заказа** для гостя после оформления (`get_status` или webhook → экран «Ваш заказ готовится»).
3. **Сертификат / скидка / баллы** в корзине (`get_certificate` + поля `certificate` / `sale` / `score` в заказе).
4. **Синхронизация меню** из FP (`get_products`) — кнопка в админке «Подтянуть цены/названия» (лимит **1 раз/час**).
5. **Стоп-лист** (`get_stops`) — периодически помечать `available: false` у блюд.
6. **Предзаказ** (`datetime`) и **способ оплаты** (`pay`) в форме корзины.
7. **Модификаторы** (`product_mod`) — если в FP есть добавки к блюдам.

Чтобы доделать UI — вставьте промпт из [`FRONTPAD_PROMPT_BACKUP.md`](./FRONTPAD_PROMPT_BACKUP.md).

---

## 6. Лимиты и правила FrontPad (важно)

- ≤ **30** запросов/мин, ≤ **2**/сек.
- `get_products` — **не чаще 1 раза в час**.
- `get_status` / `get_client` / `get_certificate` — **запрещены циклы** (только по действию пользователя).
- `new_order` — только после явного действия клиента (кнопка «Заказать»).
- Кодировка UTF-8, метод POST, `application/x-www-form-urlencoded`.

---

## 7. Быстрый smoke-test

1. `GET /api/frontpad/health` → `configured: true`.
2. В админке: все артикулы заполнены.
3. Заказ с сайта → в FP появляется номер.
4. Смена статуса в FP → если настроен hook, в `/admin/orders` обновляется «Статус FP».
5. (Админ) `GET /api/frontpad/products` → список артикулов совпадает с FP.
