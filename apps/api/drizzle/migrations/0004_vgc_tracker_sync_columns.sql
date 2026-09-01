-- VGC tracker: tombstones and a client-clock version stamp.
--
-- Two independent sync defects, one migration because they touch the same four
-- tables.
--
-- `deleted_at` — a hard DELETE was invisible to any device that was offline
-- when it happened. That device kept its copy, the next sync saw a row the
-- server did not have, and pushed it straight back: deleting a session on one
-- machine resurrected it (and every match under it) from the other. A tombstone
-- is the row staying around long enough to be told about.
--
-- `client_updated_at` — conflict detection compared the client's epoch-ms
-- stamp against `updated_at`, which is the SERVER's clock. Two clocks, so a
-- device running five minutes slow would 409 on every write once any other
-- device had written. The comparison is now client stamp against client stamp.
--
-- Both are nullable with no default on purpose: NULL means "this row predates
-- the column". A NULL `deleted_at` is a live row, and a NULL
-- `client_updated_at` skips the conflict check rather than failing it, so
-- existing rows keep syncing exactly as they did until their next write.
ALTER TABLE `tools_vgc_team_presets` ADD COLUMN `client_updated_at` BIGINT NULL;--> statement-breakpoint
ALTER TABLE `tools_vgc_team_presets` ADD COLUMN `deleted_at` BIGINT NULL;--> statement-breakpoint
ALTER TABLE `tools_vgc_sessions` ADD COLUMN `client_updated_at` BIGINT NULL;--> statement-breakpoint
ALTER TABLE `tools_vgc_sessions` ADD COLUMN `deleted_at` BIGINT NULL;--> statement-breakpoint
ALTER TABLE `tools_vgc_matches` ADD COLUMN `client_updated_at` BIGINT NULL;--> statement-breakpoint
ALTER TABLE `tools_vgc_matches` ADD COLUMN `deleted_at` BIGINT NULL;--> statement-breakpoint
ALTER TABLE `tools_vgc_series` ADD COLUMN `client_updated_at` BIGINT NULL;--> statement-breakpoint
ALTER TABLE `tools_vgc_series` ADD COLUMN `deleted_at` BIGINT NULL;--> statement-breakpoint
-- Every read path filters on `deleted_at IS NULL` beside `user_id`, and the
-- sync pull asks for the tombstones the same way. One composite index serves
-- both halves; the plain `user_id` indexes stay for the ordered listings.
CREATE INDEX `vgc_presets_user_deleted_idx` ON `tools_vgc_team_presets` (`user_id`, `deleted_at`);--> statement-breakpoint
CREATE INDEX `vgc_sessions_user_deleted_idx` ON `tools_vgc_sessions` (`user_id`, `deleted_at`);--> statement-breakpoint
CREATE INDEX `vgc_matches_user_deleted_idx` ON `tools_vgc_matches` (`user_id`, `deleted_at`);--> statement-breakpoint
CREATE INDEX `vgc_series_user_deleted_idx` ON `tools_vgc_series` (`user_id`, `deleted_at`);
