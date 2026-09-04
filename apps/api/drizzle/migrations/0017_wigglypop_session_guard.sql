-- S12: Concurrent game sessions could desync Wigglypop custody — session tracking for logging
--
-- When multiple game sessions for the same UUID run custody operations concurrently,
-- the order of state changes becomes unpredictable. This table tracks active sessions
-- per UUID so we can log divergence warnings when >1 session acts on the same mon.
--
-- Logging only (not full enforcement — enforcement is out of scope per requirements).
-- The service records a session ID when a custody operation starts and queries active
-- sessions to detect concurrent activity.

CREATE TABLE `wigglypop_sessions` (
  `uuid` VARCHAR(36) NOT NULL COMMENT 'Minecraft UUID (seller/buyer)',
  `session_id` VARCHAR(64) NOT NULL COMMENT 'Game session identifier',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Session start time',
  KEY `idx_uuid_created` (`uuid`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Active game sessions per UUID — custody divergence detection';
