-- Battlesim: the replays a player keeps and the teams they build.
--
-- Identity is the BOFFMEDIA ACCOUNT (`user_id`), not the Minecraft uuid. See the
-- long note in src/_db/schema/Battlesim.ts: battlesim has no in-game surface,
-- `AuthPrincipal.mcUuid` is optional, and keying on it would lock out every
-- account that never linked Minecraft. Same choice as every other `tools_*`
-- family (VGC tracker, TCG Pocket, randomizer).
--
-- `log` is MEDIUMTEXT rather than the TEXT that `rotom_replays` uses: 64 KB
-- truncates a long battle silently, and the replay then plays to a point and
-- stops.
--
-- NOTE FOR WHOEVER APPLIES THIS. drizzle-kit also wanted to re-add
-- `client_updated_at`/`deleted_at` to the four `tools_vgc_*` tables, because
-- migration 0004 shipped without its `meta/0004_snapshot.json` and drizzle
-- therefore cannot see that it happened. Those columns already exist, so the
-- statements were removed by hand — re-adding them fails with a duplicate
-- column. This migration's own snapshot records the true schema, so the drift
-- does not recur after this.

CREATE TABLE `tools_battlesim_replays` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`client_id` varchar(64) NOT NULL,
	`format` varchar(64) NOT NULL,
	`p1_name` varchar(64) NOT NULL,
	`p2_name` varchar(64) NOT NULL,
	`winner` varchar(64),
	`log` mediumtext NOT NULL,
	`teams` text,
	`source` enum('local','pvp') NOT NULL DEFAULT 'local',
	`opponent_user_id` int,
	`played_at` bigint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` bigint,
	CONSTRAINT `tools_battlesim_replays_id` PRIMARY KEY(`id`),
	CONSTRAINT `bsim_replays_owner_client_uq` UNIQUE(`user_id`,`client_id`)
);
--> statement-breakpoint
CREATE TABLE `tools_battlesim_teams` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`client_id` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`format` varchar(64) NOT NULL,
	`packed` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`client_updated_at` bigint,
	`deleted_at` bigint,
	CONSTRAINT `tools_battlesim_teams_id` PRIMARY KEY(`id`),
	CONSTRAINT `bsim_teams_owner_client_uq` UNIQUE(`user_id`,`client_id`)
);
--> statement-breakpoint
ALTER TABLE `tools_battlesim_replays` ADD CONSTRAINT `tools_battlesim_replays_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tools_battlesim_replays` ADD CONSTRAINT `tools_battlesim_replays_opponent_user_id_boffmedia_users_id_fk` FOREIGN KEY (`opponent_user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tools_battlesim_teams` ADD CONSTRAINT `tools_battlesim_teams_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `bsim_replays_owner_played_idx` ON `tools_battlesim_replays` (`user_id`,`deleted_at`,`played_at`);--> statement-breakpoint
CREATE INDEX `bsim_replays_opponent_idx` ON `tools_battlesim_replays` (`opponent_user_id`);--> statement-breakpoint
CREATE INDEX `bsim_teams_owner_deleted_idx` ON `tools_battlesim_teams` (`user_id`,`deleted_at`);
