CREATE TABLE `vgc_series` (
	`id` varchar(36) NOT NULL,
	`session_id` varchar(36),
	`user_id` int,
	`created_at` bigint NOT NULL,
	`completed_at` bigint,
	`round_number` int,
	`opponent_name` varchar(128),
	`opponent_archetype` varchar(128),
	`my_team` text NOT NULL,
	`opponent_team` text NOT NULL,
	`games` text NOT NULL DEFAULT ('[]'),
	`series_result` varchar(8),
	`notes` text NOT NULL DEFAULT ('[]'),
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `vgc_series_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `vgc_matches` ADD `opponent_archetype` varchar(128);--> statement-breakpoint
ALTER TABLE `vgc_matches` ADD `outcome_tag` varchar(32);--> statement-breakpoint
ALTER TABLE `vgc_matches` ADD `turn_count` int;--> statement-breakpoint
ALTER TABLE `vgc_sessions` ADD `type` varchar(16) DEFAULT 'ladder' NOT NULL;--> statement-breakpoint
ALTER TABLE `vgc_sessions` ADD `archived_at` bigint;--> statement-breakpoint
ALTER TABLE `vgc_sessions` ADD `tournament_name` varchar(255);--> statement-breakpoint
ALTER TABLE `vgc_sessions` ADD `session_notes` text;--> statement-breakpoint
ALTER TABLE `vgc_team_presets` ADD `current_version` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `vgc_team_presets` ADD `versions` text DEFAULT ('[]') NOT NULL;--> statement-breakpoint
ALTER TABLE `vgc_series` ADD CONSTRAINT `vgc_series_session_id_vgc_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `vgc_sessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vgc_series` ADD CONSTRAINT `vgc_series_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE no action;