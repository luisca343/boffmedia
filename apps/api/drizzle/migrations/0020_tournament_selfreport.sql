CREATE TABLE `boffmedia_tournament_match_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`match_id` int NOT NULL,
	`author_user_id` int,
	`author_name` varchar(64),
	`kind` enum('sys','player','judge') NOT NULL DEFAULT 'player',
	`body` varchar(1000) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_tournament_match_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` MODIFY COLUMN `bracket` enum('winners','losers','grand','group','league','swiss','third') NOT NULL DEFAULT 'winners';--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_phases` MODIFY COLUMN `format` enum('single','double','roundrobin','swiss','leaderboard','groups') NOT NULL;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_groups` ADD `phase_id` int;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD `proposed_by_participant_id` int;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD `proposed_top_score` int;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD `proposed_bot_score` int;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD `proposed_games` varchar(16);--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD `proposed_at` timestamp;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD `proposal_expires_at` timestamp;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD `proposal_state` enum('pending','disputed');--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD `judge_requested_at` timestamp;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_participants` ADD `teamsheet` text;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_participants` ADD `checked_in_at` timestamp;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_phases` ADD `finals_best_of` int;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_phases` ADD `group_count` int;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_phases` ADD `third_place` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `boffmedia_tournaments` ADD `prizes` text;--> statement-breakpoint
ALTER TABLE `boffmedia_tournaments` ADD `check_in_open` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_match_messages` ADD CONSTRAINT `tmm_m_fk` FOREIGN KEY (`match_id`) REFERENCES `boffmedia_tournament_matches`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_match_messages` ADD CONSTRAINT `tmm_u_fk` FOREIGN KEY (`author_user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `tmm_match_idx` ON `boffmedia_tournament_match_messages` (`match_id`);--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD CONSTRAINT `tm_prop_fk` FOREIGN KEY (`proposed_by_participant_id`) REFERENCES `boffmedia_tournament_participants`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `tg_phase_idx` ON `boffmedia_tournament_groups` (`phase_id`);