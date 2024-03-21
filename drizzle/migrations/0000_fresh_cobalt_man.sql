CREATE TABLE `boffmedia_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(32) NOT NULL,
	`password` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`uuid` char(36),
	CONSTRAINT `boffmedia_users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ficus_mensajes` (
	`uuid` char(36),
	`id` int AUTO_INCREMENT NOT NULL,
	`content` json,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP(),
	`deleted_at` datetime,
	CONSTRAINT `ficus_mensajes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smartrotom_apps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(32) NOT NULL,
	`url` varchar(255),
	`active` int DEFAULT 1,
	CONSTRAINT `smartrotom_apps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smartrotom_user_apps` (
	`uuid` char(36),
	`app_id` int NOT NULL,
	`active` int DEFAULT 999
);
--> statement-breakpoint
CREATE TABLE `smartrotom_users` (
	`uuid` char(36) NOT NULL,
	`username` varchar(32) NOT NULL,
	`world` varchar(8),
	CONSTRAINT `smartrotom_users_uuid` PRIMARY KEY(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `wingull_invites` (
	`id` varchar(6) NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`username` varchar(32) NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP(),
	`used_at` datetime DEFAULT CURRENT_TIMESTAMP(),
	`deleted_at` datetime,
	CONSTRAINT `wingull_invites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `boffmedia_users` ADD CONSTRAINT `boffmedia_users_uuid_smartrotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `smartrotom_users`(`uuid`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ficus_mensajes` ADD CONSTRAINT `ficus_mensajes_uuid_smartrotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `smartrotom_users`(`uuid`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `smartrotom_user_apps` ADD CONSTRAINT `smartrotom_user_apps_uuid_smartrotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `smartrotom_users`(`uuid`) ON DELETE no action ON UPDATE no action;