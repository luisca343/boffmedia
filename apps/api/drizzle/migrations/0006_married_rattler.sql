ALTER TABLE `vgc_limitless_teams` ADD `placing` int;--> statement-breakpoint
ALTER TABLE `vgc_limitless_tournaments` ADD `regulation_id` varchar(64);--> statement-breakpoint
ALTER TABLE `vgc_limitless_tournaments` ADD `status` varchar(16) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `vgc_limitless_tournaments` ADD `progress` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `vgc_limitless_tournaments` ADD `total` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `vgc_limitless_tournaments` ADD `error_message` text;