CREATE TABLE `rotom_achievements` (
	`id` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`description` varchar(255) NOT NULL,
	`icon` varchar(255),
	`category` varchar(32) NOT NULL,
	`subcategory` varchar(32),
	`target` int DEFAULT 1,
	CONSTRAINT `rotom_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_user_achievements` (
	`uuid` char(36),
	`id` int NOT NULL,
	`progress` int DEFAULT 0,
	`completed` int DEFAULT 0,
	`completed_at` timestamp
);
--> statement-breakpoint
ALTER TABLE `rotom_user_achievements` ADD CONSTRAINT `rotom_user_achievements_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_achievements` ADD CONSTRAINT `rotom_user_achievements_id_rotom_achievements_id_fk` FOREIGN KEY (`id`) REFERENCES `rotom_achievements`(`id`) ON DELETE cascade ON UPDATE cascade;