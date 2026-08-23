#!/usr/bin/env sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
backup_dir="${BACKUP_DIR:-$script_dir/backups}"
timestamp=$(date -u +"%Y%m%dT%H%M%SZ")
backup_file="$backup_dir/redpanda-$timestamp.db"

mkdir -p "$backup_dir"
cd "$script_dir"

docker compose exec -T api sh -c "sqlite3 /data/redpanda.db '.backup /tmp/redpanda-backup.db'"
docker compose cp api:/tmp/redpanda-backup.db "$backup_file"
docker compose exec -T api rm -f /tmp/redpanda-backup.db

find "$backup_dir" -type f -name 'redpanda-*.db' -mtime +"${BACKUP_RETENTION_DAYS:-30}" -delete

echo "SQLite backup created: $backup_file"
