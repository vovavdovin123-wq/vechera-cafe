# FrontPad × сайт «Вечера» — чеклист внедрения

Полная подготовка среды уже в репозитории: клиент API, маршруты, типы заказа, webhook.
Ниже — **что сделать вам** в FrontPad и на сервере, чтобы включить почти весь функционал API.

Официальные методы: `new_order`, `get_status`, `get_client`, `get_certificate`, `get_products` (+ `get_stops`, webhook).

Бэкап-промпт на случай продолжения работы с другим агентом: [`FRONTPAD_PROMPT_BACKUP.md`](./FRONTPAD_PROMPT_BACKUP.md).

---

## 1. В FrontPad (обязательно)

У вас **два аккаунта** FrontPad (центр и ипподром). В **каждом**:

1. **Настройки → Общие → API** — включить API, скопировать **Секрет**.
2. Убедиться, что тариф поддерживает API.
3. У товаров для сайта — **цифровые артикулы** (совпадают с админкой сайта для этой точки).
4. Смена должна быть **открыта**.

Филиалы/точки внутри одного аккаунта (`FRONTPAD_AFFILIATE_*`) при двух отдельных аккаунтах обычно **не нужны**.

---

## 2. На сервере сайта (обязательно)

В `/var/www/vechera-cafe/.env`:

```env
FRONTPAD_SECRET_CENTER=секрет_из_аккаунта_центра
FRONTPAD_SECRET_HIPPODROME=секрет_из_аккаунта_ипподрома
FRONTPAD_HOOK_URL=https://vechera-cafe.ru/api/frontpad/webhook
FRONTPAD_SEND_PRICES=0
```

Затем:

```bash
cd /var/www/vechera-cafe
git pull
npm run build
pm2 restart vechera
```

Проверка: `https://vechera-cafe.ru/api/frontpad/health`  
Ожидание: `"dualAccounts": true`, `"center": true`, `"hippodrome": true`.

Логика: заказ с точки «Центр» → секрет центра; «Ипподром» → секрет ипподрома.

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
