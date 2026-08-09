-- `boffmedia_user_id` is already written at mint time, so coverage should be
-- complete; backfill from the Minecraft bridge anyway before making it NOT NULL.
UPDATE `randomizer_assignments` a
  JOIN `boffmedia_users` u ON u.uuid = a.mc_uuid
   SET a.boffmedia_user_id = u.id
 WHERE a.boffmedia_user_id IS NULL;
--> statement-breakpoint
-- An assignment whose UUID maps to no account cannot be claimed by anyone under
-- the new key, and its seed is only meaningful to a player we can identify.
DELETE FROM `randomizer_assignments` WHERE `boffmedia_user_id` IS NULL;
--> statement-breakpoint
ALTER TABLE `randomizer_assignments` DROP INDEX `rass_config_mcuuid_unique`;--> statement-breakpoint
ALTER TABLE `randomizer_assignments` DROP FOREIGN KEY `rass_user_fk`;
--> statement-breakpoint
ALTER TABLE `randomizer_assignments` MODIFY COLUMN `boffmedia_user_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `randomizer_assignments` MODIFY COLUMN `mc_uuid` char(36);--> statement-breakpoint
ALTER TABLE `randomizer_assignments` ADD CONSTRAINT `rass_config_user_unique` UNIQUE(`config_id`,`boffmedia_user_id`);--> statement-breakpoint
ALTER TABLE `randomizer_assignments` ADD CONSTRAINT `rass_user_fk` FOREIGN KEY (`boffmedia_user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE no action;
