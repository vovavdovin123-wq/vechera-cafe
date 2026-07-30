# Вечера — бета сайта франшизы

```bash
npm install
npm run dev
```

Откройте http://localhost:3000

## Админка

Личная ссылка (не в меню сайта): **http://localhost:3000/admin**

По умолчанию:
- логин: `admin`
- пароль: `vechera2024`

Задайте свои значения в `.env` (`ADMIN_LOGIN`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`).

## Что уже есть

- Переключение точек (разное меню)
- Меню, корзина, заказ → FrontPad (live или stub) + уведомления
- Интерьер, Яндекс.Карты, анонимная обратная связь
- Админка: вход, фото с устройства, название/цена/состав, артикулы FrontPad

## FrontPad

Чеклист настройки и что заполнить в `.env`: **[docs/FRONTPAD.md](docs/FRONTPAD.md)**  
Бэкап-промпт для агента: **[docs/FRONTPAD_PROMPT_BACKUP.md](docs/FRONTPAD_PROMPT_BACKUP.md)**

Проверка после настройки секрета: `/api/frontpad/health`
