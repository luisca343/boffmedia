ALTER TABLE `smartrotom_user_apps` RENAME COLUMN `active` TO `order`;--> statement-breakpoint
ALTER TABLE `boffmedia_users` DROP FOREIGN KEY `boffmedia_users_uuid_smartrotom_users_uuid_fk`;
--> statement-breakpoint
ALTER TABLE `ficus_mensajes` DROP FOREIGN KEY `ficus_mensajes_uuid_smartrotom_users_uuid_fk`;
--> statement-breakpoint
ALTER TABLE `smartrotom_user_apps` DROP FOREIGN KEY `smartrotom_user_apps_uuid_smartrotom_users_uuid_fk`;
--> statement-breakpoint
ALTER TABLE `boffmedia_users` ADD CONSTRAINT `boffmedia_users_username_unique` UNIQUE(`username`);--> statement-breakpoint
ALTER TABLE `boffmedia_users` ADD CONSTRAINT `boffmedia_users_uuid_smartrotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `smartrotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ficus_mensajes` ADD CONSTRAINT `ficus_mensajes_uuid_smartrotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `smartrotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `smartrotom_user_apps` ADD CONSTRAINT `smartrotom_user_apps_uuid_smartrotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `smartrotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;