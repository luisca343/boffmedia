ALTER TABLE `boffmedia_achievements` MODIFY COLUMN `deleted_at` datetime;--> statement-breakpoint
ALTER TABLE `boffmedia_event_teams` MODIFY COLUMN `deleted_at` datetime;--> statement-breakpoint
ALTER TABLE `boffmedia_events` MODIFY COLUMN `deleted_at` datetime;--> statement-breakpoint
ALTER TABLE `boffmedia_games` MODIFY COLUMN `deleted_at` datetime;--> statement-breakpoint
ALTER TABLE `rotom_news` ADD `author` varchar(255);--> statement-breakpoint
ALTER TABLE `rotom_news` ADD `readtime` varchar(50);