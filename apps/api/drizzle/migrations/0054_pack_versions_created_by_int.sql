-- The column held a Minecraft-UUID-shaped char(36) and was never written, so
-- every row is NULL. Clearing it explicitly keeps the type change from failing
-- on a stray value from an older experiment.
UPDATE `pack_versions` SET `created_by` = NULL;
--> statement-breakpoint
ALTER TABLE `pack_versions` MODIFY COLUMN `created_by` int;
