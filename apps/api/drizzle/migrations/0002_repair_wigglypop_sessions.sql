-- Some existing databases were marked as having the baseline migrations
-- applied before this table was present. Keep this repair safe for fresh
-- databases, where the baseline already created it.
CREATE TABLE IF NOT EXISTS `rotom_wigglypop_sessions` (
	`uuid` char(36) NOT NULL,
	`session_id` varchar(64) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	KEY `wp_sessions_uuid_created_idx` (`uuid`,`created_at`)
);
