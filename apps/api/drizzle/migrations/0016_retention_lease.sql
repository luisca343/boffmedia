-- A8 — Distributed lock for retention sweep via a lease row
-- Rather than MySQL advisory locks (which are per-connection and break with connection pooling),
-- we use a database row to coordinate exclusive access across instances.
--
-- Each instance tries to claim the lease with a conditional UPDATE:
--   - If no row exists, INSERT and own it
--   - If the row exists and is expired, UPDATE to claim it
--   - If the row exists and is live, fail (another instance owns it)
--
-- The lease expires after 90 minutes (sweep should take minutes, not hours).
-- If a process crashes, the lease auto-expires and the next instance can claim it.

CREATE TABLE `retention_lease` (
  `lock_name` VARCHAR(64) NOT NULL PRIMARY KEY,
  `owner_id` VARCHAR(36) NOT NULL COMMENT 'Process id or instance id claiming the lease',
  `expires_at` DATETIME NOT NULL COMMENT 'Lease expires at this time; can be claimed after',
  `claimed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Distributed lock for retention sweep via optimistic lease row';
