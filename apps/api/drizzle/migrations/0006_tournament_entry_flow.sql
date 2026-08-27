ALTER TABLE `boffmedia_tournament_participants` MODIFY COLUMN `status` enum('active','eliminated','withdrew','disqualified','dropped') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `boffmedia_tournaments` ADD `teamsheet_required` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `boffmedia_tournaments` ADD `entry_deadline` timestamp DEFAULT NULL;--> statement-breakpoint
ALTER TABLE `boffmedia_tournaments` ADD `teamsheet_locked_at` timestamp DEFAULT NULL;