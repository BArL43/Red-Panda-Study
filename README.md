# Red Panda Study

[![CI](https://github.com/BArL43/Red-Panda-Study/actions/workflows/self-hosted.yml/badge.svg)](https://github.com/BArL43/Red-Panda-Study/actions/workflows/self-hosted.yml)

Red Panda Study (RPS) — full-stack платформа сопровождения поступления в зарубежные университеты. Проект объединяет публичный сайт, кабинеты ученика, наставника и администратора, приглашения и onboarding, задачи, чат и Red Panda Compass — инструмент подбора образовательной стратегии с rules-first логикой и опциональным AI-обогащением.

Проект сделан как собственная учебная продуктовая разработка с основным фокусом на Go backend, HTTP API, хранение данных, авторизацию и эксплуатацию сервиса.

## Что реализовано

- публичная часть сайта с описанием услуг, стран и консультаций;
- роли `student`, `mentor`, `admin`;
- invite-flow: администратор создаёт приглашение, пользователь активирует его и получает доступ к кабинету;
- отдельная авторизация администраторов и пользователей портала;
- кабинеты ученика, наставника и администратора;
- назначение наставников и управление задачами ученика;
- публичные и авторизованные диалоги с историей сообщений и read-state;
- Red Panda Compass с сохранением профиля и результатов анализа;
- каталог университетских программ и deterministic rules-based shortlist;
- опциональное AI-обогащение Compass через VibeMarketolog API с fallback на rules engine;
- учёт годовых подписок и заявок на консультацию;
- audit log для административных действий;
- self-hosted deployment через Docker Compose и Caddy.

## Архитектура

```text
Browser
   |
   v
Caddy :80/:443
   |
   v
Frontend / Worker
React + Next-compatible App Router + Vinext/Vite
   |
   | same-origin /api/*
   v
Go API :8788
net/http
   |
   v
SQLite (WAL)
```

В production публичным является только Caddy. Frontend и Go API находятся во внутренней Docker-сети. Браузер работает с API через same-origin `/api/*`, поэтому session cookies остаются first-party.

### Backend

Go API находится в `backend/` и использует стандартный `net/http` router.

Основные группы endpoint'ов:

- `/api/v1/consultations` — заявки на консультацию;
- `/api/v1/chat/*` и `/api/v1/conversations/*` — публичный и кабинетный чат;
- `/api/v1/invitations/*` — preview и активация приглашений;
- `/api/v1/admin/*` — административные операции;
- `/api/v1/portal/login`, `/api/v1/me`, `/api/v1/logout` — portal auth;
- `/api/v1/student/*`, `/api/v1/mentor/*`, `/api/v1/tasks/*` — кабинеты и задачи;
- `/api/v1/compass/*` — сохранение и чтение Compass-анализа.

SQLite работает в WAL mode с foreign keys и busy timeout. На уровне схемы используются внешние ключи, ограничения ролей/статусов, индексы и уникальное назначение одного активного наставника ученику.

## Backend security

В проекте реализованы базовые защитные механизмы, которые важны для обычного web backend:

- серверные сессии со случайными токенами; в БД хранится только SHA-256 hash токена;
- `HttpOnly` cookies, `Secure` в production и контролируемый `SameSite`;
- role-based authorization на стороне backend;
- пароли хэшируются PBKDF2-HMAC-SHA256 с уникальной солью;
- минимальная длина пароля — 12 символов, production admin password рекомендуется 16+;
- CORS/origin checks для изменяющих запросов;
- security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`);
- rate limiting для login, invitations и chat/consultation endpoints;
- ограничение размера JSON-body и `DisallowUnknownFields`;
- invite tokens и session tokens не сохраняются в открытом виде;
- runtime secrets и SQLite-файлы исключены из Git.

## Red Panda Compass

Compass строится по принципу **rules first**.

1. Профиль ученика валидируется на сервере.
2. Deterministic rules engine формирует shortlist программ, проверяет бюджет, язык и недостающие данные.
3. Базовый результат работает без внешнего AI-провайдера.
4. Если настроен `VIBE_API_KEY`, результат может быть дополнен AI-пояснением.
5. Анализ сохраняется в Go backend и доступен ученику и назначенному наставнику.

AI-интеграция не является единственной точкой отказа: при недоступном ключе, лимите или ошибке провайдера пользователь получает rules-based результат.

## Стек

**Backend:** Go, `net/http`, SQLite, `database/sql`  
**Frontend:** React 19, Next-compatible App Router, Vinext, Vite, TypeScript  
**AI integration:** VibeMarketolog API  
**Infrastructure:** Docker, Docker Compose, Caddy  
**CI:** GitHub Actions  
**Deployment:** self-hosted Linux VPS

## Структура репозитория

```text
app/                    routes и страницы frontend
components/             UI и portal-компоненты
lib/                    frontend/domain logic, Compass и university data
worker/                 frontend runtime, API proxy и Compass orchestration
backend/
  cmd/server/            entry point Go API
  internal/app/          handlers, store, auth, domain types
  Dockerfile
deploy/
  compose.yml            production stack
  Caddyfile              HTTPS reverse proxy
  backup.sh              SQLite backup helper
.github/workflows/       CI
```

## Локальный запуск

### Backend

```bash
cd backend
cp .env.example .env
go run ./cmd/server
```

По умолчанию API слушает порт `8788`.

### Frontend

В другом терминале:

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Для локальной разработки frontend проксирует `/api` на `http://127.0.0.1:8788`.

## Проверки

Frontend:

```bash
npm ci
npm run build
```

Backend:

```bash
cd backend
go test ./...
```

GitHub Actions дополнительно проверяет frontend build, Go API и Docker-образы.

## Deployment

Поддерживаемый production-вариант — Linux VPS с Docker Compose.

```bash
cd deploy
cp .env.example .env
# заполнить APP_DOMAIN, ADMIN_EMAIL, ADMIN_PASSWORD и при необходимости VIBE_API_KEY
docker compose up -d --build
```

Caddy автоматически поднимает HTTPS, а SQLite хранится в persistent Docker volume.

Подробная инструкция: [`SELF_HOSTED_DEPLOY.md`](SELF_HOSTED_DEPLOY.md).

## Secrets and data

В репозитории должны находиться только `.env.example` без реальных значений. Нельзя коммитить:

- `.env` / `.env.local`;
- `VIBE_API_KEY`;
- admin credentials;
- production SQLite database;
- TLS/private key files;
- backups с пользовательскими данными.

## Ограничения

Проект рассчитан на раннюю эксплуатацию и небольшое количество пользователей. SQLite выбран осознанно для текущего масштаба; переход на PostgreSQL при росте нагрузки остаётся отдельной архитектурной задачей.

Данные о стоимости программ и дедлайнах в Compass являются planning references. Для финальной стратегии поступления требуется проверка по официальным страницам университетов.
