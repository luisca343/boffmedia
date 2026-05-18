# Infrastructure & Codebase Integration Plan

> **Purpose**: Close all critical infrastructure, observability, deployment, and codebase quality gaps identified in the audit. Every item here has a direct, concrete utility — nothing is added for its own sake.  
> **Stack**: NestJS · NextJS · MariaDB · DrizzleORM · Docker · Portainer · GitLab CI · Prometheus · Grafana · Pino  
> **Agent usage**: Each section is a self-contained checklist. Items are ordered so earlier ones unblock later ones. Mark `x` when complete, `~` when in progress, `!` when blocked.  
> **Last updated**: 2026-05-17

---

## Decisions log

| Topic | Decision | Rationale |
|---|---|---|
| Backup storage | Hetzner StorageBox at /mnt/laboon/backups/db, 14-day retention | StorageBox confirmed mounted with 591GB free — offsite by default |
| Backup offsite | StorageBox (u376239.your-storagebox.de) — network-attached, always mounted | Decided 2026-05-17; original "no offsite" decision was incorrect |
| Logging | Pino via `nestjs-pino` | Structured JSON, Loki-ready, battle-tested |
| Staging environment | Dropped — local Docker image testing instead | Solo developer; local discipline replaces staging |
| Production deploy trigger | Option B — manual on Git tag | More control; batch features before releasing. Decided 2026-05-17 |
| Test scope | Unit + integration (Supertest) + e2e (Playwright) | Full stack coverage from day one |
| Coverage CI gate | Warn only — never fail the pipeline on coverage | Avoids blocking deploys while coverage is being built |
| TypeScript | Strict mode enforced | Enforced via `tsconfig.json` + ESLint rules |
| Validation | Global `ValidationPipe` | Applies to all current and future agent-generated endpoints |
| Exception handling | Global filter, typed exceptions | Consistent error shape across entire API |
| Auth roles in JWT | `SessionUser` interface extended with `roles: string[]`; `validateUser` and `createFromGoogle` fetch roles from DB at login time | Roles were missing from the initial JWT, causing `RolesGuard` to always reject despite the user having the correct role in the DB. Refresh path already fetched fresh roles — initial login did not. Fixed 2026-05-17 |
| Furret Today editor auth | `MinecraftMiddleware` excludes `POST/PUT/DELETE /smartrotom/documents/news*` and `POST /smartrotom/documents/newsstatus`; `documentsService.ts` news mutations use `apiAuthedPUT/POST/DELETE`; `NewsContent.tsx` and `editar/[id]/page.tsx` pass `token` prop to `CustomEditor` | Middleware blocked all non-GET smartrotom requests without `server` field; editor save button had no token (was receiving `undefined`). Fixed 2026-05-17 |

---

## Risk summary

| # | Item | Risk if ignored | Effort | Status |
|---|---|---|---|---|
| 1 | Database backups | Permanent data loss | Half a day | `[~]` cron pending first run |
| 2 | Prometheus + Grafana wired to app | Blind to production failures | Half a day | `[~]` MariaDB live, API pending deploy |
| 3 | Automated Portainer deploy | Manual deploys forever, no rollback | 2 hours | `[~]` validate ✅, build ✅ fixed 2026-05-17, deploy ⏳ untested |
| 4 | Structured logging (Pino) | Unqueryable logs, blind debugging | 1 day | `[x]` Done — all console calls replaced, zero TS errors |
| 5 | Global ValidationPipe + DTOs | Security gaps, inconsistent API | 1 day | `[ ]` |
| 6 | GitLab CI validate stage | Broken code reaches production | 2 hours | `[ ]` |
| 7 | Strict TypeScript enforcement | Compounding type debt | 1 day | `[ ]` |
| 8 | Global exception filter | Inconsistent error responses | Half a day | `[x]` Done 2026-05-17 |
| 9 | Core test coverage baseline | Agent verification has no teeth | Ongoing | `[x]` 104 service specs + 32 controller specs done — 2161 tests |
| 10 | End-to-end validation | No proof the full stack works together | 1 session | `[ ]` |

---

## Table of Contents

