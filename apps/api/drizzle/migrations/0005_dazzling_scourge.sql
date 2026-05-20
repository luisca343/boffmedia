CREATE TABLE `rotom_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_uuid` char(36) NOT NULL,
	`type` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`link` varchar(512),
	`is_read` int DEFAULT 0,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `rotom_notifications` ADD CONSTRAINT `rotom_notifications_user_uuid_rotom_users_uuid_fk` FOREIGN KEY (`user_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;