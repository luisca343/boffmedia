-- pack_audit had a single actor column (a Minecraft UUID) while the launcher
-- principal is now a Boffmedia account: post-cutover serves recorded no actor.
-- Nullable and FK-less on purpose, matching pack_id: the trail must survive the
-- account being deleted.
ALTER TABLE `pack_audit` ADD COLUMN `user_id` int NULL AFTER `pack_id`;
--> statement-breakpoint
ALTER TABLE `pack_audit` ADD INDEX `pack_audit_user_idx` (`user_id`);
