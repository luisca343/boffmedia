ALTER TABLE `boffmedia_tournament_matches` ADD `resolved_by_user_id` int;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD `resolved_at` timestamp;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD CONSTRAINT `tm_resolved_by_fk` FOREIGN KEY (`resolved_by_user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;