CREATE TABLE `boffmedia_event_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposer_user_id` int,
	`title` varchar(255) NOT NULL,
	`game_name` varchar(255) NOT NULL,
	`type` varchar(64) NOT NULL,
	`description` text NOT NULL,
	`additional_info` text,
	`suggested_date` datetime,
	`end_date` datetime,
	`max_participants` int,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`review_note` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_event_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`type` enum('event','achievement','tournament','system') NOT NULL DEFAULT 'system',
	`title` varchar(255) NOT NULL,
	`body` text,
	`link` varchar(512),
	`read_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `boffmedia_event_suggestions` ADD CONSTRAINT `boffmedia_event_suggestions_proposer_user_id_boffmedia_users_id_fk` FOREIGN KEY (`proposer_user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_notifications` ADD CONSTRAINT `boffmedia_notifications_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `es_status_idx` ON `boffmedia_event_suggestions` (`status`);--> statement-breakpoint
CREATE INDEX `notif_user_idx` ON `boffmedia_notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `notif_user_read_idx` ON `boffmedia_notifications` (`user_id`,`read_at`);