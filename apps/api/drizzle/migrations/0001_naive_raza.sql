CREATE TABLE `tools_mhwilds_anatomy_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fixed_id` int NOT NULL,
	`variant_id` varchar(16) NOT NULL,
	`callouts` json NOT NULL,
	`updated_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tools_mhwilds_anatomy_overrides_id` PRIMARY KEY(`id`),
	CONSTRAINT `mha_fixed_variant_uq` UNIQUE(`fixed_id`,`variant_id`)
);
--> statement-breakpoint
ALTER TABLE `tools_mhwilds_anatomy_overrides` ADD CONSTRAINT `mha_updated_by_fk` FOREIGN KEY (`updated_by`) REFERENCES `boffmedia_users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `mha_fixed_id_idx` ON `tools_mhwilds_anatomy_overrides` (`fixed_id`);