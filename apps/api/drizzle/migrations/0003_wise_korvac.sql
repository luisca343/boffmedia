CREATE TABLE `boffmedia_deployments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`release_id` int,
	`surface` enum('web','api','desktop') NOT NULL,
	`environment` enum('development','staging','production') NOT NULL,
	`product_version` varchar(64) NOT NULL,
	`build_id` varchar(128) NOT NULL,
	`git_sha` varchar(64),
	`version_file_sha` char(64),
	`status` enum('verified','failed') NOT NULL,
	`health_check_url` varchar(512),
	`health_checked_at` timestamp,
	`failure_reason` text,
	`metadata` json,
	`idempotency_key` varchar(255) NOT NULL,
	`recorded_by` varchar(128) NOT NULL,
	`deployed_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `boffmedia_deployments_id` PRIMARY KEY(`id`),
	CONSTRAINT `boffmedia_deployments_idempotency_uq` UNIQUE(`idempotency_key`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_release_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`release_id` int NOT NULL,
	`type` enum('new','improvement','fix','security','deprecated','removed') NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boffmedia_release_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_release_entry_translations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entry_id` int NOT NULL,
	`locale` enum('en','es') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boffmedia_release_entry_translations_id` PRIMARY KEY(`id`),
	CONSTRAINT `boffmedia_release_entry_translations_entry_locale_uq` UNIQUE(`entry_id`,`locale`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_release_fragments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`release_id` int NOT NULL,
	`fragment_id` varchar(128) NOT NULL,
	`source_path` varchar(255) NOT NULL,
	`content_hash` char(64) NOT NULL,
	`source_commit_sha` varchar(64) NOT NULL,
	`state` enum('claimed','consumed','released') NOT NULL DEFAULT 'claimed',
	`claimed_at` timestamp NOT NULL DEFAULT (now()),
	`consumed_at` timestamp,
	`released_at` timestamp,
	CONSTRAINT `boffmedia_release_fragments_id` PRIMARY KEY(`id`),
	CONSTRAINT `boffmedia_release_fragments_fragment_id_uq` UNIQUE(`fragment_id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_release_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`release_id` int NOT NULL,
	`user_id` int NOT NULL,
	`seen_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `boffmedia_release_views_id` PRIMARY KEY(`id`),
	CONSTRAINT `boffmedia_release_views_release_user_uq` UNIQUE(`release_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_releases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version` varchar(64) NOT NULL,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`creation_source` enum('fragments','manual','migration') NOT NULL DEFAULT 'fragments',
	`changelog_mode` enum('entries','none') NOT NULL DEFAULT 'entries',
	`required_surfaces` json NOT NULL,
	`source_commit_sha` varchar(64),
	`version_file_sha` char(64),
	`created_by` int,
	`approved_at` timestamp,
	`approved_by` int,
	`published_at` timestamp,
	`withdrawn_at` timestamp,
	`withdrawn_by` int,
	`withdrawal_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boffmedia_releases_id` PRIMARY KEY(`id`),
	CONSTRAINT `boffmedia_releases_version_uq` UNIQUE(`version`)
);
--> statement-breakpoint
ALTER TABLE `boffmedia_audit` MODIFY COLUMN `subject_type` enum('event','tournament','participant','match','report','content','user','release') NOT NULL;--> statement-breakpoint
ALTER TABLE `desktop_releases` ADD `product_release_id` int;--> statement-breakpoint
ALTER TABLE `boffmedia_deployments` ADD CONSTRAINT `boffmedia_deployments_release_id_boffmedia_releases_id_fk` FOREIGN KEY (`release_id`) REFERENCES `boffmedia_releases`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_release_entries` ADD CONSTRAINT `boffmedia_release_entries_release_id_boffmedia_releases_id_fk` FOREIGN KEY (`release_id`) REFERENCES `boffmedia_releases`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_release_entry_translations` ADD CONSTRAINT `boffmedia_release_entry_translations_entry_id_boffmedia_release_entries_id_fk` FOREIGN KEY (`entry_id`) REFERENCES `boffmedia_release_entries`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_release_fragments` ADD CONSTRAINT `boffmedia_release_fragments_release_id_boffmedia_releases_id_fk` FOREIGN KEY (`release_id`) REFERENCES `boffmedia_releases`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_release_views` ADD CONSTRAINT `boffmedia_release_views_release_id_boffmedia_releases_id_fk` FOREIGN KEY (`release_id`) REFERENCES `boffmedia_releases`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_release_views` ADD CONSTRAINT `boffmedia_release_views_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_releases` ADD CONSTRAINT `boffmedia_releases_created_by_boffmedia_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_releases` ADD CONSTRAINT `boffmedia_releases_approved_by_boffmedia_users_id_fk` FOREIGN KEY (`approved_by`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_releases` ADD CONSTRAINT `boffmedia_releases_withdrawn_by_boffmedia_users_id_fk` FOREIGN KEY (`withdrawn_by`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `boffmedia_deployments_release_surface_status_idx` ON `boffmedia_deployments` (`release_id`,`surface`,`environment`,`status`);--> statement-breakpoint
CREATE INDEX `boffmedia_deployments_version_surface_environment_idx` ON `boffmedia_deployments` (`product_version`,`surface`,`environment`);--> statement-breakpoint
CREATE INDEX `boffmedia_release_entries_release_order_idx` ON `boffmedia_release_entries` (`release_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `boffmedia_release_fragments_release_state_idx` ON `boffmedia_release_fragments` (`release_id`,`state`);--> statement-breakpoint
CREATE INDEX `boffmedia_release_views_user_seen_idx` ON `boffmedia_release_views` (`user_id`,`seen_at`);--> statement-breakpoint
CREATE INDEX `boffmedia_releases_status_published_idx` ON `boffmedia_releases` (`status`,`published_at`);--> statement-breakpoint
ALTER TABLE `desktop_releases` ADD CONSTRAINT `desktop_releases_product_release_id_boffmedia_releases_id_fk` FOREIGN KEY (`product_release_id`) REFERENCES `boffmedia_releases`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `desktop_releases_product_release_idx` ON `desktop_releases` (`product_release_id`);