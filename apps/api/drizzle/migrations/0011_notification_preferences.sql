CREATE TABLE `boffmedia_notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`type` enum('event','achievement','tournament','system','forum') NOT NULL,
	`is_muted` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boffmedia_notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `bnp_user_type_uq` UNIQUE(`user_id`,`type`)
);
--> statement-breakpoint
ALTER TABLE `boffmedia_notification_preferences` ADD CONSTRAINT `boffmedia_notification_preferences_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `bnp_user_idx` ON `boffmedia_notification_preferences` (`user_id`);