CREATE TABLE `boffmedia_tournament_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournament_id` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`label` varchar(64),
	`advance_count` int NOT NULL DEFAULT 2,
	`order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_tournament_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_tournament_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournament_id` int NOT NULL,
	`bracket` enum('winners','losers','grand','group','league','swiss') NOT NULL DEFAULT 'winners',
	`group_id` int,
	`round_number` int NOT NULL DEFAULT 1,
	`position` int NOT NULL DEFAULT 0,
	`top_participant_id` int,
	`bot_participant_id` int,
	`top_score` int,
	`bot_score` int,
	`winner_participant_id` int,
	`status` enum('pending','ready','live','completed','bye') NOT NULL DEFAULT 'pending',
	`next_match_id` int,
	`next_match_slot` enum('top','bot'),
	`loser_next_match_id` int,
	`loser_next_match_slot` enum('top','bot'),
	`scheduled_at` timestamp,
	`reported_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_tournament_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_tournament_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournament_id` int NOT NULL,
	`kind` enum('solo','team','entry') NOT NULL DEFAULT 'solo',
	`user_id` int,
	`name` varchar(255) NOT NULL,
	`tag` varchar(16),
	`avatar` varchar(255),
	`seed` int,
	`country` varchar(2),
	`hue` int,
	`group_id` int,
	`score` int,
	`meta` varchar(255),
	`verified` boolean NOT NULL DEFAULT false,
	`status` enum('active','eliminated','withdrew','disqualified') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_tournament_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_tournament_roster` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participant_id` int NOT NULL,
	`user_id` int,
	`name` varchar(255) NOT NULL,
	`role` varchar(32),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_tournament_roster_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_tournaments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`game_id` int,
	`event_id` int,
	`format` enum('single','double','groups','roundrobin','swiss','leaderboard') NOT NULL,
	`competitor_kind` enum('solo','team','entry') NOT NULL DEFAULT 'solo',
	`status` enum('draft','registration','live','completed','cancelled') NOT NULL DEFAULT 'draft',
	`metric` enum('score','time'),
	`unit` varchar(16),
	`max_participants` int,
	`registration_open` boolean NOT NULL DEFAULT false,
	`best_of` int NOT NULL DEFAULT 1,
	`group_count` int,
	`advance_count` int,
	`description` text,
	`rules` text,
	`banner` varchar(255),
	`icon` varchar(255),
	`hue` int,
	`start_date` timestamp,
	`end_date` timestamp,
	`champion_participant_id` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	`deleted_at` timestamp,
	CONSTRAINT `boffmedia_tournaments_id` PRIMARY KEY(`id`),
	CONSTRAINT `boffmedia_tournaments_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_groups` ADD CONSTRAINT `tg_t_fk` FOREIGN KEY (`tournament_id`) REFERENCES `boffmedia_tournaments`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD CONSTRAINT `tm_t_fk` FOREIGN KEY (`tournament_id`) REFERENCES `boffmedia_tournaments`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD CONSTRAINT `tm_group_fk` FOREIGN KEY (`group_id`) REFERENCES `boffmedia_tournament_groups`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD CONSTRAINT `tm_top_fk` FOREIGN KEY (`top_participant_id`) REFERENCES `boffmedia_tournament_participants`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD CONSTRAINT `tm_bot_fk` FOREIGN KEY (`bot_participant_id`) REFERENCES `boffmedia_tournament_participants`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD CONSTRAINT `tm_win_fk` FOREIGN KEY (`winner_participant_id`) REFERENCES `boffmedia_tournament_participants`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD CONSTRAINT `tm_next_fk` FOREIGN KEY (`next_match_id`) REFERENCES `boffmedia_tournament_matches`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD CONSTRAINT `tm_lnext_fk` FOREIGN KEY (`loser_next_match_id`) REFERENCES `boffmedia_tournament_matches`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_participants` ADD CONSTRAINT `tp_t_fk` FOREIGN KEY (`tournament_id`) REFERENCES `boffmedia_tournaments`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_participants` ADD CONSTRAINT `tp_user_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_participants` ADD CONSTRAINT `tp_group_fk` FOREIGN KEY (`group_id`) REFERENCES `boffmedia_tournament_groups`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_roster` ADD CONSTRAINT `tr_p_fk` FOREIGN KEY (`participant_id`) REFERENCES `boffmedia_tournament_participants`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_roster` ADD CONSTRAINT `tr_user_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournaments` ADD CONSTRAINT `t_game_fk` FOREIGN KEY (`game_id`) REFERENCES `boffmedia_games`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournaments` ADD CONSTRAINT `t_event_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `tg_tournament_idx` ON `boffmedia_tournament_groups` (`tournament_id`);--> statement-breakpoint
CREATE INDEX `tm_tournament_idx` ON `boffmedia_tournament_matches` (`tournament_id`);--> statement-breakpoint
CREATE INDEX `tm_bracket_idx` ON `boffmedia_tournament_matches` (`tournament_id`,`bracket`,`round_number`);--> statement-breakpoint
CREATE INDEX `tm_group_idx` ON `boffmedia_tournament_matches` (`group_id`);--> statement-breakpoint
CREATE INDEX `tm_next_idx` ON `boffmedia_tournament_matches` (`next_match_id`);--> statement-breakpoint
CREATE INDEX `tp_tournament_idx` ON `boffmedia_tournament_participants` (`tournament_id`);--> statement-breakpoint
CREATE INDEX `tp_user_idx` ON `boffmedia_tournament_participants` (`user_id`);--> statement-breakpoint
CREATE INDEX `tp_seed_idx` ON `boffmedia_tournament_participants` (`tournament_id`,`seed`);--> statement-breakpoint
CREATE INDEX `tp_group_idx` ON `boffmedia_tournament_participants` (`group_id`);--> statement-breakpoint
CREATE INDEX `tr_participant_idx` ON `boffmedia_tournament_roster` (`participant_id`);--> statement-breakpoint
CREATE INDEX `t_game_idx` ON `boffmedia_tournaments` (`game_id`);--> statement-breakpoint
CREATE INDEX `t_event_idx` ON `boffmedia_tournaments` (`event_id`);--> statement-breakpoint
CREATE INDEX `t_status_idx` ON `boffmedia_tournaments` (`status`);--> statement-breakpoint
CREATE INDEX `t_format_idx` ON `boffmedia_tournaments` (`format`);