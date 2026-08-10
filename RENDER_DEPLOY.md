# Развёртывание Red Panda Study на Render

Проект разворачивается одним Blueprint из `render.yaml`:

- `red-panda-study-web` — frontend и серверный прокси `/api`;
- `red-panda-study-api` — Go API;
- `/data/redpanda.db` — SQLite на постоянном диске backend-сервиса.

## Секреты при первом создании Blueprint

Render попросит заполнить переменные с `sync: false`:

- `VIBE_API_KEY` — ключ VibeMarketolog со scope `generate`;
- `ADMIN_EMAIL` — email администратора;
- `ADMIN_PASSWORD` — уникальный пароль длиной не менее 12 символов.

Ключи не добавляются в GitHub и не записываются в `.env.example`.

## Проверка после деплоя

1. Открыть главную страницу frontend-сервиса.
2. Проверить `https://red-panda-study-api.onrender.com/api/health`.
3. Войти в `/admin/login`.
4. Создать приглашение ученику, активировать его и проверить кабинет.
5. Запустить Compass из кабинета ученика.
6. Перезапустить backend и убедиться, что данные сохранились на диске.

Если названия сервисов в Render будут изменены, обновите `PUBLIC_APP_URL` и
`ALLOWED_ORIGINS` на фактический внешний адрес frontend-сервиса.
