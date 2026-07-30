CREATE TABLE `pack_acl` (
	`pack_id` varchar(32) NOT NULL,
	`uuid` char(36) NOT NULL,
	`granted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`granted_by` int,
	`via_invite` varchar(32),
	CONSTRAINT `pack_acl_pack_id_uuid_pk` PRIMARY KEY(`pack_id`,`uuid`)
);
--> statement-breakpoint
CREATE TABLE `pack_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pack_id` varchar(32),
	`uuid` char(36),
	`action` varchar(32) NOT NULL,
	`meta` json,
	`at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `pack_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pack_invites` (
	`code` varchar(32) NOT NULL,
	`pack_id` varchar(32) NOT NULL,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`expires_at` timestamp,
	`max_uses` int NOT NULL DEFAULT 1,
	`uses` int NOT NULL DEFAULT 0,
	`revoked` boolean NOT NULL DEFAULT false,
	CONSTRAINT `pack_invites_code` PRIMARY KEY(`code`)
);
--> statement-breakpoint
CREATE TABLE `pack_versions` (
	`id` varchar(32) NOT NULL,
	`pack_id` varchar(32) NOT NULL,
	`name` varchar(64) NOT NULL,
	`minecraft` varchar(32) NOT NULL,
	`loader` varchar(20),
	`loader_version` varchar(64),
	`files` json NOT NULL,
	`published` boolean NOT NULL DEFAULT false,
	`notes` text,
	`created_by` char(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `pack_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `packs` (
	`id` varchar(32) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`summary` varchar(512),
	`icon_url` varchar(512),
	`access_kind` varchar(16) NOT NULL DEFAULT 'allowlist',
	`password_hash` varchar(255),
	`latest_version_id` varchar(32),
	`archived` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `packs_id` PRIMARY KEY(`id`),
	CONSTRAINT `packs_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `pack_acl` ADD CONSTRAINT `pack_acl_pack_fk` FOREIGN KEY (`pack_id`) REFERENCES `packs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pack_invites` ADD CONSTRAINT `pack_invites_pack_fk` FOREIGN KEY (`pack_id`) REFERENCES `packs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pack_versions` ADD CONSTRAINT `pack_versions_pack_fk` FOREIGN KEY (`pack_id`) REFERENCES `packs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `pack_acl_uuid_idx` ON `pack_acl` (`uuid`);--> statement-breakpoint
CREATE INDEX `pack_audit_pack_idx` ON `pack_audit` (`pack_id`);--> statement-breakpoint
CREATE INDEX `pack_versions_pack_idx` ON `pack_versions` (`pack_id`);