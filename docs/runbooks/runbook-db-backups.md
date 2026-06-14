# Runbook: Database Backups

> **Status**: Active  
> **Last updated**: 2026-05-17  
> **Scope**: Production server — `boffmedia` database  
> **BookStack target**: Infrastructure → DevOps → Runbooks → DB Backups

---

## Overview

Daily encrypted backups of both production databases, written to the Hetzner StorageBox. Backups are compressed and AES-256 encrypted before transfer. 14-day rolling retention.

| Item | Value |
|---|---|
| Databases | `boffmedia` |
| MariaDB container | `pterodactyl-database-1` |
| Backup destination | `/mnt/laboon/backups/db/` (Hetzner StorageBox — `u376239.your-storagebox.de`) |
| Encryption key location | `/opt/backups/.backup-key` (host only — also stored off-server) |
| Script | `/opt/scripts/backup-db.sh` |
| Schedule | Daily at 02:00 UTC (root crontab) |
| Log | `/var/log/db-backup.log` |
| Success marker | `/opt/backups/.last-backup-success` |
| Retention | 14 days |

---

## How it works

The backup script runs on the host via cron. For each database it:

1. Runs `mysqldump` inside the `pterodactyl-database-1` container via `docker exec`
2. Pipes the dump through `gzip` on the host
3. Pipes the compressed stream through `openssl enc` (AES-256-CBC, PBKDF2) using the key at `/opt/backups/.backup-key`
4. Writes the encrypted file to `/mnt/laboon/backups/db/`
5. Writes a timestamp to `/opt/backups/.last-backup-success` (used by Grafana alert — see section 2 of the integration plan)
6. Prunes files older than 14 days

Output filename format: `{database}_{YYYY-MM-DD_HH-MM}.sql.gz.enc`

---

## Backup user

A dedicated MariaDB user with read-only permissions exists inside `pterodactyl-database-1`:

```sql
-- User created inside the container
-- Grants use '@'%' because docker exec connects via TCP, not Unix socket
CREATE USER 'backup_user'@'%' IDENTIFIED BY '...';
GRANT SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER ON boffmedia.* TO 'backup_user'@'%';

```

The password is stored in `/etc/environment` as `MYSQL_BACKUP_PASSWORD`. The script sources this file at startup so it works correctly from cron without a login shell.

---

## Backup script

Location: `/opt/scripts/backup-db.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

# Load env vars (needed when run from cron)
set -a; source /etc/environment; set +a

DATE=$(date +%Y-%m-%d_%H-%M)
BACKUP_DIR="/mnt/laboon/backups/db"
RETENTION_DAYS=14
MYSQL_USER="backup_user"
MYSQL_PASSWORD="${MYSQL_BACKUP_PASSWORD}"
CONTAINER="pterodactyl-database-1"
DATABASES=("boffmedia")
KEY_FILE="/opt/backups/.backup-key"

mkdir -p "$BACKUP_DIR"

for DB in "${DATABASES[@]}"; do
  FILENAME="${DB}_${DATE}.sql.gz.enc"
  echo "[$(date)] Backing up $DB..."

  docker exec "$CONTAINER" mysqldump \
    -u "$MYSQL_USER" \
    -p"${MYSQL_PASSWORD}" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    "$DB" \
    | gzip \
    | openssl enc -aes-256-cbc -pbkdf2 -pass file:"$KEY_FILE" \
    > "$BACKUP_DIR/$FILENAME"

  SIZE=$(du -sh "$BACKUP_DIR/$FILENAME" | cut -f1)
  echo "[$(date)] Done: $DB -> $FILENAME ($SIZE)"
done

find "$BACKUP_DIR" -name "*.sql.gz.enc" -mtime +$RETENTION_DAYS -delete
echo "[$(date)] Old backups pruned (>${RETENTION_DAYS} days)"

echo "$(date)" > /opt/backups/.last-backup-success
echo "[$(date)] Backup complete"
```

---

## Cron job

Registered in root's crontab (`crontab -l`):

```
0 2 * * * /opt/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
```

Check the log after the first automated run:
```bash
tail -30 /var/log/db-backup.log
```

---

## Restore procedure

### 1. Identify the backup to restore

```bash
ls -lh /mnt/laboon/backups/db/
```

### 2. Decrypt and decompress to a temp file

```bash
openssl enc -d -aes-256-cbc -pbkdf2 -pass file:/opt/backups/.backup-key \
  -in /mnt/laboon/backups/db/boffmedia_2026-05-17_02-00.sql.gz.enc \
  | gunzip > /tmp/boffmedia-restore.sql
```

### 3. Restore to a test database first — never restore directly to production

```bash
# Create test database inside the container
docker exec pterodactyl-database-1 mysql -u root -p \
  -e "CREATE DATABASE boffmedia_restore_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Pipe the SQL into the container
docker exec -i pterodactyl-database-1 mysql -u root -p boffmedia_restore_test \
  < /tmp/boffmedia-restore.sql

# Verify row counts match source
docker exec pterodactyl-database-1 mysql -u root -p \
  -e "SELECT 'source' AS db, COUNT(*) FROM boffmedia.users
      UNION ALL
      SELECT 'restored', COUNT(*) FROM boffmedia_restore_test.users;"
```

### 4. Promote to production (only after test verified)

```bash
# Rename databases inside the container
docker exec pterodactyl-database-1 mysql -u root -p \
  -e "RENAME TABLE boffmedia TO boffmedia_old; RENAME TABLE boffmedia_restore_test TO boffmedia;"
```

### 5. Clean up

```bash
docker exec pterodactyl-database-1 mysql -u root -p \
  -e "DROP DATABASE boffmedia_restore_test;"
rm /tmp/boffmedia-restore.sql
```

---

## Verify a backup without restoring

To confirm an existing encrypted file is valid without a full restore:

```bash
openssl enc -d -aes-256-cbc -pbkdf2 -pass file:/opt/backups/.backup-key \
  -in /mnt/laboon/backups/db/boffmedia_2026-05-17_14-13.sql.gz.enc \
  | gunzip | head -5
```

A valid backup starts with:
```
/*M!999999\- enable the sandbox mode */
-- MariaDB dump 10.19 ...
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `unbound variable: MYSQL_BACKUP_PASSWORD` | Script run without env loaded | Confirm `set -a; source /etc/environment; set +a` is at top of script |
| `Can't open file .backup-key` | Key file missing or wrong path | Confirm `/opt/backups/.backup-key` exists and is readable by root |
| `Access denied for backup_user@'%'` | Grant missing for that database | Re-run `GRANT` inside `pterodactyl-database-1` |
| StorageBox path not found | StorageBox not mounted | Check `df -h | grep laboon`; remount if needed: `mount /mnt/laboon` |
| `No such file or directory` on docker exec | Container not running | `docker ps | grep pterodactyl-database-1` — restart if needed |
