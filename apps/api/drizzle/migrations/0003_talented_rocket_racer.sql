CREATE TABLE `boffmedia_changelog_ctas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`changelog_id` int NOT NULL,
	`product` enum('boffmedia','smartrotom','all') NOT NULL,
	`platform` enum('all','web','desktop') NOT NULL,
	`url` varchar(512) NOT NULL,
	CONSTRAINT `boffmedia_changelog_ctas_id` PRIMARY KEY(`id`),
	CONSTRAINT `boffmedia_changelog_cta_target_uq` UNIQUE(`changelog_id`,`product`,`platform`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_changelog_translations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`changelog_id` int NOT NULL,
	`locale` varchar(35) NOT NULL,
	`title` varchar(255) NOT NULL,
	`summary` text,
	`body` text NOT NULL,
	`cta_label` varchar(255),
	`status` enum('draft','translated','reviewed') NOT NULL DEFAULT 'draft',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boffmedia_changelog_translations_id` PRIMARY KEY(`id`),
	CONSTRAINT `boffmedia_changelog_translation_locale_uq` UNIQUE(`changelog_id`,`locale`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_changelogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product` enum('boffmedia','smartrotom','all') NOT NULL,
	`platform` enum('all','web','desktop') NOT NULL,
	`version` varchar(32),
	`status` enum('draft','published','unpublished') NOT NULL DEFAULT 'draft',
	`published_at` timestamp,
	`created_by` int,
	`updated_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boffmedia_changelogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_user_changelog_state` (
	`user_id` int NOT NULL,
	`product` enum('boffmedia','smartrotom') NOT NULL,
	`last_seen_published_at` timestamp,
	`last_seen_entry_id` int,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boffmedia_user_changelog_state_pk` PRIMARY KEY(`user_id`,`product`)
);
--> statement-breakpoint
ALTER TABLE `boffmedia_changelog_ctas` ADD CONSTRAINT `boffmedia_changelog_ctas_changelog_id_boffmedia_changelogs_id_fk` FOREIGN KEY (`changelog_id`) REFERENCES `boffmedia_changelogs`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_changelog_translations` ADD CONSTRAINT `bct_changelog_fk` FOREIGN KEY (`changelog_id`) REFERENCES `boffmedia_changelogs`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_changelogs` ADD CONSTRAINT `bc_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_changelogs` ADD CONSTRAINT `bc_updated_by_fk` FOREIGN KEY (`updated_by`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_user_changelog_state` ADD CONSTRAINT `bucs_user_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `boffmedia_changelog_cta_changelog_idx` ON `boffmedia_changelog_ctas` (`changelog_id`);--> statement-breakpoint
CREATE INDEX `boffmedia_changelog_translation_status_idx` ON `boffmedia_changelog_translations` (`changelog_id`,`locale`,`status`);--> statement-breakpoint
CREATE INDEX `boffmedia_changelog_published_idx` ON `boffmedia_changelogs` (`product`,`platform`,`status`,`published_at`,`id`);--> statement-breakpoint
CREATE INDEX `boffmedia_changelog_status_idx` ON `boffmedia_changelogs` (`status`,`updated_at`);
