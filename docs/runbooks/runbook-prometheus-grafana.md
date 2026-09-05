# Runbook: Prometheus + Grafana — Application Monitoring

> **Status**: Active. MariaDB and API metrics live; six alert rules provisionable from
> `docs/grafana/alerts-boffmedia.yaml`; dashboard and rules kept honest by
> `scripts/check-metrics-parity.mjs` in the lint chain.  
> **Last updated**: 2026-09-05 (was 2026-05-17)  
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

### Restricting `/metrics`

No Nest guard can protect this route — the Prometheus module owns it, and
`JwtAuthGuard` waves it through explicitly. It is unauthenticated wherever the
port is reachable, so it has to be closed at the edge. There are **two** ways in,
and closing only the first leaves it open:

**1. Through the proxy** — Nginx Proxy Manager → the API's Proxy Host → the
*Advanced* tab, which is inserted inside the `server` block and so wins over the
default `location /`:

```nginx
location /metrics {
    return 403;
}
```

Verify: `curl -o /dev/null -w '%{http_code}\n' https://<api-host>/metrics` → `403`.

**2. Directly on the published port** — if the container publishes
`-p 34301:34301` it binds `0.0.0.0`, so `http://<server-ip>:34301/metrics`
bypasses the proxy entirely and the rule above does nothing for it. Publishing
on the bridge address instead keeps Prometheus working (it already scrapes
`172.17.0.1:34301`) while taking the port off the public interface:

```
-p 172.17.0.1:34301:34301
```

Confirm before changing it that Nginx Proxy Manager reaches the API over the
bridge or a shared Docker network rather than via the public IP — if it uses the
public IP, this change takes the site down. Check with:
`docker inspect boffmedia-server --format '{{json .HostConfig.PortBindings}}'`

Verify from off-box: `curl --max-time 5 http://<server-ip>:34301/metrics` → refused.

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
| DB Query p95 by Operation | `db_query_duration_ms_bucket` | Live (added 2026-09-05) |
| Slow Queries/s by Operation | `db_slow_queries_total` | Live (added 2026-09-05) |
| DB Query Errors/s | `db_query_errors_total` | Live (added 2026-09-05) |
| Retention Sweep Errors (24h) | `retention_sweep_errors_total` | Live (added 2026-09-05) |
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

## Grafana alerts

> **SMTP working as of 2026-05-18.** Contact point (luisca343@gmail.com) tested and delivering.  
> Fix applied: all `[smtp]` lines in `/docker/config/grafana/grafana.ini` were commented out with `;` — uncommented the required fields and restarted Grafana.

**The rules are now code, not a table.** They live in
[`docs/grafana/alerts-boffmedia.yaml`](../grafana/alerts-boffmedia.yaml) as a
Grafana provisioning file, because a table in Markdown cannot be applied and
this one sat under a "TODO" heading for three and a half months. Installing it
is four commands, written at the top of that file.

Six rules in two groups:

| Group | Alert | Condition | For |
|---|---|---|---|
| `boffmedia-api` | API error rate high | 5xx share of requests > 1% | 5m |
| `boffmedia-api` | API container down | `up{job="boffmedia-api"} < 1` | 2m |
| `boffmedia-api` | DB connections above 80% of max | threads_connected / max_connections > 0.8 | 5m |
| `boffmedia-api` | Backup missed | success marker older than 25h | 10m |
| `boffmedia-api-internal` | Slow queries rising | `sum(rate(db_slow_queries_total[5m])) > 1` | 10m |
| `boffmedia-api-internal` | Nightly retention sweep failing | `increase(retention_sweep_errors_total[24h]) > 0` | 5m |

The second group did not exist in the original four: `db-metrics.ts` and
`retention.service.ts` registered four metrics after this runbook was written,
and nothing — no panel, no rule — ever read any of them.

**Two things that were wrong in the original four and are worth knowing:**

- The error-rate expression divides two rates. With no traffic at all both sides
  are zero, the division is NaN, and Grafana reports that as an *execution
  error*, not as "no errors". The shipped rule clamps the denominator.
- `noDataState` is not uniform, deliberately. "API container down" treats missing
  data as the incident (`Alerting`); the rest treat it as `OK`, because a deploy
  restart briefly produces no samples and three pages per deploy is how a team
  learns to ignore its alerts.

### The parity check

`node scripts/check-metrics-parity.mjs` (part of `pnpm lint`) reads the metric
names out of the dashboard JSON and this alert file and compares them to the
`new Histogram/Counter/Gauge` registrations in the API, both directions:

- a name referenced by a panel or a rule that the API does not register and no
  exporter provides — **fails**, because PromQL returns an empty series for an
  unknown metric and an empty series draws as a flat zero, which is
  indistinguishable from a healthy system;
- a metric the API registers that nothing reads — **fails**, which is the state
  the four DB metrics were in.

Negative-tested by mistyping a panel expression, by renaming a metric in the
API, and by replacing the datasource placeholder with a real UID; all three go
red.

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
