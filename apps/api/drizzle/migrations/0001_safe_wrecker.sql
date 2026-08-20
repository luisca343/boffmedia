CREATE TABLE `boffmedia_sharex_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`label` varchar(64) NOT NULL,
	`token_hash` char(64) NOT NULL,
	`created_by` int,
	`used_at` timestamp,
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boffmedia_sharex_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `sxt_token_hash_uq` UNIQUE(`token_hash`)
);
--> statement-breakpoint
ALTER TABLE `boffmedia_sharex_images` MODIFY COLUMN `key` char(32);--> statement-breakpoint
ALTER TABLE `boffmedia_sharex_images` ADD `token_id` int;--> statement-breakpoint
ALTER TABLE `boffmedia_sharex_tokens` ADD CONSTRAINT `boffmedia_sharex_tokens_created_by_boffmedia_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_sharex_images` ADD CONSTRAINT `boffmedia_sharex_images_token_id_boffmedia_sharex_tokens_id_fk` FOREIGN KEY (`token_id`) REFERENCES `boffmedia_sharex_tokens`(`id`) ON DELETE set null ON UPDATE cascade;