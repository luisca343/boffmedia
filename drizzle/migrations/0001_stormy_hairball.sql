ALTER TABLE `boffmedia_achievements` ADD `deleted_at` datetime DEFAULT null;--> statement-breakpoint
ALTER TABLE `boffmedia_event_teams` ADD `deleted_at` datetime DEFAULT null;--> statement-breakpoint
ALTER TABLE `boffmedia_events` ADD `deleted_at` datetime DEFAULT null;--> statement-breakpoint
ALTER TABLE `boffmedia_games` ADD `deleted_at` datetime DEFAULT null;