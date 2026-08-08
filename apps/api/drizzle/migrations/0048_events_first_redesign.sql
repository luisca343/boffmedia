-- Events-first randomlocke redesign (destructive; randomizer_* tables only).
-- boffmedia_tournaments / boffmedia_tournament_participants are a live, unrelated
-- feature and are intentionally NOT touched here.
--
-- FK ordering matters: the mysql2 migrator runs each statement without disabling
-- FOREIGN_KEY_CHECKS, so every FK referencing a table must be dropped before that
-- table can be dropped, and re-added after the replacement table exists.

-- 1. Universal event -> pack attachment
ALTER TABLE `boffmedia_events` ADD `pack_id` varchar(32);--> statement-breakpoint
ALTER TABLE `boffmedia_events` ADD CONSTRAINT `be_pack_fk` FOREIGN KEY (`pack_id`) REFERENCES `packs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `be_pack_idx` ON `boffmedia_events` (`pack_id`);--> statement-breakpoint

-- 2. Drop the audit FKs that point at the tables we are about to drop
ALTER TABLE `randomizer_audit` DROP FOREIGN KEY `raud_event_fk`;--> statement-breakpoint
ALTER TABLE `randomizer_audit` DROP FOREIGN KEY `raud_assignment_fk`;--> statement-breakpoint
DROP INDEX `raud_event_idx` ON `randomizer_audit`;--> statement-breakpoint

-- 3. Drop old randomizer tables. assignments first (it FKs randomizer_events),
--    then randomizer_events (now unreferenced).
DROP TABLE `randomizer_assignments`;--> statement-breakpoint
DROP TABLE `randomizer_events`;--> statement-breakpoint

-- 4. randomizer_configs (1:1 per community event)
CREATE TABLE `randomizer_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` int NOT NULL,
	`game_platform` varchar(8) NOT NULL,
	`game_title` varchar(64) NOT NULL,
	`settings_blob_sha512` char(128) NOT NULL,
	`fvx_jar_sha512` char(128) NOT NULL,
	`clean_rom_sha512` char(128) NOT NULL,
	`rom_hint` varchar(255),
	`status` varchar(16) NOT NULL DEFAULT 'draft',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `randomizer_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `randomizer_configs_event_id_unique` UNIQUE(`event_id`)
);
--> statement-breakpoint

-- 5. randomizer_assignments (config + mc_uuid; seed minted at claim)
CREATE TABLE `randomizer_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`config_id` int NOT NULL,
	`boffmedia_user_id` int,
	`mc_uuid` char(36) NOT NULL,
	`seed` bigint NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'claimed',
	`output_sha512` char(128),
	`log_blob_sha512` char(128),
	`claimed_at` timestamp DEFAULT (now()),
	`patched_at` timestamp,
	`verified_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `randomizer_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `rass_config_mcuuid_unique` UNIQUE(`config_id`,`mc_uuid`)
);
--> statement-breakpoint

-- 6. randomizer_audit: retarget from event -> config
ALTER TABLE `randomizer_audit` CHANGE COLUMN `event_id` `config_id` int;--> statement-breakpoint

-- 7. (Re-)create all foreign keys against the new tables
ALTER TABLE `randomizer_configs` ADD CONSTRAINT `rc_event_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `randomizer_assignments` ADD CONSTRAINT `rass_config_fk` FOREIGN KEY (`config_id`) REFERENCES `randomizer_configs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `randomizer_assignments` ADD CONSTRAINT `rass_user_fk` FOREIGN KEY (`boffmedia_user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `randomizer_audit` ADD CONSTRAINT `raud_config_fk` FOREIGN KEY (`config_id`) REFERENCES `randomizer_configs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `randomizer_audit` ADD CONSTRAINT `raud_assignment_fk` FOREIGN KEY (`assignment_id`) REFERENCES `randomizer_assignments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- 8. Indexes
CREATE INDEX `rc_event_idx` ON `randomizer_configs` (`event_id`);--> statement-breakpoint
CREATE INDEX `rc_status_idx` ON `randomizer_configs` (`status`);--> statement-breakpoint
CREATE INDEX `rass_config_idx` ON `randomizer_assignments` (`config_id`);--> statement-breakpoint
CREATE INDEX `rass_mc_uuid_idx` ON `randomizer_assignments` (`mc_uuid`);--> statement-breakpoint
CREATE INDEX `rass_user_idx` ON `randomizer_assignments` (`boffmedia_user_id`);--> statement-breakpoint
CREATE INDEX `rass_status_idx` ON `randomizer_assignments` (`status`);--> statement-breakpoint
CREATE INDEX `raud_config_idx` ON `randomizer_audit` (`config_id`);--> statement-breakpoint
CREATE INDEX `raud_assignment_idx` ON `randomizer_audit` (`assignment_id`);--> statement-breakpoint
CREATE INDEX `raud_action_idx` ON `randomizer_audit` (`action`);
