CREATE TABLE `randomizer_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` int NOT NULL,
	`participant_id` int NOT NULL,
	`mc_uuid` char(36),
	`seed` bigint NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'pending',
	`output_sha512` char(128),
	`log_blob_sha512` char(128),
	`claimed_at` timestamp,
	`patched_at` timestamp,
	`verified_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `randomizer_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `rass_event_participant_unique` UNIQUE(`event_id`,`participant_id`)
);
--> statement-breakpoint
CREATE TABLE `randomizer_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` int,
	`assignment_id` int,
	`action` varchar(32) NOT NULL,
	`actor` varchar(64),
	`meta` json,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `randomizer_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `randomizer_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournament_id` int NOT NULL,
	`game_platform` varchar(8) NOT NULL,
	`game_title` varchar(64) NOT NULL,
	`settings_blob_sha512` char(128) NOT NULL,
	`fvx_jar_sha512` char(128) NOT NULL,
	`clean_rom_sha512` char(128) NOT NULL,
	`rom_hint` varchar(255),
	`status` varchar(16) NOT NULL DEFAULT 'draft',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `randomizer_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `randomizer_presets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`game_scope` varchar(32),
	`settings_json` json NOT NULL,
	`rnqs_blob_sha512` char(128),
	`updated_by` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `randomizer_presets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `randomizer_assignments` ADD CONSTRAINT `rass_event_fk` FOREIGN KEY (`event_id`) REFERENCES `randomizer_events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `randomizer_assignments` ADD CONSTRAINT `rass_participant_fk` FOREIGN KEY (`participant_id`) REFERENCES `boffmedia_tournament_participants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `randomizer_audit` ADD CONSTRAINT `raud_event_fk` FOREIGN KEY (`event_id`) REFERENCES `randomizer_events`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `randomizer_audit` ADD CONSTRAINT `raud_assignment_fk` FOREIGN KEY (`assignment_id`) REFERENCES `randomizer_assignments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `randomizer_events` ADD CONSTRAINT `re_tournament_fk` FOREIGN KEY (`tournament_id`) REFERENCES `boffmedia_tournaments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `randomizer_presets` ADD CONSTRAINT `rp_updated_by_fk` FOREIGN KEY (`updated_by`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `rass_event_idx` ON `randomizer_assignments` (`event_id`);--> statement-breakpoint
CREATE INDEX `rass_mc_uuid_idx` ON `randomizer_assignments` (`mc_uuid`);--> statement-breakpoint
CREATE INDEX `raud_event_idx` ON `randomizer_audit` (`event_id`);--> statement-breakpoint
CREATE INDEX `re_tournament_idx` ON `randomizer_events` (`tournament_id`);