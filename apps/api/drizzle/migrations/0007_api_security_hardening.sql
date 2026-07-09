ALTER TABLE `boffmedia_users` MODIFY COLUMN `password` varchar(255);--> statement-breakpoint
ALTER TABLE `boffmedia_users` ADD `steamId` varchar(255);--> statement-breakpoint
ALTER TABLE `boffmedia_users` ADD CONSTRAINT `boffmedia_users_steamId_unique` UNIQUE(`steamId`);--> statement-breakpoint
CREATE INDEX `event_status_idx` ON `boffmedia_events` (`status`);--> statement-breakpoint
CREATE INDEX `event_visibility_idx` ON `boffmedia_events` (`visibility`);--> statement-breakpoint
CREATE INDEX `event_type_idx` ON `boffmedia_events` (`type`);