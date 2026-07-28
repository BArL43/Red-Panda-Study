# Red Panda Study — Oracle Cloud Always Free

Этот набор запускает Go API, SQLite и HTTPS в Docker. База хранится во внутреннем Docker volume и не исчезает при обновлении контейнера.

## Что понадобится

- Oracle Cloud Free Tier account.
- Домен для API. Подойдёт бесплатный `*.duckdns.org`.
- Публичный адрес frontend: `https://red-panda-study.smart-ray-0878.chatgpt.site`.
- SSH-ключ на вашем компьютере. Приватный ключ и пароли никому не отправляйте.

## 1. Создать виртуальную машину в Oracle Cloud

1. Откройте Oracle Cloud Console → **Compute** → **Instances** → **Create instance**.
2. Выберите Ubuntu 24.04 или Oracle Linux и форму **Ampere A1 Flex** с пометкой *Always Free eligible*. Для старта достаточно 1 OCPU и 6 GB RAM.
3. Создайте или выберите Public VCN. Сохраните приватный SSH-ключ только на своём компьютере.
4. После запуска закрепите public IPv4 address, чтобы API не поменял адрес после остановки VM.
5. В Security List / Network Security Group откройте входящие TCP-порты:
   - 22 — только со своего текущего IP;
   - 80 — для выпуска HTTPS-сертификата;
   - 443 — для API.

## 2. Привязать домен API

1. Создайте, например, `redpanda-study-api.duckdns.org` в DuckDNS или используйте собственный поддомен `api.ваш-домен`.
2. Укажите в DNS public IPv4 адрес Oracle VM.
3. Дождитесь, пока домен открывает IP. HTTPS выпустится автоматически при первом запуске Caddy.

## 3. Установить Docker на VM

Подключитесь к VM по SSH и выполните:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl unzip
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo \"${UBUNTU_CODENAME:-$VERSION_CODENAME}\") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
exit
```

Подключитесь заново, чтобы применились права Docker.

## 4. Передать и настроить пакет

Скопируйте архив `red-panda-oracle-backend.zip` на VM через SCP/SFTP, распакуйте и перейдите в папку `backend/oracle`:

```bash
unzip red-panda-oracle-backend.zip
cd red-panda-oracle-backend/backend/oracle
cp oracle.env.example .env
nano .env
```

В `.env` обязательно замените:

- `API_DOMAIN` — ваш DuckDNS/собственный домен API без `https://`;
- `ADMIN_EMAIL`;
- `ADMIN_PASSWORD` — уникальный пароль от 16 символов;
- `PUBLIC_APP_URL` и `ALLOWED_ORIGINS` — текущий адрес сайта Red Panda Study.

Не меняйте `CROSS_SITE_COOKIES=true`: это нужно, потому что сайт и API находятся на разных доменах.

## 5. Запустить и проверить

```bash
docker compose -f compose.yml up -d --build
docker compose -f compose.yml ps
curl -fsS https://ВАШ_API_DOMAIN/api/health
```

Последняя команда должна вернуть JSON со `"status":"ok"`.

## 6. Резервная копия базы

Раз в неделю сохраните копию базы на свой компьютер или в Object Storage:

```bash
docker compose -f compose.yml exec -T api sh -c 'cp /data/redpanda.db /data/redpanda-backup.db'
docker compose -f compose.yml cp api:/data/redpanda-backup.db ./redpanda-backup.db
```

## 7. Подключить frontend

После успешного healthcheck пришлите разработчику только адрес вида `https://redpanda-study-api.duckdns.org`. Пароль, SSH-ключ и файл `.env` не передавайте. Для frontend будет задана переменная `NEXT_PUBLIC_GO_API_URL` с этим адресом.

## Обновление backend

Замените пакет новой версией и в папке `backend/oracle` выполните:

```bash
docker compose -f compose.yml up -d --build
```

Docker volume `red_panda_data` сохраняет SQLite при обновлении контейнера.
