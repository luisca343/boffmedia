ALTER TABLE `boffmedia_user_roles` RENAME COLUMN `userId` TO `user_id`;--> statement-breakpoint
ALTER TABLE `boffmedia_user_roles` RENAME COLUMN `roleId` TO `role_id`;--> statement-breakpoint
ALTER TABLE `boffmedia_users` RENAME COLUMN `profilePicture` TO `profile_picture`;--> statement-breakpoint
ALTER TABLE `boffmedia_users` RENAME COLUMN `coverImage` TO `cover_image`;--> statement-breakpoint
ALTER TABLE `boffmedia_users` RENAME COLUMN `googleId` TO `google_id`;--> statement-breakpoint
ALTER TABLE `boffmedia_users` RENAME COLUMN `discordId` TO `discord_id`;--> statement-breakpoint
ALTER TABLE `boffmedia_users` RENAME COLUMN `twitchId` TO `twitch_id`;--> statement-breakpoint
ALTER TABLE `boffmedia_users` RENAME COLUMN `steamId` TO `steam_id`;--> statement-breakpoint
ALTER TABLE `boffmedia_users` RENAME COLUMN `emailVerified` TO `email_verified`;--> statement-breakpoint
ALTER TABLE `boffmedia_users` RENAME COLUMN `createdAt` TO `created_at`;--> statement-breakpoint
ALTER TABLE `boffmedia_users` RENAME COLUMN `updatedAt` TO `updated_at`;--> statement-breakpoint
ALTER TABLE `boffmedia_users` RENAME COLUMN `deletedAt` TO `deleted_at`;--> statement-breakpoint
ALTER TABLE `boffmedia_users` DROP INDEX `boffmedia_users_googleId_unique`;--> statement-breakpoint
ALTER TABLE `boffmedia_users` DROP INDEX `boffmedia_users_discordId_unique`;--> statement-breakpoint
ALTER TABLE `boffmedia_users` DROP INDEX `boffmedia_users_twitchId_unique`;--> statement-breakpoint
ALTER TABLE `boffmedia_users` DROP INDEX `boffmedia_users_steamId_unique`;--> statement-breakpoint
ALTER TABLE `boffmedia_user_roles` DROP FOREIGN KEY `boffmedia_user_roles_userId_boffmedia_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `boffmedia_user_roles` DROP FOREIGN KEY `boffmedia_user_roles_roleId_boffmedia_roles_id_fk`;
--> statement-breakpoint
ALTER TABLE `boffmedia_users` ADD CONSTRAINT `boffmedia_users_google_id_unique` UNIQUE(`google_id`);--> statement-breakpoint
ALTER TABLE `boffmedia_users` ADD CONSTRAINT `boffmedia_users_discord_id_unique` UNIQUE(`discord_id`);--> statement-breakpoint
ALTER TABLE `boffmedia_users` ADD CONSTRAINT `boffmedia_users_twitch_id_unique` UNIQUE(`twitch_id`);--> statement-breakpoint
ALTER TABLE `boffmedia_users` ADD CONSTRAINT `boffmedia_users_steam_id_unique` UNIQUE(`steam_id`);--> statement-breakpoint
ALTER TABLE `boffmedia_user_roles` ADD CONSTRAINT `boffmedia_user_roles_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_user_roles` ADD CONSTRAINT `boffmedia_user_roles_role_id_boffmedia_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `boffmedia_roles`(`id`) ON DELETE cascade ON UPDATE cascade;