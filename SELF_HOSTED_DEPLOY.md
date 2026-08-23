# Red Panda Study — self-hosted VPS deployment

This is the supported deployment path for a paid Linux VPS at Timeweb Cloud or
Selectel. It runs the website, Go API, SQLite database and HTTPS proxy as one
Docker Compose stack. Only Caddy is public; the API remains inside the private
Docker network, so browser requests stay same-origin and session cookies remain
first-party.

## Production and staging

Create two independent Ubuntu 24.04 VPS instances:

| Environment | Recommended size | Domain example |
| --- | --- | --- |
| production | 2 vCPU, 4 GB RAM, 60–80 GB NVMe | `rps.example.ru` |
| staging | 1–2 vCPU, 2 GB RAM, 30–40 GB NVMe | `staging.rps.example.ru` |

Never share `.env`, the Docker volumes, admin credentials or VibeMarketolog
keys between environments.

## Server setup

1. Point the domain's A record at the VPS public IPv4 address.
2. Allow inbound TCP 80 and 443. Restrict SSH (22) to your own IP.
3. Install Docker Engine and the Docker Compose plugin for Ubuntu 24.04.
4. Clone this repository on the server, then create the deployment env file:

   ```bash
   cd Red-Panda-Study/deploy
   cp .env.example .env
   chmod 600 .env
   nano .env
   ```

5. Set `APP_DOMAIN`, `VIBE_API_KEY`, `ADMIN_EMAIL`, and a unique
   `ADMIN_PASSWORD` (at least 16 characters). Do not commit this file.
6. Start the stack:

   ```bash
   docker compose up -d --build
   docker compose ps
   curl -fsS "https://$APP_DOMAIN/api/health"
   ```

Caddy obtains and renews TLS certificates automatically once DNS has
propagated.

## Updates

Pull a reviewed commit and rebuild the affected containers:

```bash
git pull --ff-only
cd deploy
docker compose up -d --build
```

The `red_panda_data` Docker volume is not removed by this command.

## Backups and restore drill

The application still uses SQLite; migration to PostgreSQL is a separate
product task. Create an off-server backup at least daily:

```bash
cd deploy
./backup.sh
```

Copy the resulting file in `deploy/backups/` to object storage or another
machine. A backup on the same VPS does not protect against a lost VPS.

Before launch, test restoring a backup on staging. Keep at least 30 daily
copies and document who can access them.

## Verification checklist

- `https://YOUR_DOMAIN/` opens without VPN from a Russian network.
- `https://YOUR_DOMAIN/api/health` returns a healthy response.
- Admin login, invite activation, student portal and public chat work.
- Compass creates an analysis with the production VibeMarketolog key.
- Restarting `api` keeps all data.
- A staging deployment cannot access production data or secrets.
