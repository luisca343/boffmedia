ALTER TABLE `vgc_paste_teams` ADD `team_description` varchar(512);--> statement-breakpoint
ALTER TABLE `vgc_paste_teams` ADD `items` text DEFAULT ('[]') NOT NULL;--> statement-breakpoint
ALTER TABLE `vgc_paste_teams` ADD `replica_status` varchar(8);--> statement-breakpoint
ALTER TABLE `vgc_paste_teams` ADD `replica_code` varchar(20);--> statement-breakpoint
ALTER TABLE `vgc_paste_teams` ADD `has_evs` varchar(4);--> statement-breakpoint
ALTER TABLE `vgc_paste_teams` ADD `source_url` varchar(512);--> statement-breakpoint
ALTER TABLE `vgc_paste_teams` ADD `owner` varchar(128);