CREATE TABLE `boffmedia_email_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`email` varchar(255) NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`expires_at` datetime NOT NULL,
	`used_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_email_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`expires_at` datetime NOT NULL,
	`used_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_password_reset_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `boffmedia_users` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `boffmedia_users` SET `emailVerified` = true;--> statement-breakpoint
ALTER TABLE `boffmedia_email_verifications` ADD CONSTRAINT `boffmedia_email_verifications_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_password_reset_tokens` ADD CONSTRAINT `boffmedia_password_reset_tokens_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `ev_token_idx` ON `boffmedia_email_verifications` (`token_hash`);--> statement-breakpoint
CREATE INDEX `ev_user_idx` ON `boffmedia_email_verifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `prt_token_idx` ON `boffmedia_password_reset_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `prt_user_idx` ON `boffmedia_password_reset_tokens` (`user_id`);