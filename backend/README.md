# Red Panda Study API

Go-сервис для заявок, чата поддержки и личных кабинетов.

## Локальный запуск

```bash
go run ./cmd/server
```

По умолчанию API слушает `:8788`, база создаётся в `./data/redpanda.db`, а frontend dev-server проксирует `/api` в Go.

Локальный администратор: `admin@redpandastudy.local`. Пароль задаётся через `ADMIN_PASSWORD`; встроенное значение предназначено только для разработки.

## Production

1. Скопировать `.env.example` в секреты платформы и заменить пароль, домен приложения и разрешённые origins.
2. Подключить постоянный volume к `/data`.
3. Направить `/api/*` основного домена на Go-сервис либо задать frontend-переменную `NEXT_PUBLIC_GO_API_URL`.
4. Настроить резервное копирование SQLite-файла или volume snapshot.

Если API и frontend размещены на разных доменах, задайте `CROSS_SITE_COOKIES=true` вместе с `SECURE_COOKIES=true`. Это включает `SameSite=None` для защищённой cookie-сессии.

Healthcheck: `GET /api/health`.

При `APP_ENV=production` сервер отказывается запускаться с демонстрационным паролем, без `PUBLIC_APP_URL` или без `ALLOWED_ORIGINS`.
