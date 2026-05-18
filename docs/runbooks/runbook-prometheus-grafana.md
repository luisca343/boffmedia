# Runbook: Prometheus + Grafana — Application Monitoring

> **Status**: Partially active — MariaDB metrics live, API metrics pending deploy  
> **Last updated**: 2026-05-17  
> **BookStack target**: Infrastructure → DevOps → Runbooks → Prometheus & Grafana

---

## Overview

Prometheus scrapes metrics from the application and MariaDB. Grafana visualises them. All containers are on the default Docker `bridge` network and communicate via the host bridge IP `172.17.0.1`.

| Component | Container | Port | Status |
|---|---|---|---|
| Prometheus | `prometheus` | 9090 | Running |
| Grafana | `grafana` | 3000 | Running |
| Node Exporter | `node_exporter` | 9100 | Running |
| cAdvisor | `cadvisor` | 8082 | Running |
| MySQL Exporter | `mysqld-exporter` | 9104 | Running |
| API metrics endpoint | `boffmedia-server` | 34301/metrics | Active after deploy |

---

## Prometheus scrape config

Location inside container: `/etc/prometheus/prometheus.yml`

Full working config as of 2026-05-17:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    scrape_interval: 5s
    static_configs:
      - targets: ['172.17.0.1:9090']

  - job_name: 'node_exporter'
    static_configs:
      - targets: ['172.17.0.1:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['172.17.0.1:8082']

  - job_name: 'boffmedia-api'
    scrape_interval: 15s
    metrics_path: /metrics
    static_configs:
      - targets: ['172.17.0.1:34301']

  - job_name: 'mariadb'
    scrape_interval: 15s
    static_configs:
      - targets: ['172.17.0.1:9104']
```

**To reload config without restarting Prometheus:**
```bash
docker exec prometheus kill -HUP 1
```

**To verify all targets:**
```bash
curl -s 'http://localhost:9090/api/v1/targets' | python3 -c "
import json,sys
targets = json.load(sys.stdin)['data']['activeTargets']
for t in targets:
    print(t['labels']['job'], '->', t['health'])
"
```

---

## mysqld_exporter setup

> **Important gotcha**: mysqld_exporter v0.15+ dropped `DATA_SOURCE_NAME` env var. Use a `.my.cnf` config file instead. The file must be `chmod 644` — the container runs as non-root and cannot read a `600` file.

**Credentials file:** `/opt/mysqld_exporter.cnf`

```ini
[client]
user=backup_user
password=YOUR_BACKUP_PASSWORD
host=172.17.0.1
port=3306
```

```bash
chmod 644 /opt/mysqld_exporter.cnf
```

**Run the container:**

```bash
docker run -d \
  --name mysqld-exporter \
  --restart unless-stopped \
  -p 9104:9104 \
  -v /opt/mysqld_exporter.cnf:/.my.cnf:ro \
  prom/mysqld-exporter:latest
```

**Expected log errors (harmless):**
- `slave_status: Access denied; you need SUPER, SLAVE MONITOR` — not a replica server, ignore
- `innodb_cmp: Access denied; you need PROCESS` — fix with the grant below

**Fix the PROCESS grant:**
```bash
docker exec pterodactyl-database-1 mysql -u root -p -e "GRANT PROCESS ON *.* TO 'backup_user'@'%';"
docker exec pterodactyl-database-1 mysql -u root -p -e "FLUSH PRIVILEGES;"
```

---

## API metrics endpoint (NestJS)

Added to `boffmedia-server` codebase. Requires deploy to take effect.

**Packages installed:**
```bash
pnpm --filter api add @willsoto/nestjs-prometheus prom-client
```

**Files changed:**
- `apps/api/src/app.module.ts` — `PrometheusModule.register()` added to imports, `MetricsMiddleware` registered for all routes
- `apps/api/src/_utils/metrics/metrics.middleware.ts` — new file, tracks `http_request_duration_ms` (Histogram) and `http_requests_total` (Counter) per method/route/status_code

**Endpoint:** `GET /metrics` on port 34301  
**After deploy, verify:** `curl http://localhost:34301/metrics | head -20`

---

## Grafana dashboard

**Dashboard:** Boffmedia — Application Overview  
**UID:** `boffmedia-overview`  
**URL:** `http://your-server:3000/d/boffmedia-overview`  
**Source JSON:** `docs/grafana-dashboard-boffmedia.json`

**Panels:**

| Panel | Data source | Notes |
|---|---|---|
| Request Rate | `http_requests_total` | Live after API deploy |
| Error Rate % | `http_requests_total{status_code=~"5.."}` | Live after API deploy |
| p95 Latency | `http_request_duration_ms_bucket` | Live after API deploy |
| p50 Latency | `http_request_duration_ms_bucket` | Live after API deploy |
| Active DB Connections | `mysql_global_status_threads_connected` | Live now |
| API Memory (MB) | `process_resident_memory_bytes` | Live after API deploy |
| DB Connections vs Max | gauge, % of max_connections | Live now |
| Last Backup Age | `node_filestat_modification_time` | Live after node_exporter configured |
| Top 5 Slowest Routes | table, p95 per route | Live after API deploy |
| Top 5 Erroring Routes | table, error rate per route | Live after API deploy |
| MySQL Queries/s | `mysql_global_status_queries` | Live now |
| InnoDB Buffer Pool Hit % | innodb read ratio | Live now |

**To re-import the dashboard on a new server:**
```bash
scp docs/grafana-dashboard-boffmedia.json root@server:/tmp/grafana-dashboard.json

curl -s -X POST \
  -H "Content-Type: application/json" \
  -u admin:PASSWORD \
  http://localhost:3000/api/dashboards/import \
  -d "{\"dashboard\": $(cat /tmp/grafana-dashboard.json), \"overwrite\": true, \"folderId\": 0}"
```

---

## Grafana alerts (TODO)

> **SMTP working as of 2026-05-18.** Contact point (luisca343@gmail.com) tested and delivering.  
> Fix applied: all `[smtp]` lines in `/docker/config/grafana/grafana.ini` were commented out with `;` — uncommented the required fields and restarted Grafana.  
> **Next: create the 4 alert rules below.**

| Alert | Condition | Threshold |
|---|---|---|
| API error rate high | 5xx rate > 1% for 5m | `rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01` |
| API container down | Prometheus scrape failing | `up{job="boffmedia-api"} == 0` for 2m |
| DB connections high | > 80% of max | `mysql_global_status_threads_connected / mysql_global_variables_max_connections > 0.8` for 5m |
| Backup missed | Last backup > 25h ago | `(time() - node_filestat_modification_time{...}) > 90000` |

Configure in Grafana → Alerting → Alert rules. Requires a contact point (email) set up first under Alerting → Contact points.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `mysqld-exporter` crash-looping, `no user specified` | v0.19+ dropped DATA_SOURCE_NAME | Use `.my.cnf` config file (see above) |
| `permission denied` reading `.my.cnf` | File is `chmod 600`, container is non-root | `chmod 644 /opt/mysqld_exporter.cnf` |
| `Access denied for backup_user@'172.x.x.x'` | Wrong password in config file | Update `/opt/mysqld_exporter.cnf`, recreate container |
| Prometheus config change not picked up | Needs reload | `docker exec prometheus kill -HUP 1` |
| Duplicate scrape jobs in prometheus.yml | Appended twice | Rewrite the whole file cleanly (do not append) |
| `boffmedia-api` target down | Code not deployed yet | Deploy the branch with metrics changes |