1. [Database backups](#1-database-backups)
2. [Prometheus + Grafana — wire to application](#2-prometheus--grafana--wire-to-application)
3. [Automated Portainer deploy](#3-automated-portainer-deploy)
4. [Structured logging with Pino](#4-structured-logging-with-pino)
5. [Global ValidationPipe + missing DTOs](#5-global-validationpipe--missing-dtos)
6. [GitLab CI validate stage](#6-gitlab-ci-validate-stage)
7. [Strict TypeScript enforcement](#7-strict-typescript-enforcement)
8. [Global exception filter + typed errors](#8-global-exception-filter--typed-errors)
9. [Core test coverage baseline](#9-core-test-coverage-baseline)
10. [End-to-end validation](#10-end-to-end-validation)
11. [Appendix — useful commands](#11-appendix--useful-commands)

---

## 1. Database backups

> **Decision**: local-only backups on the production server. 14-day rolling retention with compressed encrypted dumps. No cloud storage.  
> **Risk acknowledged**: if the server hardware fails catastrophically, backups are lost alongside the database. This is the accepted tradeoff for a solo project with no storage budget. Mitigated by longer local retention (14 days vs typical 7) and monitoring the backup log via Grafana alert.

### Prerequisites

- [x] Confirm available disk space on production server: `df -h`
- [x] Confirm MariaDB root or backup user credentials available
- [x] Confirm `/opt/backups/db` directory exists or can be created: `mkdir -p /opt/backups/db`
- [x] Install `openssl` if not present: `apt install openssl`
- [x] Generate and securely store a backup encryption key:

```bash
openssl rand -base64 32 > /opt/backups/.backup-key
chmod 600 /opt/backups/.backup-key
```

> Store the encryption key somewhere OTHER than the server — print it, write it in a password manager, anything. Without this key encrypted backups are useless.

### Dedicated backup user

- [x] Create a MariaDB user with minimal permissions (never use root for backups):

```sql
CREATE USER 'backup_user'@'localhost' IDENTIFIED BY 'strong_generated_password';
GRANT SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER ON boffmedia.* TO 'backup_user'@'localhost';
GRANT SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER ON boff_agent.* TO 'backup_user'@'localhost';
FLUSH PRIVILEGES;
```
> Note: SmartRotom data lives inside `boffmedia`. `agent_memory` in the original plan = `boff_agent`. Confirmed 2026-05-17.

- [x] Store `backup_user` password in `/etc/environment` as `MYSQL_BACKUP_PASSWORD`

### Backup script

- [x] Create `/opt/scripts/backup-db.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

DATE=$(date +%Y-%m-%d_%H-%M)
BACKUP_DIR="/opt/backups/db"
RETENTION_DAYS=14
MYSQL_USER="backup_user"
MYSQL_PASSWORD="${MYSQL_BACKUP_PASSWORD}"
MYSQL_HOST="localhost"
DATABASES=("boffmedia" "boff_agent")
KEY_FILE="/opt/backups/.backup-key"

mkdir -p "$BACKUP_DIR"

for DB in "${DATABASES[@]}"; do
  FILENAME="${DB}_${DATE}.sql.gz.enc"
  echo "[$(date)] Backing up $DB..."

  mysqldump \
    --host="$MYSQL_HOST" \
    --user="$MYSQL_USER" \
    --password="$MYSQL_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    "$DB" \
    | gzip \
    | openssl enc -aes-256-cbc -pbkdf2 -pass file:"$KEY_FILE" \
    > "$BACKUP_DIR/$FILENAME"

  SIZE=$(du -sh "$BACKUP_DIR/$FILENAME" | cut -f1)
  echo "[$(date)] ✔ $DB backed up → $BACKUP_DIR/$FILENAME ($SIZE)"
done

# Remove backups older than retention window
find "$BACKUP_DIR" -name "*.sql.gz.enc" -mtime +$RETENTION_DAYS -delete
echo "[$(date)] ✔ Backups older than $RETENTION_DAYS days removed"

# Write success marker (Grafana monitors this file's modification time)
echo "$(date)" > /opt/backups/.last-backup-success
echo "[$(date)] ✔ Backup complete"
```

- [x] Make script executable: `chmod +x /opt/scripts/backup-db.sh`
- [x] Test script manually: `/opt/scripts/backup-db.sh`
- [x] Confirm encrypted files created in `/mnt/laboon/backups/db/`

### Cron job

- [x] Add to root crontab (`sudo crontab -e`):

```
# Daily database backup at 02:00
0 2 * * * /opt/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
```

- [x] Verify cron entry: `sudo crontab -l`

### Restore procedure

- [ ] Document and test the restore procedure — **do this now, not when you need it**:

```bash
# Decrypt and decompress
openssl enc -d -aes-256-cbc -pbkdf2 -pass file:/opt/backups/.backup-key \
  -in /opt/backups/db/boffmedia_2026-05-15_02-00.sql.gz.enc \
  | gunzip > /tmp/boffmedia-restore.sql

# Restore to a test database (NEVER restore directly to production without testing)
mysql -u root -p -e "CREATE DATABASE boffmedia_restore_test;"
mysql -u root -p boffmedia_restore_test < /tmp/boffmedia-restore.sql

# Verify row counts match source
mysql -u root -p -e "SELECT COUNT(*) FROM boffmedia.users; SELECT COUNT(*) FROM boffmedia_restore_test.users;"

# Drop test DB when confirmed
mysql -u root -p -e "DROP DATABASE boffmedia_restore_test;"
rm /tmp/boffmedia-restore.sql
```

- [ ] Perform a full test restore — confirm row counts match between source and restored DB
- [ ] Document restore procedure in BookStack: Infrastructure → DevOps → Runbooks → DB Restore

### Verification

- [x] Script runs manually without errors
- [x] Encrypted files present in `/mnt/laboon/backups/db/`
- [x] `.last-backup-success` file updated after each run
- [ ] Wait for first automated cron run — confirm `/var/log/db-backup.log` shows success
- [x] Test restore confirmed — decrypt + gunzip verified, valid SQL header confirmed 2026-05-17
- [ ] Grafana alert configured for backup monitoring (see section 2)

---

## 2. Prometheus + Grafana — wire to application

> **Decision**: you already have Prometheus and Grafana running. This section wires them to the actual application. Currently nothing is pointed at the Boffmedia/SmartRotom containers.

### NestJS metrics export

- [x] Install dependencies:

```bash
pnpm --filter api add @willsoto/nestjs-prometheus prom-client
```

- [x] Register `PrometheusModule` in `AppModule`:

```typescript
// apps/api/src/app.module.ts
import { PrometheusModule } from '@willsoto/nestjs-prometheus'

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: { enabled: true },
      path: '/metrics',
    }),
  ],
})
export class AppModule {}
```

- [x] Create HTTP metrics middleware:

```typescript
// apps/api/src/common/middleware/metrics.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { Histogram, Counter } from 'prom-client'

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000]
})

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code']
})

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now()
    res.on('finish', () => {
      const duration = Date.now() - start
      const route = (req.route?.path as string | undefined) ?? req.path
      const labels = {
        method: req.method,
        route,
        status_code: String(res.statusCode)
      }
      httpRequestDuration.observe(labels, duration)
      httpRequestTotal.inc(labels)
    })
    next()
  }
}
```

- [x] Register `MetricsMiddleware` globally in `AppModule`:

```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(MetricsMiddleware).forRoutes('*')
  }
}
```

- [ ] Restrict `/metrics` endpoint to internal Docker network only — add to Nginx config or Docker network rules so it is never publicly accessible
- [ ] Verify `/metrics` returns Prometheus-formatted output locally: `curl http://localhost:34301/metrics`

### Prometheus scrape config

- [x] Add scrape jobs to `prometheus.yml` — uses `172.17.0.1:{port}` pattern (bridge gateway), not container names. See `docs/runbooks/runbook-prometheus-grafana.md` for full config.

- [x] Add `mysqld_exporter` container — standalone `docker run`, NOT docker-compose. v0.19+ requires `.my.cnf` config file at `/opt/mysqld_exporter.cnf` (chmod 644). See runbook for details.

- [x] Reload Prometheus: `docker exec prometheus kill -HUP 1`
- [x] `mariadb` target shows `UP` in Prometheus
- [ ] `boffmedia-api` target shows `UP` — pending deploy of metrics code
- [ ] Verify metrics exist: query `http_requests_total` in Prometheus expression browser (after deploy)

### Grafana dashboard

- [x] Create dashboard: **Boffmedia — Application Overview**
  - Dashboard UID: `boffmedia-overview`
  - Source JSON: `docs/grafana-dashboard-boffmedia.json`
  - Import command: see `docs/runbooks/runbook-prometheus-grafana.md`
  - MariaDB panels live now; API panels pending deploy
- [ ] Document dashboard URL in BookStack: Infrastructure → DevOps → Grafana dashboards

### Grafana alerts

- [x] Configure notification channel — email working 2026-05-18:
  - SMTP configured in `/docker/config/grafana/grafana.ini` (smtp.gmail.com:587, luisca343@gmail.com)
  - Fix: lines were commented out with `;` — uncommented `enabled`, `host`, `user`, `password`, `from_address`, `from_name`
  - Gmail App Password generated at myaccount.google.com → Security → App passwords (requires 2FA)
  - Alerts below are NOT created yet — no contact point to route to

- [ ] Create alert: **API error rate > 1% for 5 minutes**

```
Condition: rate(http_requests_total{status_code=~"5.."}[5m])
           / rate(http_requests_total[5m]) > 0.01
For: 5m
Message: "Boffmedia API error rate above 1% — check logs"
```

- [ ] Create alert: **API container down**

```
Condition: up{job="boffmedia-api"} == 0
For: 2m
Message: "Boffmedia API container is not responding to Prometheus scrape"
```

- [ ] Create alert: **DB connections above 80%**

```
Condition: mysql_global_status_threads_connected
           / mysql_global_variables_max_connections > 0.8
For: 5m
Message: "MariaDB connections approaching maximum limit"
```

- [ ] Create alert: **Backup missed** (monitors `.last-backup-success` file age via node_exporter)

```
Condition: time() - node_filestat_modification_time{path="/opt/backups/.last-backup-success"} > 90000
For: 0m
Message: "Database backup has not run in over 25 hours — check /var/log/db-backup.log"
```

> Note: this alert requires `node_exporter` with `--collector.textfile` or `--collector.filesystem` enabled. Alternative: write backup timestamp as a Prometheus metric from the backup script itself.

- [ ] Test each alert by temporarily triggering the condition (stop API container, wait 2 min)
- [ ] Confirm notification received for each alert

### Agent integration

- [ ] Update `PROMETHEUS_URL` in `.env.agent` to point at active Prometheus
- [ ] Test `agent:check_system_health` MCP tool — confirm real metrics returned, not null
- [ ] Test `agent:capture_metrics_baseline` — confirm snapshot written to `metrics_snapshots` table

---

## 3. Automated Portainer deploy

> **Decision: PENDING — choose before implementing this section.**  
> Two options are documented below. Pick one, mark it, then complete the checklist.

### ⚠ Deploy trigger decision

```
[ ] OPTION A — Push to main deploys automatically
    Every merge to main triggers: validate → build → deploy
    Simple. No manual step. Risk: a bad merge reaches production immediately.
    Mitigated by: CI validate stage (lint + typecheck + tests) must pass first.

[x] OPTION B — Manual trigger on Git tag  ← SELECTED 2026-05-17
    Merges to main deploy automatically to nothing.
    Production deploy requires: git tag v1.2.3 && git push --tags
    More control. Slightly more friction per release.
    Better fit if you batch features before releasing.
```

Mark one option above before continuing. Both options share the same setup steps below — only the `.gitlab-ci.yml` trigger differs.

---

> **Implementation note 2026-05-17**: Portainer CE webhooks are a paid feature. Deploy uses SSH instead — see `docs/runbooks/runbook-ci-cd-pipeline.md`. Portainer section below replaced by SSH-based approach.

### Docker image tagging

- [x] GitLab CI already tags with `:latest` and `:{CI_PIPELINE_IID}` (pipeline number used instead of commit SHA):

```yaml
build:
  stage: build
  before_script:
    - echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_HUB_USER" --password-stdin
  script:
    - docker build
        -t $DOCKER_HUB_USER/boffmedia-api:$CI_COMMIT_SHORT_SHA
        -t $DOCKER_HUB_USER/boffmedia-api:latest
        -f apps/api/Dockerfile .
    - docker push $DOCKER_HUB_USER/boffmedia-api:$CI_COMMIT_SHORT_SHA
    - docker push $DOCKER_HUB_USER/boffmedia-api:latest
  needs:
    - lint
    - typecheck
    - test
```

- [x] `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` already in GitLab CI/CD variables
- [ ] Verify both image tags appear in Docker Hub after a passing build

### Deploy method — SSH (replaces Portainer webhook)

> Portainer CE container webhooks are a paid feature. Using SSH deploy instead.

- [x] Generated Ed25519 deploy key pair locally
- [x] Public key added to `~/.ssh/authorized_keys` on production server
- [x] `SSH_PRIVATE_KEY` added to GitLab CI/CD variables (File type, Protected)
- [x] `DEPLOY_HOST` added to GitLab CI/CD variables (`148.251.3.244`, Protected)

### GitLab CI deploy stage — Option A (automatic on main)

```yaml
deploy:
  stage: deploy
  script:
    - curl -X POST "$PORTAINER_WEBHOOK_URL"
  only:
    - main
  needs:
    - build
```

### GitLab CI deploy stage — Option B (manual on Git tag)

```yaml
deploy:
  stage: deploy
  script:
    - curl -X POST "$PORTAINER_WEBHOOK_URL"
  only:
    - tags
  when: manual
  needs:
    - build
```

### Full pipeline stages

- [ ] Confirm final `.gitlab-ci.yml` stage order:

```yaml
stages:
  - validate    # lint + typecheck + test
  - build       # docker build + push (both tags)
  - deploy      # portainer webhook
```

### Rollback procedure

- [ ] Document rollback in BookStack: Infrastructure → DevOps → Runbooks → Deploy Rollback:

```bash
# Option 1 — via Portainer UI
# Stack → Edit → Change image tag from 'latest' to 'abc1234' → Deploy

# Option 2 — via GitLab (re-run deploy job from previous pipeline)
# GitLab → CI/CD → Pipelines → find previous successful pipeline → re-run deploy job
```

- [ ] Tag all images with `CI_COMMIT_SHORT_SHA` so rollback targets are always available

### Verification

- [x] Validate stage passes (v0.0.2 — typecheck clean after adding cron + sharp deps)
- [x] Build stage fixed 2026-05-17:
  - Upgraded base image `node:20-slim` → `node:22-slim` (transitive dep requires `node:sqlite`, available from Node 22.5+)
  - Pinned `"packageManager": "pnpm@10.24.0"` in root `package.json` — corepack was pulling pnpm 11.x which has stricter build-approval rules incompatible with existing `onlyBuiltDependencies` config
  - Updated CI validate image `node:20-alpine` → `node:22-alpine` to match
- [!] Docker image size is 3.67 GB — needs investigation and reduction before it becomes a bandwidth/deploy problem. Main contributors: `calibre` (~1 GB), Playwright + Chromium (~700 MB), `ffmpeg` (~100 MB), `node_modules`. Options: split heavy tools into a sidecar, use BuildKit cache mounts, or lazy-load Playwright browser at runtime instead of baking it into the image.
- [ ] Confirm validate → build → deploy all pass end-to-end
- [ ] Confirm application responds correctly after first automated deploy
- [ ] Simulate rollback: re-run deploy job from a previous pipeline in GitLab UI

---

## 4. Structured logging with Pino

> **Decision**: Pino via `nestjs-pino`. Structured JSON output, Loki-ready, minimal configuration overhead. Replaces all `console.log` / `console.error` / `console.warn` calls.

### Why Pino over the NestJS built-in logger

The NestJS built-in logger outputs formatted strings — readable in development, useless for machine processing. Pino outputs structured JSON on every log line, which means:
- Grafana Loki can index and filter by any field (`module`, `level`, `userId`, `route`)
- The agent's `get_error_context` tool can query real error data
- You can search logs for `level:error module:bank` instead of grepping raw strings
- Performance: Pino is the fastest Node.js logger — negligible overhead per request

### Installation

- [x] Install dependencies:

```bash
pnpm --filter api add nestjs-pino pino-http pino
pnpm --filter api add -D pino-pretty
```

### Configuration

- [x] Replace default NestJS logger in `main.ts`:

```typescript
// apps/api/src/main.ts
import { Logger } from 'nestjs-pino'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.useLogger(app.get(Logger))
  await app.listen(3000)
}
bootstrap()
```

- [x] Register `LoggerModule` in `AppModule` — configured in `apps/api/src/api/_utils/logger/logger.module.ts`, already imported in AppModule:

```typescript
import { LoggerModule } from 'nestjs-pino'

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        // Pretty output in development, JSON in production
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true, singleLine: false } }
          : undefined,
        // Structured fields on every log line
        customProps: () => ({
          service: 'boffmedia-api',
          environment: process.env.NODE_ENV
        }),
        // Redact sensitive data — never log tokens or passwords
        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.token'
        ],
        // Suppress noisy health/metrics endpoints
        autoLogging: {
          ignore: (req) => ['/health', '/metrics'].includes(req.url ?? '')
        }
      }
    })
  ]
})
export class AppModule implements NestModule { ... }
```

### Replace console calls

- [x] Audit all existing `console` calls:

```bash
grep -rn "console\." apps/api/src --include="*.ts" | grep -v ".spec.ts" | tee /tmp/console-calls.txt
wc -l /tmp/console-calls.txt
```

- [x] Inject `Logger` from `nestjs-pino` into each class that uses console logging:

```typescript
import { Logger } from 'nestjs-pino'

@Injectable()
export class BankService {
  constructor(private readonly logger: Logger) {}

  async transfer(fromId: string, toId: string, amount: number): Promise<void> {
    this.logger.log({
      msg: 'Transfer initiated',
      fromId,
      toId,
      amount,
      module: 'BankService'
    })
    // ...
  }
}
```

> **Agent task**: create a BookStack spec page per module: "Replace all console.log calls in [module] with nestjs-pino Logger injection". The agent handles the mechanical replacement. Run one module at a time and review the diff.

- [x] Replace all `console.log` → `this.logger.log()` — done via `scripts/replace-console-logs.py` (92 files modified 2026-05-17)
- [x] Replace all `console.error` → `this.logger.error()`
- [x] Replace all `console.warn` → `this.logger.warn()`
- [ ] Add structured context fields to critical log lines: `userId`, `module`, `requestId` where available
- [x] Confirm zero console calls remain:

```bash
grep -rn "console\." apps/api/src --include="*.ts" | grep -v ".spec.ts"
# Returns nothing (main.ts bootstrap logs intentionally kept)
```

> **Note**: `main.ts` retains `console.*` calls intentionally — bootstrap logging runs before the Pino logger is initialised. Non-injectable singleton classes (`LoggingUtils`, `BaseDataService`, pokemon module) use module-level `pino()` instances instead of constructor injection. `notification.service.ts` was left with NestJS built-in Logger (had existing class field — no regression). Script-introduced import placement bugs fixed manually 2026-05-17. `pnpm --filter api exec tsc --noEmit` → zero errors confirmed.

### Loki integration (future — when ready)

- [ ] Add Loki container to production Docker Compose
- [ ] Add Promtail to scrape Docker container stdout and forward to Loki
- [ ] Add Loki as a data source in Grafana
- [ ] Create Grafana log panel: recent API errors
- [ ] Update `get_error_context` agent tool to query Loki for `recentErrors`

### Verification

- [ ] Start API locally — confirm logs output as pretty-printed text in dev mode
- [ ] Build and run Docker image — confirm logs output as JSON
- [ ] Trigger a deliberate 500 error — confirm structured error log with stack trace
- [ ] Confirm `req.headers.authorization` is `[Redacted]` in HTTP access logs
- [ ] Confirm `/health` and `/metrics` requests do not appear in logs

---

## 5. Global ValidationPipe + missing DTOs

> **Decision**: global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`. Applied once in `main.ts`, covers all current and future endpoints including all agent-generated code.

### Global pipe

- [x] Install if not already present:

```bash
pnpm --filter api add class-validator class-transformer
```

- [x] Enable `ValidationPipe` globally in `main.ts`:

```typescript
import { ValidationPipe } from '@nestjs/common'

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // strips properties not in the DTO silently
    forbidNonWhitelisted: true,   // throws 400 on unknown properties
    transform: true,              // auto-transforms payload types
    transformOptions: {
      enableImplicitConversion: true  // string "42" → number 42
    }
  })
)
```

### Shared pagination DTO

- [ ] Create `apps/api/src/common/dto/pagination.dto.ts` — used by every list endpoint:

```typescript
import { IsOptional, IsInt, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20
}
```

### DTO audit

- [x] Find all POST/PUT/PATCH endpoints missing a DTO body parameter — audited manually across all main controllers.

- [ ] Find all list endpoints missing pagination DTO on `@Query()`:

```bash
grep -rn "@Get\b" apps/api/src --include="*.controller.ts" -A 5 \
  | grep "@Query()" \
  | grep -v "PaginationDto\|Dto"
```

**Controllers wired with DTOs (inline body types replaced):**
- [x] `auth.controller.ts` — `LoginMcDto`, `RegisterMinecraftDto`, `RefreshTokenDto`, `GoogleCallbackDto`
- [x] `wingull.controller.ts` — `WingullBalanceDto`, `GetBalanceDto`, `MessageRequestDto`, `PokemonGiveRequestDto`
- [x] `smartrotom.controller.ts` — `ArceusspeakDto`
- [x] `starbank.controller.ts` — `CreateMainAccountDto`
- [x] `invites.controller.ts` (wingull/invites) — `CreateInviteBodyDto`
- [x] `app.controller.ts` — `UrlBodyDto`
- [x] `scrape.controller.ts` — `DownloadGameDto`, `SetBrowserTunnelDto`, `ConvertChapterDto`, `PatchEpubMetadataDto`, `UpdateMangaConfigDto`, `UpdateSeriesStatusDto`

**Additional controllers audited (all inline body types replaced):**
- [x] `liga.controller.ts` — `CreateTournamentDto`, `TournamentRegistrationDto` (replaced plain interfaces)
- [x] `sharex.controller.ts` — `SharexUploadDto` (was untyped `@Body() body`)
- [x] `pokemon.controller.ts` — `UuidDto` for `syncDex` (was inline `{ uuid: string }`)
- [x] `twitch.controller.ts` — `NotificationTargetDto` (replaced plain interface)

**Controllers verified clean (already had proper DTOs):**
- [x] Events, MH Wilds, TCG Pocket, VGC Meta, VGC Tracker, Manga, YouTube
- [x] Users (boffmedia), Upload, Achievement, Apps, Arcade, Chatapp, FicusAI
- [x] Mine, Misiones, Player, Documents, Smartrotom Users, Battle Simulator

### Standard DTO pattern

```typescript
import { IsString, IsNumber, IsOptional, Min, MaxLength, IsUUID } from 'class-validator'

export class CreateTransferDto {
  @IsUUID()
  toUserId: string

  @IsNumber()
  @Min(1)
  amount: number

  @IsString()
  @IsOptional()
  @MaxLength(200)
  note?: string
}
```

> **Agent task**: "Add missing request DTOs to the [module] controller. Use class-validator decorators. Apply PaginationDto to all list endpoints." Run per module.

### Verification

- [x] Send request with unknown field → confirm 400 `{"message": "property unknown should not exist"}` *(ValidationPipe active with forbidNonWhitelisted)*
- [x] Send request with missing required field → confirm 400 with clear field name *(GlobalExceptionFilter formats ValidationPipe arrays)*
- [x] Send `"42"` as a number field → confirm it arrives as `42` in the handler *(transform: true + enableImplicitConversion)*
- [ ] Send valid request → confirm it passes through correctly *(manual smoke test pending)*
- [x] Confirm `ValidationPipe` is active — check `main.ts` bootstrap output in logs

---

## 6. GitLab CI validate stage

> **Decision**: add `validate` as the first stage. Build and deploy only run if lint, typecheck, and tests all pass. Coverage warnings appear in CI but do not block the pipeline.

### Updated pipeline structure

- [x] Update `.gitlab-ci.yml` — add validate stage at the top:

```yaml
stages:
  - validate
  - build
  - deploy

variables:
  PNPM_VERSION: "9"

# ── Cache ─────────────────────────────────────────────────────────
.pnpm-cache: &pnpm-cache
  cache:
    key:
      files:
        - pnpm-lock.yaml
    paths:
      - .pnpm-store/

# ── Validate ──────────────────────────────────────────────────────
.validate-base:
  image: node:20-alpine
  <<: *pnpm-cache
  before_script:
    - npm install -g pnpm@$PNPM_VERSION
    - pnpm config set store-dir .pnpm-store
    - pnpm install --frozen-lockfile
  only:
    - main
    - merge_requests

lint:
  extends: .validate-base
  stage: validate
  script:
    - pnpm --filter api lint
    - pnpm --filter web lint

typecheck:
  extends: .validate-base
  stage: validate
  script:
    - pnpm --filter api exec tsc --noEmit
    - pnpm --filter web exec tsc --noEmit

test:
  extends: .validate-base
  stage: validate
  script:
    - pnpm --filter api test --coverage --coverageReporters=text-summary --coverageReporters=cobertura
  coverage: '/Lines\s*:\s*(\d+\.?\d*)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: apps/api/coverage/cobertura-coverage.xml
    expire_in: 7 days
  # Coverage is reported but does NOT fail the pipeline
  # Remove --passWithNoTests once baseline coverage is established
  allow_failure: false

# ── Build ─────────────────────────────────────────────────────────
build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_HUB_USER" --password-stdin
  script:
    - docker build
        -t $DOCKER_HUB_USER/boffmedia-api:$CI_COMMIT_SHORT_SHA
        -t $DOCKER_HUB_USER/boffmedia-api:latest
        -f apps/api/Dockerfile .
    - docker push $DOCKER_HUB_USER/boffmedia-api:$CI_COMMIT_SHORT_SHA
    - docker push $DOCKER_HUB_USER/boffmedia-api:latest
  needs:
    - lint
    - typecheck
    - test
  only:
    - main
    - tags
```

- [x] Add `merge_requests` to validate jobs so they run on every MR — not just merges to `main`
- [ ] Verify pnpm cache restores correctly between pipeline runs (check CI logs for cache hit)

### Coverage configuration in Jest

- [x] Add to `apps/api/jest.config.ts`:

```typescript
export default {
  // ... existing config
  collectCoverage: false, // only collect when --coverage flag passed
  coverageDirectory: '../coverage',
  coverageReporters: ['text-summary', 'cobertura', 'lcov'],
  // Warn in CI but do not fail — thresholds are informational
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
}
```

### Verification

- [ ] Introduce a deliberate lint error — confirm pipeline fails at `validate`, build does not run
- [ ] Fix the error — confirm pipeline resumes and completes
- [ ] Open an MR — confirm validate stage runs on the MR pipeline
- [ ] Confirm coverage percentage appears on MR page in GitLab
- [ ] Confirm full pipeline duration: validate stage under 4 minutes

---

## 7. Strict TypeScript enforcement

> **Decision**: enable `strict: true` in both `tsconfig.json` files. Add ESLint rules to error on `any`. Fix all resulting errors — use the agent for bulk mechanical fixes.

### Enable strict mode

- [ ] Update `apps/api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

- [ ] Apply the same changes to `apps/web/tsconfig.json`

### Measure the damage first

- [ ] Capture all TypeScript errors before fixing anything:

```bash
pnpm --filter api exec tsc --noEmit 2>&1 | tee /tmp/api-ts-errors.txt
pnpm --filter web exec tsc --noEmit 2>&1 | tee /tmp/web-ts-errors.txt
echo "API errors: $(grep 'error TS' /tmp/api-ts-errors.txt | wc -l)"
echo "Web errors: $(grep 'error TS' /tmp/web-ts-errors.txt | wc -l)"
```

- [ ] Review the error list — categorise by type (implicit any, null checks, missing returns, etc.)
- [ ] If total errors > 100: use the agent module by module
- [ ] If total errors < 100: fix manually in one session

### ESLint TypeScript rules

- [ ] Add to `.eslintrc.js` for both `apps/api` and `apps/web`:

```javascript
rules: {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unsafe-assignment': 'error',
  '@typescript-eslint/no-unsafe-member-access': 'error',
  '@typescript-eslint/no-unsafe-call': 'error',
  '@typescript-eslint/no-unsafe-return': 'error',
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/explicit-function-return-type': 'warn',
  '@typescript-eslint/no-unnecessary-type-assertion': 'error',
  '@typescript-eslint/prefer-nullish-coalescing': 'warn',
  '@typescript-eslint/prefer-optional-chain': 'warn',
}
```

### Fix errors — module by module

> **Agent task pattern**: "Fix all TypeScript strict mode errors in apps/api/src/[module]. Do not change business logic — only add types, null checks, and return type annotations." Run per module, review each diff before committing.

**API — fix order (highest risk first)**
- [ ] Bank module — strict errors fixed
- [ ] Auth module — strict errors fixed
- [ ] Pokémon PC Box module — strict errors fixed
- [ ] SmartRotom modules (remaining) — strict errors fixed
- [ ] Boffmedia modules — strict errors fixed
- [ ] Common utilities and shared code — strict errors fixed

**Web — fix order**
- [ ] SmartRotom pages and components — strict errors fixed
- [ ] Boffmedia pages and components — strict errors fixed
- [ ] Shared components — strict errors fixed

### DrizzleORM type safety

- [ ] Confirm all DrizzleORM results use inferred types — no casts to `any`:

```typescript
// Correct — fully typed via inference
type User = typeof users.$inferSelect
type NewUser = typeof users.$inferInsert

// Find violations
grep -rn "as any" apps/api/src --include="*.ts" | grep -v ".spec.ts"
```

- [ ] Fix all `as any` casts in DrizzleORM query results

### Verification

- [ ] `pnpm --filter api exec tsc --noEmit` — zero errors
- [ ] `pnpm --filter web exec tsc --noEmit` — zero errors
- [ ] `pnpm --filter api lint` — zero `@typescript-eslint/no-explicit-any` errors
- [ ] `pnpm --filter web lint` — zero errors
- [ ] GitLab CI typecheck stage passes on a clean push

---

## 8. Global exception filter + typed errors

> **Decision**: one global exception filter, typed exception classes per domain, consistent error response shape across the entire API. Never expose stack traces in production responses.

### Standard error response shape

Every API error returns exactly this shape — no exceptions:

```typescript
{
  statusCode: number       // HTTP status code e.g. 404
  error: string            // machine-readable code e.g. "NOT_FOUND"
  message: string          // human-readable description
  timestamp: string        // ISO 8601 e.g. "2026-05-15T10:00:00.000Z"
  path: string             // request path e.g. "/api/bank/transfer"
}
```

### Custom exception classes

- [x] Create `apps/api/src/common/exceptions/` directory
- [x] Create `apps/api/src/common/exceptions/app.exception.ts`:

```typescript
import { HttpException, HttpStatus } from '@nestjs/common'

export class AppException extends HttpException {
  constructor(
    public readonly errorCode: string,
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
  ) {
    super({ errorCode, message }, statusCode)
  }
}

export class NotFoundException extends AppException {
  constructor(resource: string, id?: string | number) {
    super(
      'NOT_FOUND',
      id !== undefined ? `${resource} with id ${String(id)} not found` : `${resource} not found`,
      HttpStatus.NOT_FOUND
    )
  }
}

export class ConflictException extends AppException {
  constructor(message: string) {
    super('CONFLICT', message, HttpStatus.CONFLICT)
  }
}

export class ForbiddenException extends AppException {
  constructor(message = 'Access denied') {
    super('FORBIDDEN', message, HttpStatus.FORBIDDEN)
  }
}

export class UnauthorizedException extends AppException {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message, HttpStatus.UNAUTHORIZED)
  }
}

export class ValidationException extends AppException {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, HttpStatus.BAD_REQUEST)
  }
}

export class InsufficientFundsException extends AppException {
  constructor(requested: number, available: number) {
    super(
      'INSUFFICIENT_FUNDS',
      `Cannot transfer ${requested} — balance is ${available}`,
      HttpStatus.UNPROCESSABLE_ENTITY
    )
  }
}

export class CapacityExceededException extends AppException {
  constructor(resource: string) {
    super('CAPACITY_EXCEEDED', `${resource} is at maximum capacity`, HttpStatus.UNPROCESSABLE_ENTITY)
  }
}
```

- [x] Create `apps/api/src/common/exceptions/index.ts` — re-export all exceptions for clean imports

### Global exception filter

- [x] Create `apps/api/src/common/filters/global-exception.filter.ts`:

```typescript
import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus
} from '@nestjs/common'
import { Request, Response } from 'express'
import { Logger } from 'nestjs-pino'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR
    let errorCode = 'INTERNAL_SERVER_ERROR'
    let message = 'An unexpected error occurred'

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus()
      const body = exception.getResponse()
      if (typeof body === 'object' && body !== null) {
        errorCode = (body as Record<string, unknown>)['errorCode'] as string ?? 'HTTP_EXCEPTION'
        message = (body as Record<string, unknown>)['message'] as string ?? exception.message
      } else {
        message = String(body)
        errorCode = 'HTTP_EXCEPTION'
      }
    } else {
      // Unknown error — log full details server-side, return generic message to client
      this.logger.error({
        msg: 'Unhandled exception',
        error: exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
        path: request.url,
        method: request.method
      })
    }

    response.status(statusCode).json({
      statusCode,
      error: errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url
    })
  }
}
```

- [x] Register filter globally in `main.ts`:

```typescript
import { GlobalExceptionFilter } from './common/filters/global-exception.filter'

// After app creation, inject Logger manually for the filter
const logger = app.get(Logger)
app.useGlobalFilters(new GlobalExceptionFilter(logger))
```

### Replace raw throws

- [ ] Audit all `throw new Error()` calls in services:

```bash
grep -rn "throw new Error" apps/api/src --include="*.ts" | grep -v ".spec.ts"
```

- [ ] Replace each with the appropriate typed exception:

```typescript
// Before
throw new Error('User not found')
throw new Error('Insufficient balance')
throw new Error('Box is full')

// After
throw new NotFoundException('User', userId)
throw new InsufficientFundsException(amount, balance)
throw new CapacityExceededException('PC Box')
```

> **Agent task**: "Replace all raw `throw new Error()` calls in apps/api/src/[module] with the appropriate AppException subclass from common/exceptions." Run per module.

**Replace throws — module by module** *(deferred — do after test baseline is in place so regressions are caught)*
- [ ] Bank module — all throws replaced with typed exceptions
- [ ] Auth module — all throws replaced
- [ ] Pokémon PC Box module — all throws replaced
- [ ] Shop module — all throws replaced
- [ ] SmartRotom remaining modules — all throws replaced
- [ ] Boffmedia modules — all throws replaced

### Verification

- [ ] Request non-existent resource → confirm `{"statusCode":404,"error":"NOT_FOUND",...}`
- [ ] Send invalid input → confirm `{"statusCode":400,"error":"VALIDATION_ERROR",...}`
- [ ] Trigger an unhandled exception → confirm `{"statusCode":500,"error":"INTERNAL_SERVER_ERROR","message":"An unexpected error occurred"}`
- [ ] Confirm no stack traces appear in any API response
- [ ] Confirm unhandled exceptions are logged with full stack trace by Pino (server-side only)
- [ ] Confirm response shape is identical across all modules

---

## 9. Core test coverage baseline

> **Decision**: full scope — unit tests (Jest), integration tests (Supertest), and e2e tests (Playwright). Coverage warns in CI but does not block pipeline. Start with highest-risk modules first.

### Test infrastructure setup

- [x] Confirm Jest config is complete in `apps/api/jest.config.ts` — coverage thresholds added, `collectCoverageFrom` configured
- [x] Install test utilities — `@nestjs/testing`, `supertest`, `@types/supertest`, `@types/jest` already present
- [ ] Create test database (integration tests, not yet needed for unit tests):

```sql
CREATE DATABASE boffmedia_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE smartrotom_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

- [ ] Add `TEST_DATABASE_URL` variables to `.env.test` (gitignored) — deferred until integration tests

> **Note**: run tests with `--runInBand` to avoid OOM (`node_modules/.bin/jest --runInBand --forceExit`). Each NestJS testing module allocates significant heap; parallel workers exhaust memory in this monorepo.

### Unit tests — service layer

**2161 tests, 132 suites (1 skipped) — all passing 2026-05-18.**
**104 service unit specs complete. 32 controller integration specs complete.**

**SmartRotom Bank (highest risk — virtual currency)**
- [x] `transfer()` — happy path, zero/negative amount rejected, same account rejected, insufficient balance, source/dest not found, DB failure
- [x] `processShopTransaction()` — purchase happy path, insufficient balance, sale happy path, main account not found
- [x] `getAccountTransactions()` — delegates to repo, uses default limit
- [x] `createAccount()` — happy path, missing uuid/name, duplicate main account, allows main when none exists
- [x] `createMainAccount()` — happy path, duplicate rejected
- [x] `getUserBalance()` — returns balance, returns 0 on repo error

**Auth service**
- [x] `login()` — returns tokens + user, unwraps sessionUser
- [x] `loginMC()` — valid world, invalid world throws, user not found returns error
- [x] `refreshToken()` — valid JWT string, valid token object, null throws, user not found throws, expired JWT throws
- [x] `validateUser()` — valid credentials return user, invalid return null

**Boffmedia Events service**
- [x] `getAllEvents()` — returns all, returns empty array
- [x] `getEventById()` — with children, with empty children, null for unknown
- [x] `createEvent()` — creates and returns, converts startDate string to Date
- [x] `updateEvent()` — updates and returns
- [x] `deleteEvent()` — soft-deletes children before parent
- [x] `validateEventExists()` — true when found, false when not

**Boffmedia Leaderboard service**
- [x] `getGlobalLeaderboard()` — adds 1-based rank to results
- [x] `getEventLeaderboard()` — returns ranked results for specific event
- [x] `getParticipantRanking()` — known participant rank, unknown participant returns 0
- [x] `getTopAchievers()` — returns limited results with rank

**SmartRotom Pokémon PC Box service**
- [ ] Not yet written — PC Box service methods not matching plan spec (service uses Wingull game bridge, not local box storage)

**Auth service**
- [ ] `login()` — valid credentials return JWT, invalid password throws `UnauthorizedException`
- [ ] `validateToken()` — valid token returns user, expired token throws
- [ ] `register()` — new user created, duplicate email throws `ConflictException`
- [ ] `refreshToken()` — valid refresh token issues new access token

**Boffmedia Leaderboard service**
- [ ] `updateScore()` — score updated correctly
- [ ] `getTopN()` — correct ordering, correct limit applied
- [ ] `getUserRank()` — correct rank for a user, unknown user throws `NotFoundException`

**Boffmedia Events service**
- [ ] `createEvent()` — event created with correct fields
- [ ] `getUpcoming()` — returns only future events, ordered by date
- [ ] `registerPlayer()` — player registered, duplicate registration throws `ConflictException`

### Integration tests — API layer (Supertest)

Test the full HTTP stack including middleware, pipes, guards, and the exception filter.

- [x] `POST /auth/login` — 400 missing fields, 400 unknown field (forbidNonWhitelisted), calls service on valid body
- [ ] `POST /auth/register` — 201 created, 409 duplicate email, 400 invalid body
- [ ] `GET /api/smartrotom/bank/balance` — 200 authenticated, 401 unauthenticated
- [x] `POST /api/smartrotom/bank/transfer` — calls facade on valid body, 400 on missing fields / amount=0 / negative / unknown field
- [x] `GET /api/smartrotom/bank/balance/:uuid` — returns facade result
- [ ] `GET /api/smartrotom/pokemon/box/:id` — 200 own box, 403 other user's box, 404 unknown box
- [ ] `GET /api/boffmedia/leaderboards/:id` — 200 with ordered data, 404 unknown leaderboard
- [ ] `POST /api/boffmedia/events` — 201 valid, 400 missing required fields
- [x] Confirm ValidationPipe active: unknown field in body → 400 (`auth.controller.integration.spec.ts`, `starbank.controller.integration.spec.ts`)
- [x] Confirm GlobalExceptionFilter active: all error responses match standard shape `{ statusCode, error, message, timestamp, path }`

> **165 tests, 12 suites, all passing — 2026-05-18**

### E2e tests — Playwright

> **20 Playwright tests passing — 2026-05-17** (3 files: `boffmedia-events.spec.ts`, `smartrotom-bank.spec.ts`, `smartrotom-pc.spec.ts`)

- [x] SmartRotom login flow — form renders, client-side validation works, signIn() is invoked on submit (button shows "Processing...")
- [x] SmartRotom bank — balance section, account name, "Cambiar de Cuenta" selector all visible with mocked data
- [ ] SmartRotom bank transfer — user sends funds, balance updates for both users (requires real DB or full mock setup)
- [x] SmartRotom Pokémon PC Box — page loads in standard browser (no MCEF required), body is non-empty after networkidle
- [x] SmartRotom external browser — same as above: PC box page loads without game client
- [x] Boffmedia leaderboard — page loads, all player nicknames visible, top-ranked player appears first, search filters correctly
- [x] Boffmedia events — event list loads, event titles visible, search filter works, loading state shown before content

### Test coverage targets (warning only — not a CI gate)

```typescript
// apps/api/jest.config.ts
coverageThreshold: {
  global: {
    branches: 40,   // warn below this
    functions: 50,
    lines: 50,
    statements: 50
  }
}
```

- [ ] Run coverage report: `node_modules/.bin/jest --runInBand --forceExit --coverage` (use --runInBand to avoid OOM)
- [ ] Note current coverage percentages as baseline
- [ ] Document coverage baseline in BookStack: Infrastructure → Harness Agent → Run history

### Verification

- [x] All tests pass — 2161 tests, 132 suites (1 skipped), zero failures (`jest --runInBand --forceExit`) — updated 2026-05-18
- [ ] Coverage report generated — deferred (full coverage run risks OOM; run in CI with resource limits)
- [ ] Coverage warnings appear in CI output (not failures)
- [ ] Deliberately break `StarbankTransactionService.transfer()` — confirm Jest catches it
- [ ] GitLab CI test stage passes with coverage percentage visible in pipeline UI

---

## 10. End-to-end validation

> Run through this after all 9 sections are complete. This is the proof that the full stack works together correctly.

### Infrastructure

- [ ] Backup script runs manually without errors
- [ ] Encrypted backup files present in `/opt/backups/db/`
- [ ] Test restore confirmed — row counts match source
- [ ] Cron job registered — `sudo crontab -l` shows backup at 02:00
- [ ] Prometheus targets both `UP`: `boffmedia-api` and `mariadb`
- [ ] Grafana dashboard shows real metric data (not empty/no data)
- [ ] All three Grafana alerts configured and tested
- [ ] Backup missed alert configured
- [ ] Stop API container → confirm "container down" alert fires within 2 minutes → restart container
- [ ] Full GitLab pipeline runs: validate → build → deploy
- [ ] Portainer shows updated container with latest commit SHA image
- [ ] Application responds correctly after automated deploy
- [ ] Rollback tested — previous image tag deployed successfully via GitLab re-run

### Code quality

- [ ] `pnpm --filter api lint` → zero errors
- [ ] `pnpm --filter web lint` → zero errors
- [ ] `pnpm --filter api exec tsc --noEmit` → zero errors
- [ ] `pnpm --filter web exec tsc --noEmit` → zero errors
- [ ] Zero `console.` calls: `grep -rn "console\." apps/api/src --include="*.ts" | grep -v spec`
- [ ] Zero `any` types: `grep -rn ": any\b\|as any\b" apps/api/src --include="*.ts" | grep -v spec`
- [ ] Zero raw `throw new Error`: `grep -rn "throw new Error" apps/api/src --include="*.ts" | grep -v spec`
- [ ] Send unknown field to any endpoint → 400 with standard shape
- [ ] Send missing required field → 400 with standard shape
- [ ] Request non-existent resource → 404 with standard shape
- [ ] Trigger unhandled error → 500 with `"message":"An unexpected error occurred"` (no stack trace)

### Testing

- [ ] `pnpm --filter api test` → all tests pass
- [ ] Coverage report generated with baseline percentages noted
- [ ] Coverage warnings appear in CI — pipeline does not fail on coverage
- [ ] Deliberately break `BankService.transfer()` → Jest stage fails → fix → passes

### Agent integration

- [ ] `agent:check_system_health` returns real metric values (not null)
- [ ] `agent:capture_metrics_baseline` writes snapshot to `metrics_snapshots` table
- [ ] `agent:check_performance_regression` returns valid result after a run
- [ ] Agent-generated endpoint passes lint and typecheck without modification
- [ ] Agent-generated endpoint is automatically validated by global `ValidationPipe`
- [ ] Agent-generated exception uses typed `AppException` subclass

### Documentation

- [ ] Backup restore procedure documented and tested — BookStack: Infrastructure → DevOps → Runbooks
- [ ] Deploy and rollback procedure documented — BookStack: Infrastructure → DevOps → Runbooks
- [ ] Grafana dashboard URL documented — BookStack: Infrastructure → DevOps → Grafana
- [ ] All runbook pages tagged `agent:readonly` in BookStack

---

## 11. Appendix — useful commands

```bash
# ── Local validation (mirrors CI validate stage) ──────────────────
pnpm --filter api lint
pnpm --filter web lint
pnpm --filter api exec tsc --noEmit
pnpm --filter web exec tsc --noEmit
pnpm --filter api test
pnpm --filter api test --coverage

# ── Find remaining violations ─────────────────────────────────────
# console.log calls
grep -rn "console\." apps/api/src --include="*.ts" | grep -v ".spec.ts"

# any types
grep -rn ": any\b\|as any\b" apps/api/src --include="*.ts" | grep -v ".spec.ts"

# raw throws
grep -rn "throw new Error" apps/api/src --include="*.ts" | grep -v ".spec.ts"

# endpoints missing DTOs
grep -rn "@Post\|@Put\|@Patch" apps/api/src --include="*.controller.ts" -A 10 | grep -B 5 "@Body()"

# ── Backups ───────────────────────────────────────────────────────
# Run backup manually
/opt/scripts/backup-db.sh

# Check backup log
tail -50 /var/log/db-backup.log

# List backups with sizes
ls -lh /opt/backups/db/

# Decrypt a backup for inspection (does not restore)
openssl enc -d -aes-256-cbc -pbkdf2 \
  -pass file:/opt/backups/.backup-key \
  -in /opt/backups/db/boffmedia_2026-05-15_02-00.sql.gz.enc \
  | gunzip | head -50

# ── Prometheus ────────────────────────────────────────────────────
# Check all targets
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# Query error rate
curl -s "http://localhost:9090/api/v1/query?query=rate(http_requests_total{status_code=~'5..'}[5m])" | jq

# ── Docker ────────────────────────────────────────────────────────
# Check running containers
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

# View API logs
docker logs boffmedia-api --tail 100 -f

# Pull and test latest image locally
docker pull yourdockerhubuser/boffmedia-api:latest
docker run --rm -p 3000:3000 --env-file .env.local yourdockerhubuser/boffmedia-api:latest
```
