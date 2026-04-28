CREATE TABLE `vgc_limitless_teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournament_id` int,
	`player_slug` varchar(128) NOT NULL,
	`player_name` varchar(128),
	`placing` int,
	`record` varchar(16),
	`paste_id` int,
	`fetched_at` datetime NOT NULL,
	CONSTRAINT `vgc_limitless_teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vgc_limitless_tournaments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`limitless_id` varchar(64) NOT NULL,
	`name` varchar(255),
	`date` varchar(32),
	`format` varchar(64),
	`player_count` int,
	`regulation_id` varchar(64),
	`status` varchar(16) NOT NULL DEFAULT 'pending',
	`progress` int NOT NULL DEFAULT 0,
	`total` int NOT NULL DEFAULT 0,
	`error_message` text,
	`fetched_at` datetime NOT NULL,
	CONSTRAINT `vgc_limitless_tournaments_id` PRIMARY KEY(`id`),
	CONSTRAINT `vgc_limitless_tournaments_limitless_id_unique` UNIQUE(`limitless_id`)
);
--> statement-breakpoint
CREATE TABLE `vgc_paste_teams` (
	`id` varchar(16) NOT NULL,
	`paste_id` int,
	`paste_url` varchar(255),
	`player_name` varchar(128),
	`team_description` varchar(512),
	`tournament` varchar(255),
	`date_shared` varchar(16),
	`rank` varchar(64),
	`regulation_id` varchar(64),
	`species` text NOT NULL,
	`items` text NOT NULL DEFAULT ('[]'),
	`replica_status` varchar(8),
	`replica_code` varchar(20),
	`has_evs` varchar(4),
	`source_url` varchar(512),
	`owner` varchar(128),
	`fetched_at` datetime NOT NULL,
	CONSTRAINT `vgc_paste_teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vgc_pastes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pokepaste_id` varchar(32),
	`raw_text` text NOT NULL,
	`parsed_slots` text NOT NULL,
	`author` varchar(128),
	`title` varchar(255),
	`format_id` varchar(64),
	`fetched_at` datetime NOT NULL,
	CONSTRAINT `vgc_pastes_id` PRIMARY KEY(`id`),
	CONSTRAINT `vgc_pastes_pokepaste_id_unique` UNIQUE(`pokepaste_id`)
);
--> statement-breakpoint
CREATE TABLE `vgc_regulations` (
	`id` varchar(64) NOT NULL,
	`format_id` varchar(128) NOT NULL,
	`name` varchar(255) NOT NULL,
	`game_type` varchar(16) NOT NULL DEFAULT 'doubles',
	`vgcpastes_gid` varchar(32),
	`active` int NOT NULL DEFAULT 1,
	`created_at` datetime NOT NULL,
	CONSTRAINT `vgc_regulations_id` PRIMARY KEY(`id`)
);

INSERT INTO `vgc_regulations` (`id`, `format_id`, `name`, `game_type`, `vgcpastes_gid`, `active`, `created_at`)
VALUES (
  'vgc2026regma',
  'gen9championsvgc2026regma',
  '[Gen 9 Champions] VGC 2026 Reg M-A',
  'doubles',
  '791705272',
  1,
  NOW()
);


--> statement-breakpoint
CREATE TABLE `vgc_smogon_pokemon` (
	`id` int AUTO_INCREMENT NOT NULL,
	`format_id` varchar(64) NOT NULL,
	`month` varchar(7) NOT NULL,
	`cutoff` int NOT NULL,
	`species_id` varchar(64) NOT NULL,
	`species_name` varchar(64) NOT NULL,
	`rank` int NOT NULL,
	`usage_percent` double NOT NULL,
	`raw_count` int NOT NULL,
	`top_item` varchar(64),
	`top_move` varchar(64),
	`top_tera_type` varchar(32),
	`abilities` text NOT NULL,
	`items` text NOT NULL,
	`moves` text NOT NULL,
	`tera_types` text NOT NULL,
	`teammates` text NOT NULL,
	`spreads` text NOT NULL,
	`fetched_at` datetime NOT NULL,
	CONSTRAINT `vgc_smogon_pokemon_id` PRIMARY KEY(`id`),
	CONSTRAINT `vgc_smogon_pokemon_idx` UNIQUE(`format_id`,`month`,`cutoff`,`species_id`)
);
--> statement-breakpoint
CREATE TABLE `vgc_smogon_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`format_id` varchar(64) NOT NULL,
	`month` varchar(7) NOT NULL,
	`cutoff` int NOT NULL,
	`pokemon_count` int NOT NULL DEFAULT 0,
	`fetched_at` datetime NOT NULL,
	CONSTRAINT `vgc_smogon_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `vgc_smogon_format_month_cutoff_idx` UNIQUE(`format_id`,`month`,`cutoff`)
);
--> statement-breakpoint
CREATE TABLE `vgc_matches` (
	`id` varchar(36) NOT NULL,
	`session_id` varchar(36),
	`user_id` int,
	`format` enum('BO1','BO3') NOT NULL DEFAULT 'BO1',
	`my_team` text NOT NULL,
	`opponent_team` text NOT NULL,
	`opponent_name` varchar(128),
	`result` enum('win','loss','draw'),
	`elo_after` double,
	`opponent_elo` double,
	`notes` text NOT NULL DEFAULT ('[]'),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`completed_at` datetime,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `vgc_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vgc_sessions` (
	`id` varchar(36) NOT NULL,
	`user_id` int,
	`label` varchar(128) NOT NULL,
	`format` enum('BO1','BO3') NOT NULL DEFAULT 'BO1',
	`regulation_id` varchar(64) NOT NULL,
	`active_preset_id` varchar(36),
	`start_elo` double,
	`started_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `vgc_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vgc_team_presets` (
	`id` varchar(36) NOT NULL,
	`user_id` int,
	`name` varchar(128) NOT NULL,
	`regulation_id` varchar(64) NOT NULL,
	`export_string` text NOT NULL,
	`slots` text NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `vgc_team_presets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `vgc_limitless_teams` ADD CONSTRAINT `vgc_limitless_teams_paste_id_vgc_pastes_id_fk` FOREIGN KEY (`paste_id`) REFERENCES `vgc_pastes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vgc_limitless_teams` ADD CONSTRAINT `vgc_lt_tournament_id_fk` FOREIGN KEY (`tournament_id`) REFERENCES `vgc_limitless_tournaments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vgc_paste_teams` ADD CONSTRAINT `vgc_paste_teams_paste_id_vgc_pastes_id_fk` FOREIGN KEY (`paste_id`) REFERENCES `vgc_pastes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vgc_matches` ADD CONSTRAINT `vgc_matches_session_id_vgc_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `vgc_sessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vgc_matches` ADD CONSTRAINT `vgc_matches_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vgc_sessions` ADD CONSTRAINT `vgc_sessions_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vgc_team_presets` ADD CONSTRAINT `vgc_team_presets_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE no action;