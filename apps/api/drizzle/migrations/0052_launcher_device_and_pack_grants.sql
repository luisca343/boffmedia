CREATE TABLE `launcher_device_codes` (
	`device_code` char(64) NOT NULL,
	`user_code` varchar(16) NOT NULL,
	`user_id` int,
	`status` varchar(16) NOT NULL DEFAULT 'pending',
	`client_label` varchar(128),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`expires_at` timestamp NOT NULL,
	`consumed_at` timestamp,
	CONSTRAINT `launcher_device_codes_device_code` PRIMARY KEY(`device_code`),
	CONSTRAINT `launcher_device_codes_user_code_unique` UNIQUE(`user_code`)
);
--> statement-breakpoint
CREATE TABLE `pack_grants` (
	`pack_id` varchar(32) NOT NULL,
	`user_id` int NOT NULL,
	`source` varchar(16) NOT NULL DEFAULT 'admin',
	`source_ref` varchar(32),
	`granted_by` int,
	`granted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `pack_grants_pack_id_user_id_source_pk` PRIMARY KEY(`pack_id`,`user_id`,`source`)
);
--> statement-breakpoint
ALTER TABLE `launcher_device_codes` ADD CONSTRAINT `ldc_user_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `pack_grants` ADD CONSTRAINT `pack_grants_pack_fk` FOREIGN KEY (`pack_id`) REFERENCES `packs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pack_grants` ADD CONSTRAINT `pack_grants_user_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ldc_user_idx` ON `launcher_device_codes` (`user_id`);--> statement-breakpoint
CREATE INDEX `ldc_expires_idx` ON `launcher_device_codes` (`expires_at`);--> statement-breakpoint
CREATE INDEX `pack_grants_user_idx` ON `pack_grants` (`user_id`);
--> statement-breakpoint
-- Migrate every ACL row that maps to a real account. `via_invite` distinguishes
-- an admin decision from a redeemed code, which the old single-row model stored
-- but never used. Rows with no matching account stay in `pack_acl` as legacy
-- pre-grants and are claimed when that UUID is linked.
INSERT IGNORE INTO `pack_grants` (`pack_id`, `user_id`, `source`, `source_ref`, `granted_by`, `granted_at`)
SELECT a.pack_id,
       u.id,
       IF(a.via_invite IS NULL, 'admin', 'invite'),
       a.via_invite,
       a.granted_by,
       a.granted_at
  FROM `pack_acl` a
  JOIN `boffmedia_users` u ON u.uuid = a.uuid AND u.deleted_at IS NULL;
--> statement-breakpoint
DELETE a FROM `pack_acl` a
  JOIN `boffmedia_users` u ON u.uuid = a.uuid AND u.deleted_at IS NULL;
