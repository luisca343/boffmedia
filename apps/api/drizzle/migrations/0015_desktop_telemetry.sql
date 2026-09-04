-- Desktop telemetry: opt-in, PII-scrubbed event collection.
--
-- Every row carries ZERO personal data. The fields are:
--   - install_id: random per-installation UUID (NOT user/hardware/account-linked)
--   - event_name: enumerated event type (install-done, launch, crash-code, tool-open)
--   - code: enumerated outcome (success, failed, tool name, crash classification)
--   - created_at: server-side timestamp
--
-- Purpose: understand install/launch/crash rates and tool usage without any
-- ability to identify or track individuals. This is the reason the feature exists
-- at all — it must remain PII-scrubbed to justify the trust.
--
-- Events are rate-limited by install_id and validated on ingest. Non-enumerated
-- event names or codes are rejected. The client respects a Settings toggle and
-- sends NOTHING when opted out (not even a heartbeat).

CREATE TABLE `desktop_telemetry_events` (
	`id` int NOT NULL AUTO_INCREMENT,
	`install_id` char(36) NOT NULL,
	`event_name` enum('install-done','launch','crash-code','tool-open') NOT NULL,
	`code` varchar(32) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `desktop_telemetry_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `dtel_install_id_created_idx` ON `desktop_telemetry_events` (`install_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `dtel_event_name_created_idx` ON `desktop_telemetry_events` (`event_name`,`created_at`);
