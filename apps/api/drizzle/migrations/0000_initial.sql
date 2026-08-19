CREATE TABLE `boffmedia_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(32) NOT NULL,
	CONSTRAINT `boffmedia_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `boffmedia_roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_user_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`role_id` int NOT NULL,
	CONSTRAINT `boffmedia_user_roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(32) NOT NULL,
	`password` varchar(255),
	`email` varchar(255) NOT NULL,
	`uuid` char(36),
	`profile_picture` varchar(255) NOT NULL DEFAULT 'https://cdn.boffmedia.es/default-profile.png',
	`cover_image` varchar(255),
	`bio` text,
	`google_id` varchar(255),
	`discord_id` varchar(255),
	`twitch_id` varchar(255),
	`steam_id` varchar(255),
	`email_verified` boolean NOT NULL DEFAULT false,
	`locale` varchar(8),
	`launcher_token_version` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`last_seen_at` timestamp,
	`deleted_at` timestamp,
	CONSTRAINT `boffmedia_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `boffmedia_users_username_unique` UNIQUE(`username`),
	CONSTRAINT `boffmedia_users_email_unique` UNIQUE(`email`),
	CONSTRAINT `boffmedia_users_google_id_unique` UNIQUE(`google_id`),
	CONSTRAINT `boffmedia_users_discord_id_unique` UNIQUE(`discord_id`),
	CONSTRAINT `boffmedia_users_twitch_id_unique` UNIQUE(`twitch_id`),
	CONSTRAINT `boffmedia_users_steam_id_unique` UNIQUE(`steam_id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_email_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`email` varchar(255) NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `boffmedia_email_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `boffmedia_password_reset_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`item_type` enum('achievement','medal') NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(255) NOT NULL,
	`max_progress` int NOT NULL DEFAULT 1,
	`points` int NOT NULL DEFAULT 0,
	`event_id` int,
	`category` enum('competition','challenge','participation','achievement') NOT NULL,
	`rarity` enum('bronze','silver','gold','platinum','diamond'),
	`hidden` boolean NOT NULL DEFAULT false,
	`order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `boffmedia_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_event_invites` (
	`code` varchar(32) NOT NULL,
	`event_id` int NOT NULL,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp,
	`max_uses` int NOT NULL DEFAULT 1,
	`uses` int NOT NULL DEFAULT 0,
	`revoked` boolean NOT NULL DEFAULT false,
	CONSTRAINT `boffmedia_event_invites_code` PRIMARY KEY(`code`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_event_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participant_id` int NOT NULL,
	`event_id` int NOT NULL,
	`status` enum('registered','confirmed','declined','removed') NOT NULL DEFAULT 'registered',
	`comment` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boffmedia_event_participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `ep_participant_event_uq` UNIQUE(`participant_id`,`event_id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_event_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposer_user_id` int,
	`title` varchar(255) NOT NULL,
	`game_name` varchar(255) NOT NULL,
	`type` varchar(64) NOT NULL,
	`description` text NOT NULL,
	`additional_info` text,
	`suggested_date` timestamp,
	`end_date` timestamp,
	`max_participants` int,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`review_note` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boffmedia_event_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_event_team_members` (
	`team_id` int NOT NULL,
	`participant_id` int NOT NULL,
	`role` enum('leader','member') NOT NULL DEFAULT 'member',
	`joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boffmedia_event_team_members_team_id_participant_id_pk` PRIMARY KEY(`team_id`,`participant_id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_event_teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` int,
	`name` varchar(255) NOT NULL,
	`tag` varchar(10),
	`icon` varchar(255),
	`total_score` int NOT NULL DEFAULT 0,
	`status` enum('active','disqualified','withdrew') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `boffmedia_event_teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parent_id` int,
	`title` varchar(255) NOT NULL,
	`game_id` int,
	`description` text,
	`icon` varchar(255) NOT NULL,
	`banner` varchar(255),
	`start_date` timestamp,
	`end_date` timestamp,
	`status` enum('upcoming','active','completed') NOT NULL DEFAULT 'upcoming',
	`visibility` enum('public','private') NOT NULL DEFAULT 'private',
	`type` enum('event','server') NOT NULL,
	`pack_id` varchar(32),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `boffmedia_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `boffmedia_games_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_participant_progress` (
	`participant_id` int NOT NULL,
	`achievement_id` int NOT NULL,
	`current_progress` int NOT NULL DEFAULT 0,
	`is_completed` boolean NOT NULL DEFAULT false,
	`completed_at` timestamp,
	`last_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `boffmedia_participant_progress_participant_id_achievement_id_pk` PRIMARY KEY(`participant_id`,`achievement_id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`nickname` varchar(32),
	`avatar` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boffmedia_participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `p_user_uq` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_forum_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(64) NOT NULL,
	`hue` int NOT NULL DEFAULT 28,
	`locked` boolean NOT NULL DEFAULT false,
	`position` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `boffmedia_forum_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `fc_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_forum_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`thread_id` int NOT NULL,
	`user_id` int NOT NULL,
	`body` text NOT NULL,
	`is_solution` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `boffmedia_forum_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_forum_threads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category_id` int NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`pinned` boolean NOT NULL DEFAULT false,
	`locked` boolean NOT NULL DEFAULT false,
	`solved` boolean NOT NULL DEFAULT false,
	`view_count` int NOT NULL DEFAULT 0,
	`reply_count` int NOT NULL DEFAULT 0,
	`vote_count` int NOT NULL DEFAULT 0,
	`last_post_at` timestamp,
	`last_post_user_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `boffmedia_forum_threads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_forum_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`thread_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `boffmedia_forum_votes_id` PRIMARY KEY(`id`),
	CONSTRAINT `fv_user_thread_uq` UNIQUE(`user_id`,`thread_id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`type` enum('event','achievement','tournament','system','forum') NOT NULL DEFAULT 'system',
	`title` varchar(255) NOT NULL,
	`body` text,
	`link` varchar(512),
	`read_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `boffmedia_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_tournament_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournament_id` int NOT NULL,
	`phase_id` int,
	`name` varchar(64) NOT NULL,
	`label` varchar(64),
	`advance_count` int NOT NULL DEFAULT 2,
	`order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `boffmedia_tournament_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_tournament_match_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`match_id` int NOT NULL,
	`author_user_id` int,
	`author_name` varchar(64),
	`kind` enum('sys','player','judge') NOT NULL DEFAULT 'player',
	`body` varchar(1000) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `boffmedia_tournament_match_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_tournament_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournament_id` int NOT NULL,
	`phase_id` int,
	`bracket` enum('winners','losers','grand','group','league','swiss','third') NOT NULL DEFAULT 'winners',
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
	`proposed_by_participant_id` int,
	`proposed_top_score` int,
	`proposed_bot_score` int,
	`proposed_games` varchar(16),
	`proposed_at` timestamp,
	`proposal_expires_at` timestamp,
	`proposal_state` enum('pending','disputed'),
	`judge_requested_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
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
	`teamsheet` text,
	`checked_in_at` timestamp,
	`status` enum('active','eliminated','withdrew','disqualified') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boffmedia_tournament_participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tp_user_uq` UNIQUE(`tournament_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_tournament_phase_entrants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phase_id` int NOT NULL,
	`participant_id` int NOT NULL,
	`seed` int NOT NULL,
	`source_rank` int,
	`source_record` varchar(16),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `boffmedia_tournament_phase_entrants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tpe_phase_participant_uq` UNIQUE(`phase_id`,`participant_id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_tournament_phases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournament_id` int NOT NULL,
	`phase_order` int NOT NULL DEFAULT 1,
	`name` varchar(128) NOT NULL,
	`format` enum('single','double','roundrobin','swiss','leaderboard','groups') NOT NULL,
	`status` enum('pending','live','completed') NOT NULL DEFAULT 'pending',
	`best_of` int,
	`finals_best_of` int,
	`rounds` int,
	`group_count` int,
	`third_place` boolean NOT NULL DEFAULT false,
	`carry_standings` boolean NOT NULL DEFAULT false,
	`advance_type` enum('all','top_n','record','top_or_record'),
	`advance_count` int,
	`advance_max_losses` int,
	`tiebreak_profile` enum('points','resistance') NOT NULL DEFAULT 'points',
	`start_date` timestamp,
	`end_date` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boffmedia_tournament_phases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_tournament_roster` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participant_id` int NOT NULL,
	`user_id` int,
	`name` varchar(255) NOT NULL,
	`role` varchar(32),
	`created_at` timestamp NOT NULL DEFAULT (now()),
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
	`auto_verify_minutes` int,
	`group_count` int,
	`advance_count` int,
	`description` text,
	`rules` text,
	`prizes` text,
	`check_in_open` boolean NOT NULL DEFAULT false,
	`banner` varchar(255),
	`icon` varchar(255),
	`hue` int,
	`start_date` timestamp,
	`end_date` timestamp,
	`champion_participant_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `boffmedia_tournaments_id` PRIMARY KEY(`id`),
	CONSTRAINT `boffmedia_tournaments_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `discord_quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`discord_id` varchar(32) NOT NULL,
	`server_id` varchar(32) NOT NULL,
	`quote` text NOT NULL,
	`comment` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discord_quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discord_users` (
	`user_id` varchar(32) NOT NULL,
	`username` varchar(32) NOT NULL,
	`avatar` varchar(255),
	`color` varchar(6),
	`tts_voice` varchar(32) DEFAULT 'Enrique',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discord_users_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_ficusai_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` char(36) NOT NULL,
	`content` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_ficusai_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `launcher_device_codes` (
	`device_code` char(64) NOT NULL,
	`user_code` varchar(16) NOT NULL,
	`user_id` int,
	`status` enum('pending','approved','denied') NOT NULL DEFAULT 'pending',
	`client_label` varchar(128),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	`consumed_at` timestamp,
	CONSTRAINT `launcher_device_codes_device_code` PRIMARY KEY(`device_code`),
	CONSTRAINT `launcher_device_codes_user_code_unique` UNIQUE(`user_code`)
);
--> statement-breakpoint
CREATE TABLE `launcher_releases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version` varchar(32) NOT NULL,
	`target` varchar(32) NOT NULL,
	`signature` text NOT NULL,
	`notes` text,
	`artifact_name` varchar(255) NOT NULL,
	`artifact_sha512` char(128) NOT NULL,
	`size_bytes` int unsigned NOT NULL,
	`published` boolean NOT NULL DEFAULT false,
	`published_at` timestamp,
	`uploaded_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `launcher_releases_id` PRIMARY KEY(`id`),
	CONSTRAINT `launcher_releases_version_target_uq` UNIQUE(`version`,`target`)
);
--> statement-breakpoint
CREATE TABLE `pack_acl` (
	`pack_id` varchar(32) NOT NULL,
	`uuid` char(36) NOT NULL,
	`granted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`granted_by` int,
	`via_invite` varchar(32),
	CONSTRAINT `pack_acl_pack_id_uuid_pk` PRIMARY KEY(`pack_id`,`uuid`)
);
--> statement-breakpoint
CREATE TABLE `pack_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pack_id` varchar(32),
	`user_id` int,
	`uuid` char(36),
	`action` varchar(32) NOT NULL,
	`meta` json,
	`at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `pack_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pack_grants` (
	`pack_id` varchar(32) NOT NULL,
	`user_id` int NOT NULL,
	`source` enum('admin','invite') NOT NULL DEFAULT 'admin',
	`source_ref` varchar(32),
	`granted_by` int,
	`granted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `pack_grants_pack_id_user_id_source_pk` PRIMARY KEY(`pack_id`,`user_id`,`source`)
);
--> statement-breakpoint
CREATE TABLE `pack_invites` (
	`code` varchar(32) NOT NULL,
	`pack_id` varchar(32) NOT NULL,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp,
	`max_uses` int NOT NULL DEFAULT 1,
	`uses` int NOT NULL DEFAULT 0,
	`revoked` boolean NOT NULL DEFAULT false,
	CONSTRAINT `pack_invites_code` PRIMARY KEY(`code`)
);
--> statement-breakpoint
CREATE TABLE `pack_versions` (
	`id` varchar(32) NOT NULL,
	`pack_id` varchar(32) NOT NULL,
	`name` varchar(64) NOT NULL,
	`minecraft` varchar(32),
	`loader` enum('forge','neoforge','fabric-loader','quilt-loader'),
	`loader_version` varchar(64),
	`files` json NOT NULL,
	`worlds` json,
	`emulator` json,
	`zomboid` json,
	`stardew` json,
	`initial_files` json,
	`published` boolean NOT NULL DEFAULT false,
	`notes` text,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pack_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `packs` (
	`id` varchar(32) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`game_type` enum('minecraft','emulator','zomboid','stardew') NOT NULL DEFAULT 'minecraft',
	`name` varchar(128) NOT NULL,
	`summary` varchar(512),
	`icon_url` varchar(512),
	`description` text,
	`gallery` json,
	`server` json,
	`access_kind` enum('public','password','allowlist') NOT NULL DEFAULT 'allowlist',
	`password_hash` varchar(255),
	`latest_version_id` varchar(32),
	`archived` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `packs_id` PRIMARY KEY(`id`),
	CONSTRAINT `packs_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `tools_randomizer_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`config_id` int NOT NULL,
	`boffmedia_user_id` int NOT NULL,
	`mc_uuid` char(36),
	`seed` bigint NOT NULL,
	`status` enum('claimed','patched','verified') NOT NULL DEFAULT 'claimed',
	`output_sha512` char(128),
	`log_blob_sha512` char(128),
	`claimed_at` timestamp DEFAULT (now()),
	`patched_at` timestamp,
	`verified_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tools_randomizer_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `rass_config_user_uq` UNIQUE(`config_id`,`boffmedia_user_id`)
);
--> statement-breakpoint
CREATE TABLE `tools_randomizer_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`config_id` int,
	`assignment_id` int,
	`action` varchar(32) NOT NULL,
	`actor` varchar(64),
	`meta` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tools_randomizer_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tools_randomizer_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` int NOT NULL,
	`game_platform` varchar(8) NOT NULL,
	`game_title` varchar(64) NOT NULL,
	`settings_blob_sha512` char(128) NOT NULL,
	`fvx_jar_sha512` char(128) NOT NULL,
	`clean_rom_sha512` char(128) NOT NULL,
	`rom_id` int,
	`rom_hint` varchar(255),
	`status` enum('draft','open','closed','published') NOT NULL DEFAULT 'draft',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tools_randomizer_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `tools_randomizer_configs_event_id_unique` UNIQUE(`event_id`)
);
--> statement-breakpoint
CREATE TABLE `tools_randomizer_presets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`game_scope` varchar(32),
	`settings_json` json NOT NULL,
	`rnqs_blob_sha512` char(128),
	`updated_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tools_randomizer_presets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tools_randomizer_roms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`game_platform` varchar(8) NOT NULL,
	`sha512` char(128) NOT NULL,
	`file_size` bigint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tools_randomizer_roms_id` PRIMARY KEY(`id`),
	CONSTRAINT `rr_sha512_uq` UNIQUE(`sha512`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_sharex_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`app` varchar(32) NOT NULL,
	`name` char(10) NOT NULL,
	`extension` varchar(4) NOT NULL,
	`key` char(32) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `boffmedia_sharex_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_achievements` (
	`id` varchar(32) NOT NULL,
	`name` varchar(64) NOT NULL,
	`description` varchar(255) NOT NULL,
	`icon` varchar(255),
	`category` varchar(32) NOT NULL,
	`subcategory` varchar(32),
	`target` int DEFAULT 1,
	`order` int DEFAULT 0,
	`points` int DEFAULT 10,
	`tier` varchar(16) DEFAULT 'bronce',
	CONSTRAINT `rotom_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_apps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(32) NOT NULL,
	`url` varchar(255),
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `rotom_apps_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_apps_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `rotom_arcade_streaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` char(36) NOT NULL,
	`last_claimed` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`last_banner` varchar(100),
	`streak` int NOT NULL DEFAULT 0,
	`total_claims` int NOT NULL DEFAULT 0,
	CONSTRAINT `rotom_arcade_streaks_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_arcade_streaks_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `rotom_arceuspeak` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(32) NOT NULL,
	`value` varchar(32) NOT NULL,
	`format` varchar(32) NOT NULL,
	CONSTRAINT `rotom_arceuspeak_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` char(36) NOT NULL,
	`item_id` varchar(256) NOT NULL,
	`item_data` varchar(512),
	`item_type` varchar(32) NOT NULL,
	`amount` int DEFAULT 1,
	`source_type` varchar(32),
	`used` int DEFAULT 0,
	`rarity` varchar(20) DEFAULT 'common',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`reservation_id` varchar(36),
	`reserved_at` timestamp,
	CONSTRAINT `rotom_inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_uuid` char(36) NOT NULL,
	`type` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`link` varchar(512),
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_replays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`side1` varchar(36) NOT NULL,
	`side2` varchar(36) NOT NULL,
	`team1` text,
	`team2` text,
	`replay` text NOT NULL,
	`winner` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_replays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_user_achievements` (
	`achievement_id` varchar(32) NOT NULL,
	`uuid` char(36) NOT NULL,
	`progress` int DEFAULT 0,
	`completed` int DEFAULT 0,
	`completed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP,
	`data_id` int DEFAULT 0,
	CONSTRAINT `rotom_user_achievements_achievement_id_uuid_pk` PRIMARY KEY(`achievement_id`,`uuid`)
);
--> statement-breakpoint
CREATE TABLE `rotom_user_apps` (
	`uuid` char(36) NOT NULL,
	`app_id` int NOT NULL,
	`order` int DEFAULT 999,
	CONSTRAINT `rotom_user_apps_uuid_app_id_pk` PRIMARY KEY(`uuid`,`app_id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_user_replays` (
	`uuid` char(36) NOT NULL,
	`replay_id` int NOT NULL,
	`side` int DEFAULT 1,
	CONSTRAINT `rotom_user_replays_uuid_replay_id_pk` PRIMARY KEY(`uuid`,`replay_id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` char(36) NOT NULL,
	`username` varchar(32) NOT NULL,
	`world` varchar(36),
	`energy` int DEFAULT 10,
	`last_charge` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_users_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `rotom_chat_members` (
	`chat_id` int NOT NULL,
	`uuid` char(36) NOT NULL,
	`pinned` boolean NOT NULL DEFAULT false,
	`muted` boolean NOT NULL DEFAULT false,
	CONSTRAINT `rotom_chat_members_chat_id_uuid_pk` PRIMARY KEY(`chat_id`,`uuid`)
);
--> statement-breakpoint
CREATE TABLE `rotom_chat_message_reactions` (
	`message_id` int NOT NULL,
	`uuid` char(36) NOT NULL,
	`emoji` varchar(32) NOT NULL,
	CONSTRAINT `rotom_chat_message_reactions_message_id_uuid_emoji_pk` PRIMARY KEY(`message_id`,`uuid`,`emoji`)
);
--> statement-breakpoint
CREATE TABLE `rotom_chat_message_reads` (
	`message_id` int NOT NULL,
	`uuid` char(36) NOT NULL,
	CONSTRAINT `rotom_chat_message_reads_message_id_uuid_pk` PRIMARY KEY(`message_id`,`uuid`)
);
--> statement-breakpoint
CREATE TABLE `rotom_chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chat_id` int NOT NULL,
	`sender_uuid` char(36) NOT NULL,
	`content` text NOT NULL,
	`type` varchar(255) DEFAULT 'text',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_chats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` varchar(255) NOT NULL,
	`image` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_chats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` int NOT NULL,
	`content` text NOT NULL,
	`public` boolean NOT NULL DEFAULT false,
	`pinned` boolean NOT NULL DEFAULT false,
	`folder_id` int,
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_news` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` varchar(255),
	`category` varchar(255),
	`subcategory` varchar(255),
	`published` boolean NOT NULL DEFAULT false,
	`featured` boolean NOT NULL DEFAULT false,
	`content` text NOT NULL,
	`button_text` varchar(255),
	`image_url` varchar(255),
	`author` varchar(255),
	`author_role` varchar(255),
	`issue` int,
	`claps` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_news_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_news_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`news_id` int NOT NULL,
	`uuid` char(36) NOT NULL,
	`body` varchar(500) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_news_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_newsletter_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_newsletter_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_newsletter_subscribers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `rotom_note_folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`color` varchar(32) NOT NULL DEFAULT 'primary',
	`parent_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_note_folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_note_tag_links` (
	`document_id` int NOT NULL,
	`tag_id` int NOT NULL,
	CONSTRAINT `rotom_note_tag_links_document_id_tag_id_pk` PRIMARY KEY(`document_id`,`tag_id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_note_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` char(36) NOT NULL,
	`label` varchar(64) NOT NULL,
	`color` varchar(32) NOT NULL DEFAULT 'primary',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_note_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_note_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`document_id` int NOT NULL,
	`label` varchar(255),
	`content` text NOT NULL,
	`author_uuid` char(36),
	`words` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_note_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_user_documents` (
	`uuid` char(36) NOT NULL,
	`document_id` int NOT NULL,
	CONSTRAINT `rotom_user_documents_uuid_document_id_pk` PRIMARY KEY(`uuid`,`document_id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_dungeon_run_players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`run_id` int NOT NULL,
	`uuid` char(36) NOT NULL,
	`nombre` varchar(32) NOT NULL,
	`muertes` int NOT NULL DEFAULT 0,
	`abandono` boolean NOT NULL DEFAULT false,
	CONSTRAINT `rotom_dungeon_run_players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_dungeon_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`server` varchar(64),
	`semilla` varchar(64) NOT NULL,
	`etapa_inicial` int NOT NULL,
	`etapa_final` int NOT NULL,
	`pisos_superados` int NOT NULL,
	`completada` boolean NOT NULL,
	`duracion_ms` bigint NOT NULL,
	`maldiciones` json NOT NULL,
	`monedas_ganadas` int NOT NULL,
	`monedas_gastadas` int NOT NULL,
	`monedas_convertidas` int NOT NULL,
	`fecha` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_dungeon_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_anuncios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` varchar(16) NOT NULL DEFAULT 'anuncio',
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`town` varchar(64),
	`author_uuid` char(36) NOT NULL,
	`pinned` boolean NOT NULL DEFAULT false,
	`audience` varchar(16) NOT NULL DEFAULT 'public',
	`published_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_gobierno_anuncios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_apelaciones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`multa_id` int NOT NULL,
	`player_uuid` char(36) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'pending',
	`grounds` text NOT NULL,
	`reviewer_uuid` char(36),
	`decision` text,
	`resolved_at` timestamp,
	`refund_tx_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_gobierno_apelaciones_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_gobierno_apelaciones_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_auditoria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actor_uuid` char(36) NOT NULL,
	`action` varchar(32) NOT NULL,
	`target` varchar(255) NOT NULL,
	`dep` varchar(32) NOT NULL,
	`source` varchar(16) NOT NULL DEFAULT 'gobierno',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_gobierno_auditoria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_bitacora` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patrulla_id` int,
	`uuid` char(36) NOT NULL,
	`text` text NOT NULL,
	`tone` varchar(16) NOT NULL DEFAULT 'info',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_gobierno_bitacora_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_buscados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`player_uuid` char(36) NOT NULL,
	`severity` varchar(16) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'active',
	`bounty` bigint NOT NULL DEFAULT 0,
	`offense` varchar(255) NOT NULL,
	`reported_by_uuid` char(36) NOT NULL,
	`last_seen` varchar(128),
	`notes` text,
	`captured_by_uuid` char(36),
	`captured_at` timestamp,
	`payout_tx_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_gobierno_buscados_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_gobierno_buscados_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_carteles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`highway` varchar(64) NOT NULL,
	`destinations` json,
	`created_by_uuid` char(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_gobierno_carteles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_denuncias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`town` varchar(64),
	`plot_number` int,
	`accused_uuid` char(36),
	`reporter_uuid` char(36) NOT NULL,
	`category` varchar(32) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'pending',
	`description` text NOT NULL,
	`resolution` text,
	`resolved_by_uuid` char(36),
	`resolved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_gobierno_denuncias_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_gobierno_denuncias_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_evento_capturas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evento_id` int NOT NULL,
	`uuid` char(36) NOT NULL,
	`species` varchar(64) NOT NULL,
	`level` int NOT NULL,
	`ivs_total` int NOT NULL,
	`shiny` tinyint NOT NULL DEFAULT 0,
	`size` decimal(6,2),
	`score` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_gobierno_evento_capturas_id` PRIMARY KEY(`id`),
	CONSTRAINT `gob_capturas_evento_uuid_uq` UNIQUE(`evento_id`,`uuid`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_evento_especies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evento_id` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`rarity` varchar(32) NOT NULL,
	`rarity_pts` int NOT NULL DEFAULT 0,
	`spawn_pct` decimal(5,2) NOT NULL DEFAULT '0',
	`shiny_pct` decimal(5,2) NOT NULL DEFAULT '0',
	`lvl_min` int NOT NULL DEFAULT 1,
	`lvl_max` int NOT NULL DEFAULT 100,
	CONSTRAINT `rotom_gobierno_evento_especies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_evento_obras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evento_id` int NOT NULL,
	`town` varchar(64) NOT NULL,
	`build_name` varchar(255) NOT NULL,
	`description` text,
	`builders` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_gobierno_evento_obras_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_evento_votos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`obra_id` int NOT NULL,
	`voter_uuid` char(36) NOT NULL,
	`diseno` int NOT NULL,
	`ambicion` int NOT NULL,
	`fidelidad` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_gobierno_evento_votos_id` PRIMARY KEY(`id`),
	CONSTRAINT `gob_votos_obra_voter_uq` UNIQUE(`obra_id`,`voter_uuid`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_eventos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`type` varchar(16) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'upcoming',
	`title` varchar(255) NOT NULL,
	`brief` text,
	`prize` varchar(255),
	`crew` varchar(128),
	`build_closed_at` timestamp,
	`rating_opens_at` timestamp,
	`rating_closes_at` timestamp,
	`winner_town` varchar(64),
	`zone` varchar(128),
	`coords_x` int,
	`coords_z` int,
	`radius` int,
	`opens_at` timestamp,
	`closes_at` timestamp,
	`rules` text,
	`weights` json,
	`created_by_uuid` char(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_gobierno_eventos_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_gobierno_eventos_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_expediente_eventos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expediente_id` int NOT NULL,
	`kind` varchar(16) NOT NULL,
	`ref` varchar(32),
	`text` text NOT NULL,
	`at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_gobierno_expediente_eventos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_expedientes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`title` varchar(255) NOT NULL,
	`subject_uuid` char(36) NOT NULL,
	`dep` varchar(32) NOT NULL DEFAULT 'justicia',
	`status` varchar(16) NOT NULL DEFAULT 'open',
	`severity` varchar(16) NOT NULL DEFAULT 'medium',
	`lead_uuid` char(36) NOT NULL,
	`opened_at` timestamp NOT NULL DEFAULT (now()),
	`closed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_gobierno_expedientes_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_gobierno_expedientes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_megafonia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`speaker` varchar(64) NOT NULL,
	`text` text NOT NULL,
	`by_uuid` char(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_gobierno_megafonia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_multas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`player_uuid` char(36) NOT NULL,
	`amount` bigint NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'pending',
	`reason` varchar(255) NOT NULL,
	`issued_by_uuid` char(36) NOT NULL,
	`denuncia_id` int,
	`paid_tx_id` int,
	`paid_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_gobierno_multas_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_gobierno_multas_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_npc_skins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`skin` varchar(64) NOT NULL,
	`npcs` json,
	`src` tinyint NOT NULL DEFAULT 0,
	`face` tinyint NOT NULL DEFAULT 0,
	`head` tinyint NOT NULL DEFAULT 0,
	`body` tinyint NOT NULL DEFAULT 0,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_gobierno_npc_skins_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_gobierno_npc_skins_skin_unique` UNIQUE(`skin`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_parcela_historial` (
	`id` int AUTO_INCREMENT NOT NULL,
	`region_id` varchar(128) NOT NULL,
	`town` varchar(64) NOT NULL,
	`number` int NOT NULL,
	`previous_owner_uuid` char(36),
	`new_owner_uuid` char(36),
	`reason` varchar(255),
	`changed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_gobierno_parcela_historial_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_parcelas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`region_id` varchar(128) NOT NULL,
	`town` varchar(64) NOT NULL,
	`number` int NOT NULL,
	`zona_id` int,
	`status` varchar(16) NOT NULL DEFAULT 'ocupada',
	`tax_amount` bigint NOT NULL DEFAULT 500,
	`tax_due_at` timestamp,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_gobierno_parcelas_id` PRIMARY KEY(`id`),
	CONSTRAINT `gob_parcelas_region_uq` UNIQUE(`region_id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_patrulla_oficiales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patrulla_id` int NOT NULL,
	`uuid` char(36) NOT NULL,
	CONSTRAINT `rotom_gobierno_patrulla_oficiales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_patrullas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`label` varchar(64) NOT NULL,
	`from_time` varchar(8) NOT NULL,
	`to_time` varchar(8) NOT NULL,
	`zone` varchar(128),
	`status` varchar(16) NOT NULL DEFAULT 'rest',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_gobierno_patrullas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_pujas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subasta_id` int NOT NULL,
	`uuid` char(36) NOT NULL,
	`amount` bigint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_gobierno_pujas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_subastas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`region_id` varchar(128) NOT NULL,
	`town` varchar(64) NOT NULL,
	`number` int NOT NULL,
	`start_bid` bigint NOT NULL,
	`current_bid` bigint NOT NULL,
	`bidder_uuid` char(36),
	`bids` int NOT NULL DEFAULT 0,
	`reason` varchar(255),
	`status` varchar(16) NOT NULL DEFAULT 'live',
	`ends_at` timestamp NOT NULL,
	`settled_tx_id` int,
	`created_by_uuid` char(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_gobierno_subastas_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_gobierno_subastas_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_tasas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`concept` varchar(128) NOT NULL,
	`kind` varchar(32) NOT NULL,
	`rate` varchar(64) NOT NULL,
	`amount` bigint NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_gobierno_tasas_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_gobierno_tasas_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `rotom_gobierno_zonas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`town` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`kind` varchar(32) NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_gobierno_zonas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_kart_race_players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`race_id` int NOT NULL,
	`uuid` char(36) NOT NULL,
	`nombre` varchar(32) NOT NULL,
	`posicion` int NOT NULL,
	`tiempo_ms` int NOT NULL,
	`mejor_vuelta_ms` int NOT NULL,
	`vueltas_completadas` int NOT NULL DEFAULT 0,
	`dnf` boolean NOT NULL DEFAULT false,
	CONSTRAINT `rotom_kart_race_players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_kart_races` (
	`id` int AUTO_INCREMENT NOT NULL,
	`server` varchar(64),
	`circuito` varchar(128) NOT NULL,
	`modo` varchar(32) NOT NULL,
	`vueltas` int NOT NULL,
	`fecha` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_kart_races_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_mine_game_rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`game_id` int NOT NULL,
	`reward_id` int NOT NULL,
	`value` int NOT NULL,
	CONSTRAINT `rotom_mine_game_rewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_mine_games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` char(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_mine_games_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_mine_rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`value` int NOT NULL,
	`name` varchar(32) NOT NULL,
	`type` varchar(32) NOT NULL,
	`item_id` varchar(32) NOT NULL,
	`width` int NOT NULL,
	`height` int NOT NULL,
	CONSTRAINT `rotom_mine_rewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_pasaporte_profiles` (
	`uuid` char(36) NOT NULL,
	`trainer_id` varchar(16) NOT NULL,
	`region` varchar(32) NOT NULL DEFAULT 'Fukitsu',
	`member_since` timestamp DEFAULT CURRENT_TIMESTAMP(),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_pasaporte_profiles_uuid` PRIMARY KEY(`uuid`),
	CONSTRAINT `rotom_pasaporte_profiles_trainer_id_unique` UNIQUE(`trainer_id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_pasaporte_seasons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`starts_at` timestamp NOT NULL,
	`ends_at` timestamp NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `rotom_pasaporte_seasons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_pc_marks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_uuid` char(36) NOT NULL,
	`pokemon_key` varchar(64) NOT NULL,
	`favorite` boolean NOT NULL DEFAULT false,
	`tags` json NOT NULL DEFAULT ('[]'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_pc_marks_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_pc_marks_user_key_uq` UNIQUE(`user_uuid`,`pokemon_key`)
);
--> statement-breakpoint
CREATE TABLE `rotom_pokedex` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` char(36) NOT NULL,
	`pokemon_id` int NOT NULL,
	`form_id` varchar(32) NOT NULL,
	`palette_id` varchar(32) NOT NULL,
	`seen_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	`caught_at` timestamp,
	CONSTRAINT `rotom_pokedex_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_pokedex_entry_uq` UNIQUE(`uuid`,`pokemon_id`,`form_id`,`palette_id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_rooker_bookmarks` (
	`post_id` int NOT NULL,
	`uuid` char(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_rooker_bookmarks_post_id_uuid_pk` PRIMARY KEY(`post_id`,`uuid`)
);
--> statement-breakpoint
CREATE TABLE `rotom_rooker_follows` (
	`follower_uuid` char(36) NOT NULL,
	`followee_uuid` char(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_rooker_follows_follower_uuid_followee_uuid_pk` PRIMARY KEY(`follower_uuid`,`followee_uuid`)
);
--> statement-breakpoint
CREATE TABLE `rotom_rooker_hashtags` (
	`post_id` int NOT NULL,
	`tag` varchar(64) NOT NULL,
	CONSTRAINT `rotom_rooker_hashtags_post_id_tag_pk` PRIMARY KEY(`post_id`,`tag`)
);
--> statement-breakpoint
CREATE TABLE `rotom_rooker_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` char(36) NOT NULL,
	`text` varchar(280),
	`type` varchar(16) NOT NULL DEFAULT 'text',
	`parent_id` int,
	`pinned` boolean NOT NULL DEFAULT false,
	`media_url` varchar(512),
	`capture_id` int,
	`replay_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_rooker_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_rooker_profiles` (
	`uuid` char(36) NOT NULL,
	`handle` varchar(32) NOT NULL,
	`display_name` varchar(48),
	`bio` varchar(280),
	`link` varchar(120),
	`partner_pokemon_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_rooker_profiles_uuid` PRIMARY KEY(`uuid`),
	CONSTRAINT `rotom_rooker_profiles_handle_unique` UNIQUE(`handle`)
);
--> statement-breakpoint
CREATE TABLE `rotom_rooker_reactions` (
	`post_id` int NOT NULL,
	`uuid` char(36) NOT NULL,
	`type` varchar(12) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_rooker_reactions_post_id_uuid_pk` PRIMARY KEY(`post_id`,`uuid`)
);
--> statement-breakpoint
CREATE TABLE `rotom_rooker_retrinos` (
	`post_id` int NOT NULL,
	`uuid` char(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_rooker_retrinos_post_id_uuid_pk` PRIMARY KEY(`post_id`,`uuid`)
);
--> statement-breakpoint
CREATE TABLE `rotom_starbank_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(32) NOT NULL,
	`balance` bigint NOT NULL DEFAULT 0,
	`type` enum('MAIN','SECONDARY','SYSTEM','GOVERNMENT','MARKET','SERVICE') NOT NULL,
	`image` varchar(255),
	CONSTRAINT `rotom_starbank_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `starbank_accounts_type_name_uq` UNIQUE(`type`,`name`)
);
--> statement-breakpoint
CREATE TABLE `rotom_starbank_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`from_account_id` int NOT NULL,
	`to_account_id` int NOT NULL,
	`amount` bigint NOT NULL,
	`from_balance` bigint NOT NULL,
	`to_balance` bigint NOT NULL,
	`reason` varchar(255) NOT NULL,
	`type` varchar(32) NOT NULL,
	`date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_starbank_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_starbank_user_accounts` (
	`uuid` char(36) NOT NULL,
	`account_id` int NOT NULL,
	CONSTRAINT `rotom_starbank_user_accounts_uuid_account_id_pk` PRIMARY KEY(`uuid`,`account_id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_wigglypop_bids` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listing_id` int NOT NULL,
	`bidder_uuid` char(36) NOT NULL,
	`amount` bigint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_wigglypop_bids_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_wigglypop_catalog_items` (
	`id` varchar(128) NOT NULL,
	`name` varchar(128) NOT NULL,
	`category` varchar(32) NOT NULL DEFAULT 'otros',
	`ref_price` bigint NOT NULL DEFAULT 0,
	`sprite` varchar(255),
	CONSTRAINT `rotom_wigglypop_catalog_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_wigglypop_listing_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listing_id` int NOT NULL,
	`item_id` varchar(128) NOT NULL,
	`item_name` varchar(128) NOT NULL,
	`category` varchar(32),
	`qty` int NOT NULL DEFAULT 1,
	`unit_price` bigint NOT NULL DEFAULT 0,
	CONSTRAINT `rotom_wigglypop_listing_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_wigglypop_listing_mons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listing_id` int NOT NULL,
	`pokemon_key` varchar(64) NOT NULL,
	`source_box` int NOT NULL,
	`source_index` int NOT NULL,
	`dex` int NOT NULL,
	`species` varchar(64) NOT NULL,
	`form` varchar(64),
	`palette` varchar(64),
	`name` varchar(64),
	`level` int NOT NULL DEFAULT 1,
	`nature` varchar(32),
	`ability` varchar(64),
	`gender` varchar(16),
	`held_item` varchar(128),
	`ball` varchar(64),
	`ot` varchar(64),
	`caught_in` varchar(128),
	`ivs` json,
	`evs` json,
	`stats` json,
	`moves` json,
	`rarity` varchar(16) NOT NULL DEFAULT 'comun',
	`legendary` boolean NOT NULL DEFAULT false,
	`shiny` boolean NOT NULL DEFAULT false,
	`value` bigint NOT NULL DEFAULT 0,
	CONSTRAINT `rotom_wigglypop_listing_mons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_wigglypop_listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(24) NOT NULL,
	`seller_uuid` char(36) NOT NULL,
	`kind` varchar(16) NOT NULL,
	`format` varchar(16) NOT NULL DEFAULT 'fixed',
	`title` varchar(255) NOT NULL,
	`note` text,
	`status` varchar(16) NOT NULL DEFAULT 'activo',
	`price` bigint NOT NULL DEFAULT 0,
	`value` bigint NOT NULL DEFAULT 0,
	`escrow` boolean NOT NULL DEFAULT true,
	`views` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`sold_at` timestamp,
	`sold_for` bigint,
	`sold_order_id` int,
	`starts_at` timestamp,
	`ends_at` timestamp,
	`current_bid` bigint NOT NULL DEFAULT 0,
	`bids` int NOT NULL DEFAULT 0,
	`min_increment` bigint NOT NULL DEFAULT 50,
	`buy_now` bigint,
	`wants` json,
	`trade_plus` boolean NOT NULL DEFAULT false,
	CONSTRAINT `rotom_wigglypop_listings_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_wigglypop_listings_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `rotom_wigglypop_offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listing_id` int NOT NULL,
	`buyer_uuid` char(36) NOT NULL,
	`amount` bigint NOT NULL,
	`qty` int NOT NULL DEFAULT 1,
	`status` varchar(16) NOT NULL DEFAULT 'pendiente',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`responded_at` timestamp,
	CONSTRAINT `rotom_wigglypop_offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_wigglypop_order_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`listing_id` int NOT NULL,
	`seller_uuid` char(36) NOT NULL,
	`kind` varchar(16) NOT NULL,
	`qty` int NOT NULL DEFAULT 1,
	`unit_price` bigint NOT NULL DEFAULT 0,
	`line_total` bigint NOT NULL DEFAULT 0,
	`delivery_status` varchar(16) NOT NULL DEFAULT 'pendiente',
	`settle_tx_id` int,
	`taken_payload` json,
	`confirmed_at` timestamp,
	CONSTRAINT `rotom_wigglypop_order_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_wigglypop_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(24) NOT NULL,
	`buyer_uuid` char(36) NOT NULL,
	`subtotal` bigint NOT NULL DEFAULT 0,
	`fee` bigint NOT NULL DEFAULT 0,
	`total` bigint NOT NULL DEFAULT 0,
	`status` varchar(16) NOT NULL DEFAULT 'escrow',
	`escrow_tx_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotom_wigglypop_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_wigglypop_orders_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `rotom_wigglypop_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`reviewer_uuid` char(36) NOT NULL,
	`seller_uuid` char(36) NOT NULL,
	`rating` tinyint NOT NULL,
	`body` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_wigglypop_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `wp_reviews_order_reviewer_uq` UNIQUE(`order_id`,`reviewer_uuid`)
);
--> statement-breakpoint
CREATE TABLE `rotom_wigglypop_trade_offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listing_id` int NOT NULL,
	`proposer_uuid` char(36) NOT NULL,
	`offered_pokemon_key` varchar(64) NOT NULL,
	`offered_snapshot` json,
	`status` varchar(16) NOT NULL DEFAULT 'pendiente',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`responded_at` timestamp,
	CONSTRAINT `rotom_wigglypop_trade_offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_wigglypop_watchlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_uuid` char(36) NOT NULL,
	`listing_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rotom_wigglypop_watchlist_id` PRIMARY KEY(`id`),
	CONSTRAINT `wp_watch_user_listing_uq` UNIQUE(`user_uuid`,`listing_id`)
);
--> statement-breakpoint
CREATE TABLE `tools_tcg_cards` (
	`id` varchar(32) NOT NULL,
	`set_id` varchar(32) NOT NULL,
	`local_id` varchar(16),
	`name_en` varchar(128) NOT NULL,
	`name_es` varchar(128) NOT NULL,
	`image_local_en` varchar(255),
	`image_local_es` varchar(255),
	`category` varchar(64),
	`illustrator` varchar(128),
	`rarity` varchar(64),
	`hp` int,
	`stage` varchar(32),
	`description_en` varchar(1024),
	`description_es` varchar(1024),
	`updated` timestamp,
	`types` varchar(255),
	`weaknesses` varchar(512),
	`attacks` text,
	`boosters` varchar(512),
	`variants` varchar(255),
	`legal` varchar(100),
	`retreat` int,
	CONSTRAINT `tools_tcg_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tools_tcg_series` (
	`id` varchar(32) NOT NULL,
	`name_en` varchar(64) NOT NULL,
	`name_es` varchar(64) NOT NULL,
	`logo` varchar(255),
	CONSTRAINT `tools_tcg_series_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tools_tcg_sets` (
	`id` varchar(32) NOT NULL,
	`series_id` varchar(32) NOT NULL,
	`name_en` varchar(128) NOT NULL,
	`name_es` varchar(128) NOT NULL,
	`logo` varchar(255),
	`symbol` varchar(255),
	`card_count_official` int,
	`card_count_total` int,
	CONSTRAINT `tools_tcg_sets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tools_tcg_user_card_history` (
	`id` varchar(32) NOT NULL,
	`user_id` int NOT NULL,
	`card_id` varchar(32) NOT NULL,
	`quantity_change` int NOT NULL,
	`date` timestamp NOT NULL,
	CONSTRAINT `tools_tcg_user_card_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tools_tcg_user_cards` (
	`id` varchar(32) NOT NULL,
	`user_id` int NOT NULL,
	`card_id` varchar(32) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`acquired_date` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tools_tcg_user_cards_id` PRIMARY KEY(`id`),
	CONSTRAINT `tools_tcg_user_cards_user_card_uq` UNIQUE(`user_id`,`card_id`)
);
--> statement-breakpoint
CREATE TABLE `tools_vgc_limitless_teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournament_id` int,
	`player_slug` varchar(128) NOT NULL,
	`player_name` varchar(128),
	`placing` int,
	`record` varchar(16),
	`paste_id` int,
	`fetched_at` timestamp NOT NULL,
	CONSTRAINT `tools_vgc_limitless_teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tools_vgc_limitless_tournaments` (
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
	`fetched_at` timestamp NOT NULL,
	CONSTRAINT `tools_vgc_limitless_tournaments_id` PRIMARY KEY(`id`),
	CONSTRAINT `tools_vgc_limitless_tournaments_limitless_id_unique` UNIQUE(`limitless_id`)
);
--> statement-breakpoint
CREATE TABLE `tools_vgc_pastes_repository` (
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
	`has_evs` varchar(4),
	`source_url` varchar(512),
	`owner` varchar(128),
	`fetched_at` timestamp NOT NULL,
	CONSTRAINT `tools_vgc_pastes_repository_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tools_vgc_pokepastes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pokepaste_id` varchar(32),
	`source_key` varchar(255),
	`raw_text` text NOT NULL,
	`parsed_slots` text NOT NULL,
	`author` varchar(128),
	`title` varchar(255),
	`format_id` varchar(64),
	`replica_code` varchar(20),
	`fetched_at` timestamp NOT NULL,
	CONSTRAINT `tools_vgc_pokepastes_id` PRIMARY KEY(`id`),
	CONSTRAINT `tools_vgc_pokepastes_pokepaste_id_unique` UNIQUE(`pokepaste_id`),
	CONSTRAINT `tools_vgc_pokepastes_source_key_unique` UNIQUE(`source_key`)
);
--> statement-breakpoint
CREATE TABLE `tools_vgc_regulations` (
	`id` varchar(64) NOT NULL,
	`format_id` varchar(128) NOT NULL,
	`name` varchar(255) NOT NULL,
	`game_type` varchar(16) NOT NULL DEFAULT 'doubles',
	`vgcpastes_gid` varchar(32),
	`import_status` varchar(16) NOT NULL DEFAULT 'idle',
	`import_error` text,
	`import_team_count` int NOT NULL DEFAULT 0,
	`import_fetched_count` int NOT NULL DEFAULT 0,
	`import_started_at` timestamp,
	`import_completed_at` timestamp,
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tools_vgc_regulations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tools_vgc_smogon_pokemon` (
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
	`fetched_at` timestamp NOT NULL,
	CONSTRAINT `tools_vgc_smogon_pokemon_id` PRIMARY KEY(`id`),
	CONSTRAINT `tools_vgc_smogon_pokemon_uq` UNIQUE(`format_id`,`month`,`cutoff`,`species_id`)
);
--> statement-breakpoint
CREATE TABLE `tools_vgc_smogon_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`format_id` varchar(64) NOT NULL,
	`month` varchar(7) NOT NULL,
	`cutoff` int NOT NULL,
	`pokemon_count` int NOT NULL DEFAULT 0,
	`fetched_at` timestamp NOT NULL,
	CONSTRAINT `tools_vgc_smogon_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `tools_vgc_smogon_format_month_cutoff_uq` UNIQUE(`format_id`,`month`,`cutoff`)
);
--> statement-breakpoint
CREATE TABLE `tools_vgc_matches` (
	`id` varchar(36) NOT NULL,
	`session_id` varchar(36),
	`user_id` int,
	`format` enum('BO1','BO3') NOT NULL DEFAULT 'BO1',
	`my_team` text NOT NULL,
	`opponent_team` text NOT NULL,
	`opponent_name` varchar(128),
	`opponent_archetype` varchar(128),
	`result` enum('win','loss','draw'),
	`outcome_tag` varchar(32),
	`turn_count` int,
	`elo_after` double,
	`opponent_elo` double,
	`notes` text NOT NULL DEFAULT ('[]'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tools_vgc_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tools_vgc_series` (
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
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tools_vgc_series_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tools_vgc_sessions` (
	`id` varchar(36) NOT NULL,
	`user_id` int,
	`label` varchar(128) NOT NULL,
	`format` enum('BO1','BO3') NOT NULL DEFAULT 'BO1',
	`regulation_id` varchar(64) NOT NULL,
	`type` varchar(16) NOT NULL DEFAULT 'ladder',
	`active_preset_id` varchar(36),
	`start_elo` double,
	`started_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`archived_at` bigint,
	`tournament_name` varchar(255),
	`limitless_tournament_id` int,
	`session_notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tools_vgc_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tools_vgc_team_presets` (
	`id` varchar(36) NOT NULL,
	`user_id` int,
	`name` varchar(128) NOT NULL,
	`regulation_id` varchar(64) NOT NULL,
	`export_string` text NOT NULL,
	`slots` text NOT NULL,
	`current_version` int NOT NULL DEFAULT 1,
	`versions` text NOT NULL DEFAULT ('[]'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tools_vgc_team_presets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_wingull_invites` (
	`id` varchar(6) NOT NULL,
	`uuid` char(36) NOT NULL,
	`username` varchar(32) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`used_at` timestamp,
	`deleted_at` timestamp,
	CONSTRAINT `rotom_wingull_invites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `boffmedia_user_roles` ADD CONSTRAINT `boffmedia_user_roles_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_user_roles` ADD CONSTRAINT `boffmedia_user_roles_role_id_boffmedia_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `boffmedia_roles`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_users` ADD CONSTRAINT `boffmedia_users_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_email_verifications` ADD CONSTRAINT `boffmedia_email_verifications_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_password_reset_tokens` ADD CONSTRAINT `boffmedia_password_reset_tokens_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_achievements` ADD CONSTRAINT `a_event_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_invites` ADD CONSTRAINT `ei_event_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_invites` ADD CONSTRAINT `ei_creator_fk` FOREIGN KEY (`created_by`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_participants` ADD CONSTRAINT `ep_participant_fk` FOREIGN KEY (`participant_id`) REFERENCES `boffmedia_participants`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_participants` ADD CONSTRAINT `ep_event_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_suggestions` ADD CONSTRAINT `es_proposer_fk` FOREIGN KEY (`proposer_user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_team_members` ADD CONSTRAINT `etm_team_fk` FOREIGN KEY (`team_id`) REFERENCES `boffmedia_event_teams`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_team_members` ADD CONSTRAINT `etm_participant_fk` FOREIGN KEY (`participant_id`) REFERENCES `boffmedia_participants`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_teams` ADD CONSTRAINT `boffmedia_event_teams_event_id_boffmedia_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_events` ADD CONSTRAINT `boffmedia_events_parent_id_boffmedia_events_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_events` ADD CONSTRAINT `boffmedia_events_game_id_boffmedia_games_id_fk` FOREIGN KEY (`game_id`) REFERENCES `boffmedia_games`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_events` ADD CONSTRAINT `be_pack_fk` FOREIGN KEY (`pack_id`) REFERENCES `packs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boffmedia_participant_progress` ADD CONSTRAINT `pp_participant_fk` FOREIGN KEY (`participant_id`) REFERENCES `boffmedia_participants`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_participant_progress` ADD CONSTRAINT `pp_achievement_fk` FOREIGN KEY (`achievement_id`) REFERENCES `boffmedia_achievements`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_participants` ADD CONSTRAINT `p_user_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_forum_posts` ADD CONSTRAINT `fp_thread_fk` FOREIGN KEY (`thread_id`) REFERENCES `boffmedia_forum_threads`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_forum_posts` ADD CONSTRAINT `fp_author_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_forum_threads` ADD CONSTRAINT `ft_category_fk` FOREIGN KEY (`category_id`) REFERENCES `boffmedia_forum_categories`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_forum_threads` ADD CONSTRAINT `ft_author_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_forum_threads` ADD CONSTRAINT `ft_lastpost_fk` FOREIGN KEY (`last_post_user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_forum_votes` ADD CONSTRAINT `fv_user_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_forum_votes` ADD CONSTRAINT `fv_thread_fk` FOREIGN KEY (`thread_id`) REFERENCES `boffmedia_forum_threads`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_notifications` ADD CONSTRAINT `boffmedia_notifications_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_groups` ADD CONSTRAINT `tg_t_fk` FOREIGN KEY (`tournament_id`) REFERENCES `boffmedia_tournaments`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_match_messages` ADD CONSTRAINT `tmm_m_fk` FOREIGN KEY (`match_id`) REFERENCES `boffmedia_tournament_matches`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_match_messages` ADD CONSTRAINT `tmm_u_fk` FOREIGN KEY (`author_user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD CONSTRAINT `tm_t_fk` FOREIGN KEY (`tournament_id`) REFERENCES `boffmedia_tournaments`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD CONSTRAINT `tm_phase_fk` FOREIGN KEY (`phase_id`) REFERENCES `boffmedia_tournament_phases`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD CONSTRAINT `tm_group_fk` FOREIGN KEY (`group_id`) REFERENCES `boffmedia_tournament_groups`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD CONSTRAINT `tm_top_fk` FOREIGN KEY (`top_participant_id`) REFERENCES `boffmedia_tournament_participants`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD CONSTRAINT `tm_bot_fk` FOREIGN KEY (`bot_participant_id`) REFERENCES `boffmedia_tournament_participants`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD CONSTRAINT `tm_win_fk` FOREIGN KEY (`winner_participant_id`) REFERENCES `boffmedia_tournament_participants`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD CONSTRAINT `tm_prop_fk` FOREIGN KEY (`proposed_by_participant_id`) REFERENCES `boffmedia_tournament_participants`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD CONSTRAINT `tm_next_fk` FOREIGN KEY (`next_match_id`) REFERENCES `boffmedia_tournament_matches`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD CONSTRAINT `tm_lnext_fk` FOREIGN KEY (`loser_next_match_id`) REFERENCES `boffmedia_tournament_matches`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_participants` ADD CONSTRAINT `tp_t_fk` FOREIGN KEY (`tournament_id`) REFERENCES `boffmedia_tournaments`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_participants` ADD CONSTRAINT `tp_user_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_participants` ADD CONSTRAINT `tp_group_fk` FOREIGN KEY (`group_id`) REFERENCES `boffmedia_tournament_groups`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_phase_entrants` ADD CONSTRAINT `tpe_ph_fk` FOREIGN KEY (`phase_id`) REFERENCES `boffmedia_tournament_phases`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_phase_entrants` ADD CONSTRAINT `tpe_p_fk` FOREIGN KEY (`participant_id`) REFERENCES `boffmedia_tournament_participants`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_phases` ADD CONSTRAINT `tph_t_fk` FOREIGN KEY (`tournament_id`) REFERENCES `boffmedia_tournaments`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_roster` ADD CONSTRAINT `tr_p_fk` FOREIGN KEY (`participant_id`) REFERENCES `boffmedia_tournament_participants`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_roster` ADD CONSTRAINT `tr_user_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournaments` ADD CONSTRAINT `t_game_fk` FOREIGN KEY (`game_id`) REFERENCES `boffmedia_games`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournaments` ADD CONSTRAINT `t_event_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `discord_quotes` ADD CONSTRAINT `discord_quotes_discord_id_discord_users_user_id_fk` FOREIGN KEY (`discord_id`) REFERENCES `discord_users`(`user_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_ficusai_messages` ADD CONSTRAINT `rotom_ficusai_messages_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `launcher_device_codes` ADD CONSTRAINT `ldc_user_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `pack_acl` ADD CONSTRAINT `pack_acl_pack_fk` FOREIGN KEY (`pack_id`) REFERENCES `packs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pack_grants` ADD CONSTRAINT `pack_grants_pack_fk` FOREIGN KEY (`pack_id`) REFERENCES `packs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pack_grants` ADD CONSTRAINT `pack_grants_user_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pack_invites` ADD CONSTRAINT `pack_invites_pack_fk` FOREIGN KEY (`pack_id`) REFERENCES `packs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pack_versions` ADD CONSTRAINT `pack_versions_pack_fk` FOREIGN KEY (`pack_id`) REFERENCES `packs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tools_randomizer_assignments` ADD CONSTRAINT `rass_config_fk` FOREIGN KEY (`config_id`) REFERENCES `tools_randomizer_configs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tools_randomizer_assignments` ADD CONSTRAINT `rass_user_fk` FOREIGN KEY (`boffmedia_user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tools_randomizer_audit` ADD CONSTRAINT `raud_config_fk` FOREIGN KEY (`config_id`) REFERENCES `tools_randomizer_configs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tools_randomizer_audit` ADD CONSTRAINT `raud_assignment_fk` FOREIGN KEY (`assignment_id`) REFERENCES `tools_randomizer_assignments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tools_randomizer_configs` ADD CONSTRAINT `rc_event_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tools_randomizer_configs` ADD CONSTRAINT `rc_rom_fk` FOREIGN KEY (`rom_id`) REFERENCES `tools_randomizer_roms`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tools_randomizer_presets` ADD CONSTRAINT `rp_updated_by_fk` FOREIGN KEY (`updated_by`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_arcade_streaks` ADD CONSTRAINT `rotom_arcade_streaks_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_inventory` ADD CONSTRAINT `rotom_inventory_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_notifications` ADD CONSTRAINT `rotom_notifications_user_uuid_rotom_users_uuid_fk` FOREIGN KEY (`user_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_achievements` ADD CONSTRAINT `rotom_user_achievements_achievement_id_rotom_achievements_id_fk` FOREIGN KEY (`achievement_id`) REFERENCES `rotom_achievements`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_achievements` ADD CONSTRAINT `rotom_user_achievements_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_apps` ADD CONSTRAINT `rotom_user_apps_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_apps` ADD CONSTRAINT `rotom_user_apps_app_id_rotom_apps_id_fk` FOREIGN KEY (`app_id`) REFERENCES `rotom_apps`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_replays` ADD CONSTRAINT `rotom_user_replays_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_replays` ADD CONSTRAINT `rotom_user_replays_replay_id_rotom_replays_id_fk` FOREIGN KEY (`replay_id`) REFERENCES `rotom_replays`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_members` ADD CONSTRAINT `rotom_chat_members_chat_id_rotom_chats_id_fk` FOREIGN KEY (`chat_id`) REFERENCES `rotom_chats`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_members` ADD CONSTRAINT `rotom_chat_members_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_message_reactions` ADD CONSTRAINT `rotom_chat_message_reactions_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_message_reactions` ADD CONSTRAINT `rcmr_message_fk` FOREIGN KEY (`message_id`) REFERENCES `rotom_chat_messages`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_message_reads` ADD CONSTRAINT `rotom_chat_message_reads_message_id_rotom_chat_messages_id_fk` FOREIGN KEY (`message_id`) REFERENCES `rotom_chat_messages`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_message_reads` ADD CONSTRAINT `rotom_chat_message_reads_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_messages` ADD CONSTRAINT `rotom_chat_messages_chat_id_rotom_chats_id_fk` FOREIGN KEY (`chat_id`) REFERENCES `rotom_chats`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_messages` ADD CONSTRAINT `rotom_chat_messages_sender_uuid_rotom_users_uuid_fk` FOREIGN KEY (`sender_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_documents` ADD CONSTRAINT `rotom_documents_folder_id_rotom_note_folders_id_fk` FOREIGN KEY (`folder_id`) REFERENCES `rotom_note_folders`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_news_comments` ADD CONSTRAINT `rotom_news_comments_news_id_rotom_news_id_fk` FOREIGN KEY (`news_id`) REFERENCES `rotom_news`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_news_comments` ADD CONSTRAINT `rotom_news_comments_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_note_folders` ADD CONSTRAINT `rotom_note_folders_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_note_folders` ADD CONSTRAINT `rotom_note_folders_parent_id_rotom_note_folders_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `rotom_note_folders`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_note_tag_links` ADD CONSTRAINT `rotom_note_tag_links_document_id_rotom_documents_id_fk` FOREIGN KEY (`document_id`) REFERENCES `rotom_documents`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_note_tag_links` ADD CONSTRAINT `rotom_note_tag_links_tag_id_rotom_note_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `rotom_note_tags`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_note_tags` ADD CONSTRAINT `rotom_note_tags_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_note_versions` ADD CONSTRAINT `rotom_note_versions_document_id_rotom_documents_id_fk` FOREIGN KEY (`document_id`) REFERENCES `rotom_documents`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_documents` ADD CONSTRAINT `rotom_user_documents_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_documents` ADD CONSTRAINT `rotom_user_documents_document_id_rotom_documents_id_fk` FOREIGN KEY (`document_id`) REFERENCES `rotom_documents`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_dungeon_run_players` ADD CONSTRAINT `rotom_dungeon_run_players_run_id_rotom_dungeon_runs_id_fk` FOREIGN KEY (`run_id`) REFERENCES `rotom_dungeon_runs`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_apelaciones` ADD CONSTRAINT `rotom_gobierno_apelaciones_multa_id_rotom_gobierno_multas_id_fk` FOREIGN KEY (`multa_id`) REFERENCES `rotom_gobierno_multas`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_apelaciones` ADD CONSTRAINT `gob_apelaciones_refund_fk` FOREIGN KEY (`refund_tx_id`) REFERENCES `rotom_starbank_transactions`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_bitacora` ADD CONSTRAINT `gob_bitacora_patrulla_fk` FOREIGN KEY (`patrulla_id`) REFERENCES `rotom_gobierno_patrullas`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_buscados` ADD CONSTRAINT `gob_buscados_payout_fk` FOREIGN KEY (`payout_tx_id`) REFERENCES `rotom_starbank_transactions`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_evento_capturas` ADD CONSTRAINT `gob_capturas_evento_fk` FOREIGN KEY (`evento_id`) REFERENCES `rotom_gobierno_eventos`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_evento_especies` ADD CONSTRAINT `gob_especies_evento_fk` FOREIGN KEY (`evento_id`) REFERENCES `rotom_gobierno_eventos`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_evento_obras` ADD CONSTRAINT `gob_obras_evento_fk` FOREIGN KEY (`evento_id`) REFERENCES `rotom_gobierno_eventos`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_expediente_eventos` ADD CONSTRAINT `gob_expev_expediente_fk` FOREIGN KEY (`expediente_id`) REFERENCES `rotom_gobierno_expedientes`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_multas` ADD CONSTRAINT `rotom_gobierno_multas_denuncia_id_rotom_gobierno_denuncias_id_fk` FOREIGN KEY (`denuncia_id`) REFERENCES `rotom_gobierno_denuncias`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_multas` ADD CONSTRAINT `gob_multas_paid_fk` FOREIGN KEY (`paid_tx_id`) REFERENCES `rotom_starbank_transactions`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_parcelas` ADD CONSTRAINT `rotom_gobierno_parcelas_zona_id_rotom_gobierno_zonas_id_fk` FOREIGN KEY (`zona_id`) REFERENCES `rotom_gobierno_zonas`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_patrulla_oficiales` ADD CONSTRAINT `gob_patoff_patrulla_fk` FOREIGN KEY (`patrulla_id`) REFERENCES `rotom_gobierno_patrullas`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_pujas` ADD CONSTRAINT `rotom_gobierno_pujas_subasta_id_rotom_gobierno_subastas_id_fk` FOREIGN KEY (`subasta_id`) REFERENCES `rotom_gobierno_subastas`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_subastas` ADD CONSTRAINT `gob_subastas_settled_fk` FOREIGN KEY (`settled_tx_id`) REFERENCES `rotom_starbank_transactions`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_kart_race_players` ADD CONSTRAINT `rotom_kart_race_players_race_id_rotom_kart_races_id_fk` FOREIGN KEY (`race_id`) REFERENCES `rotom_kart_races`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_mine_game_rewards` ADD CONSTRAINT `rotom_mine_game_rewards_game_id_rotom_mine_games_id_fk` FOREIGN KEY (`game_id`) REFERENCES `rotom_mine_games`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_mine_game_rewards` ADD CONSTRAINT `rotom_mine_game_rewards_reward_id_rotom_mine_rewards_id_fk` FOREIGN KEY (`reward_id`) REFERENCES `rotom_mine_rewards`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_mine_games` ADD CONSTRAINT `rotom_mine_games_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_pasaporte_profiles` ADD CONSTRAINT `rotom_pasaporte_profiles_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_pc_marks` ADD CONSTRAINT `rotom_pc_marks_user_uuid_rotom_users_uuid_fk` FOREIGN KEY (`user_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_pokedex` ADD CONSTRAINT `rotom_pokedex_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_bookmarks` ADD CONSTRAINT `rotom_rooker_bookmarks_post_id_rotom_rooker_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `rotom_rooker_posts`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_bookmarks` ADD CONSTRAINT `rotom_rooker_bookmarks_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_follows` ADD CONSTRAINT `rotom_rooker_follows_follower_uuid_rotom_users_uuid_fk` FOREIGN KEY (`follower_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_follows` ADD CONSTRAINT `rotom_rooker_follows_followee_uuid_rotom_users_uuid_fk` FOREIGN KEY (`followee_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_hashtags` ADD CONSTRAINT `rotom_rooker_hashtags_post_id_rotom_rooker_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `rotom_rooker_posts`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_posts` ADD CONSTRAINT `rotom_rooker_posts_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_posts` ADD CONSTRAINT `rotom_rooker_posts_capture_id_rotom_pokedex_id_fk` FOREIGN KEY (`capture_id`) REFERENCES `rotom_pokedex`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_posts` ADD CONSTRAINT `rotom_rooker_posts_replay_id_rotom_replays_id_fk` FOREIGN KEY (`replay_id`) REFERENCES `rotom_replays`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_posts` ADD CONSTRAINT `rotom_rooker_posts_parent_fk` FOREIGN KEY (`parent_id`) REFERENCES `rotom_rooker_posts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rotom_rooker_profiles` ADD CONSTRAINT `rotom_rooker_profiles_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_reactions` ADD CONSTRAINT `rotom_rooker_reactions_post_id_rotom_rooker_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `rotom_rooker_posts`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_reactions` ADD CONSTRAINT `rotom_rooker_reactions_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_retrinos` ADD CONSTRAINT `rotom_rooker_retrinos_post_id_rotom_rooker_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `rotom_rooker_posts`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_retrinos` ADD CONSTRAINT `rotom_rooker_retrinos_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_starbank_transactions` ADD CONSTRAINT `sb_tx_from_fk` FOREIGN KEY (`from_account_id`) REFERENCES `rotom_starbank_accounts`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_starbank_transactions` ADD CONSTRAINT `sb_tx_to_fk` FOREIGN KEY (`to_account_id`) REFERENCES `rotom_starbank_accounts`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_starbank_user_accounts` ADD CONSTRAINT `rotom_starbank_user_accounts_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_starbank_user_accounts` ADD CONSTRAINT `sb_user_accounts_account_fk` FOREIGN KEY (`account_id`) REFERENCES `rotom_starbank_accounts`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_bids` ADD CONSTRAINT `rotom_wigglypop_bids_listing_id_rotom_wigglypop_listings_id_fk` FOREIGN KEY (`listing_id`) REFERENCES `rotom_wigglypop_listings`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_listing_items` ADD CONSTRAINT `wp_litems_listing_fk` FOREIGN KEY (`listing_id`) REFERENCES `rotom_wigglypop_listings`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_listing_mons` ADD CONSTRAINT `wp_lmons_listing_fk` FOREIGN KEY (`listing_id`) REFERENCES `rotom_wigglypop_listings`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_listings` ADD CONSTRAINT `rotom_wigglypop_listings_seller_uuid_rotom_users_uuid_fk` FOREIGN KEY (`seller_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_offers` ADD CONSTRAINT `rotom_wigglypop_offers_listing_id_rotom_wigglypop_listings_id_fk` FOREIGN KEY (`listing_id`) REFERENCES `rotom_wigglypop_listings`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_order_lines` ADD CONSTRAINT `wp_olines_order_fk` FOREIGN KEY (`order_id`) REFERENCES `rotom_wigglypop_orders`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_order_lines` ADD CONSTRAINT `wp_olines_settle_fk` FOREIGN KEY (`settle_tx_id`) REFERENCES `rotom_starbank_transactions`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_orders` ADD CONSTRAINT `rotom_wigglypop_orders_buyer_uuid_rotom_users_uuid_fk` FOREIGN KEY (`buyer_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_orders` ADD CONSTRAINT `wp_orders_escrow_fk` FOREIGN KEY (`escrow_tx_id`) REFERENCES `rotom_starbank_transactions`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_reviews` ADD CONSTRAINT `rotom_wigglypop_reviews_order_id_rotom_wigglypop_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `rotom_wigglypop_orders`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_trade_offers` ADD CONSTRAINT `wp_trades_listing_fk` FOREIGN KEY (`listing_id`) REFERENCES `rotom_wigglypop_listings`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_watchlist` ADD CONSTRAINT `wp_watch_listing_fk` FOREIGN KEY (`listing_id`) REFERENCES `rotom_wigglypop_listings`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tools_tcg_cards` ADD CONSTRAINT `tools_tcg_cards_set_id_tools_tcg_sets_id_fk` FOREIGN KEY (`set_id`) REFERENCES `tools_tcg_sets`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tools_tcg_sets` ADD CONSTRAINT `tools_tcg_sets_series_id_tools_tcg_series_id_fk` FOREIGN KEY (`series_id`) REFERENCES `tools_tcg_series`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tools_tcg_user_card_history` ADD CONSTRAINT `tools_tcg_user_card_history_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tools_tcg_user_card_history` ADD CONSTRAINT `tools_tcg_user_card_history_card_id_tools_tcg_cards_id_fk` FOREIGN KEY (`card_id`) REFERENCES `tools_tcg_cards`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tools_tcg_user_cards` ADD CONSTRAINT `tools_tcg_user_cards_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tools_tcg_user_cards` ADD CONSTRAINT `tools_tcg_user_cards_card_id_tools_tcg_cards_id_fk` FOREIGN KEY (`card_id`) REFERENCES `tools_tcg_cards`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tools_vgc_limitless_teams` ADD CONSTRAINT `tools_vgc_limitless_teams_paste_id_tools_vgc_pokepastes_id_fk` FOREIGN KEY (`paste_id`) REFERENCES `tools_vgc_pokepastes`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tools_vgc_limitless_teams` ADD CONSTRAINT `tools_vgc_lt_tournament_id_fk` FOREIGN KEY (`tournament_id`) REFERENCES `tools_vgc_limitless_tournaments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tools_vgc_pastes_repository` ADD CONSTRAINT `tools_vgc_pastes_repository_paste_id_tools_vgc_pokepastes_id_fk` FOREIGN KEY (`paste_id`) REFERENCES `tools_vgc_pokepastes`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tools_vgc_matches` ADD CONSTRAINT `tools_vgc_matches_session_id_tools_vgc_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `tools_vgc_sessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tools_vgc_matches` ADD CONSTRAINT `tools_vgc_matches_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tools_vgc_series` ADD CONSTRAINT `tools_vgc_series_session_id_tools_vgc_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `tools_vgc_sessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tools_vgc_series` ADD CONSTRAINT `tools_vgc_series_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tools_vgc_sessions` ADD CONSTRAINT `tools_vgc_sessions_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tools_vgc_team_presets` ADD CONSTRAINT `tools_vgc_team_presets_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ev_token_idx` ON `boffmedia_email_verifications` (`token_hash`);--> statement-breakpoint
CREATE INDEX `ev_user_idx` ON `boffmedia_email_verifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `prt_token_idx` ON `boffmedia_password_reset_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `prt_user_idx` ON `boffmedia_password_reset_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `a_event_idx` ON `boffmedia_achievements` (`event_id`);--> statement-breakpoint
CREATE INDEX `a_category_idx` ON `boffmedia_achievements` (`category`);--> statement-breakpoint
CREATE INDEX `ei_event_idx` ON `boffmedia_event_invites` (`event_id`);--> statement-breakpoint
CREATE INDEX `ep_event_idx` ON `boffmedia_event_participants` (`event_id`);--> statement-breakpoint
CREATE INDEX `ep_participant_idx` ON `boffmedia_event_participants` (`participant_id`);--> statement-breakpoint
CREATE INDEX `es_status_idx` ON `boffmedia_event_suggestions` (`status`);--> statement-breakpoint
CREATE INDEX `etm_role_idx` ON `boffmedia_event_team_members` (`team_id`,`role`);--> statement-breakpoint
CREATE INDEX `et_event_idx` ON `boffmedia_event_teams` (`event_id`);--> statement-breakpoint
CREATE INDEX `game_idx` ON `boffmedia_events` (`game_id`);--> statement-breakpoint
CREATE INDEX `event_status_idx` ON `boffmedia_events` (`status`);--> statement-breakpoint
CREATE INDEX `event_visibility_idx` ON `boffmedia_events` (`visibility`);--> statement-breakpoint
CREATE INDEX `event_type_idx` ON `boffmedia_events` (`type`);--> statement-breakpoint
CREATE INDEX `be_pack_idx` ON `boffmedia_events` (`pack_id`);--> statement-breakpoint
CREATE INDEX `pp_achievement_idx` ON `boffmedia_participant_progress` (`achievement_id`);--> statement-breakpoint
CREATE INDEX `pp_completed_idx` ON `boffmedia_participant_progress` (`is_completed`,`participant_id`,`achievement_id`);--> statement-breakpoint
CREATE INDEX `p_user_idx` ON `boffmedia_participants` (`user_id`);--> statement-breakpoint
CREATE INDEX `fp_thread_idx` ON `boffmedia_forum_posts` (`thread_id`);--> statement-breakpoint
CREATE INDEX `ft_category_idx` ON `boffmedia_forum_threads` (`category_id`);--> statement-breakpoint
CREATE INDEX `ft_last_post_idx` ON `boffmedia_forum_threads` (`last_post_at`);--> statement-breakpoint
CREATE INDEX `notif_user_idx` ON `boffmedia_notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `notif_user_read_idx` ON `boffmedia_notifications` (`user_id`,`read_at`);--> statement-breakpoint
CREATE INDEX `tg_tournament_idx` ON `boffmedia_tournament_groups` (`tournament_id`);--> statement-breakpoint
CREATE INDEX `tg_phase_idx` ON `boffmedia_tournament_groups` (`phase_id`);--> statement-breakpoint
CREATE INDEX `tmm_match_idx` ON `boffmedia_tournament_match_messages` (`match_id`);--> statement-breakpoint
CREATE INDEX `tm_phase_idx` ON `boffmedia_tournament_matches` (`phase_id`);--> statement-breakpoint
CREATE INDEX `tm_bracket_idx` ON `boffmedia_tournament_matches` (`tournament_id`,`bracket`,`round_number`);--> statement-breakpoint
CREATE INDEX `tm_group_idx` ON `boffmedia_tournament_matches` (`group_id`);--> statement-breakpoint
CREATE INDEX `tm_next_idx` ON `boffmedia_tournament_matches` (`next_match_id`);--> statement-breakpoint
CREATE INDEX `tp_user_idx` ON `boffmedia_tournament_participants` (`user_id`);--> statement-breakpoint
CREATE INDEX `tp_seed_idx` ON `boffmedia_tournament_participants` (`tournament_id`,`seed`);--> statement-breakpoint
CREATE INDEX `tp_group_idx` ON `boffmedia_tournament_participants` (`group_id`);--> statement-breakpoint
CREATE INDEX `tph_tournament_idx` ON `boffmedia_tournament_phases` (`tournament_id`,`phase_order`);--> statement-breakpoint
CREATE INDEX `tr_participant_idx` ON `boffmedia_tournament_roster` (`participant_id`);--> statement-breakpoint
CREATE INDEX `t_game_idx` ON `boffmedia_tournaments` (`game_id`);--> statement-breakpoint
CREATE INDEX `t_event_idx` ON `boffmedia_tournaments` (`event_id`);--> statement-breakpoint
CREATE INDEX `t_status_idx` ON `boffmedia_tournaments` (`status`);--> statement-breakpoint
CREATE INDEX `t_format_idx` ON `boffmedia_tournaments` (`format`);--> statement-breakpoint
CREATE INDEX `discord_quotes_server_idx` ON `discord_quotes` (`server_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `rotom_ficusai_messages_owner_recent_idx` ON `rotom_ficusai_messages` (`uuid`,`id`);--> statement-breakpoint
CREATE INDEX `ldc_user_idx` ON `launcher_device_codes` (`user_id`);--> statement-breakpoint
CREATE INDEX `ldc_expires_idx` ON `launcher_device_codes` (`expires_at`);--> statement-breakpoint
CREATE INDEX `launcher_releases_target_published_idx` ON `launcher_releases` (`target`,`published`);--> statement-breakpoint
CREATE INDEX `pack_acl_uuid_idx` ON `pack_acl` (`uuid`);--> statement-breakpoint
CREATE INDEX `pack_audit_pack_idx` ON `pack_audit` (`pack_id`);--> statement-breakpoint
CREATE INDEX `pack_audit_user_idx` ON `pack_audit` (`user_id`);--> statement-breakpoint
CREATE INDEX `pack_grants_user_idx` ON `pack_grants` (`user_id`);--> statement-breakpoint
CREATE INDEX `pack_versions_pack_idx` ON `pack_versions` (`pack_id`);--> statement-breakpoint
CREATE INDEX `rass_config_idx` ON `tools_randomizer_assignments` (`config_id`);--> statement-breakpoint
CREATE INDEX `rass_mc_uuid_idx` ON `tools_randomizer_assignments` (`mc_uuid`);--> statement-breakpoint
CREATE INDEX `rass_user_idx` ON `tools_randomizer_assignments` (`boffmedia_user_id`);--> statement-breakpoint
CREATE INDEX `rass_status_idx` ON `tools_randomizer_assignments` (`status`);--> statement-breakpoint
CREATE INDEX `raud_config_idx` ON `tools_randomizer_audit` (`config_id`);--> statement-breakpoint
CREATE INDEX `raud_assignment_idx` ON `tools_randomizer_audit` (`assignment_id`);--> statement-breakpoint
CREATE INDEX `raud_action_idx` ON `tools_randomizer_audit` (`action`);--> statement-breakpoint
CREATE INDEX `rc_event_idx` ON `tools_randomizer_configs` (`event_id`);--> statement-breakpoint
CREATE INDEX `rc_status_idx` ON `tools_randomizer_configs` (`status`);--> statement-breakpoint
CREATE INDEX `rc_rom_idx` ON `tools_randomizer_configs` (`rom_id`);--> statement-breakpoint
CREATE INDEX `rr_platform_idx` ON `tools_randomizer_roms` (`game_platform`);--> statement-breakpoint
CREATE INDEX `rotom_inventory_owner_item_idx` ON `rotom_inventory` (`uuid`,`item_id`,`used`);--> statement-breakpoint
CREATE INDEX `rotom_inventory_reservation_idx` ON `rotom_inventory` (`reservation_id`,`reserved_at`);--> statement-breakpoint
CREATE INDEX `rotom_news_published_idx` ON `rotom_news` (`published`,`created_at`);--> statement-breakpoint
CREATE INDEX `rotom_news_featured_idx` ON `rotom_news` (`featured`,`created_at`);--> statement-breakpoint
CREATE INDEX `drp_uuid_idx` ON `rotom_dungeon_run_players` (`uuid`);--> statement-breakpoint
CREATE INDEX `drp_run_idx` ON `rotom_dungeon_run_players` (`run_id`);--> statement-breakpoint
CREATE INDEX `gob_audit_dep_idx` ON `rotom_gobierno_auditoria` (`dep`);--> statement-breakpoint
CREATE INDEX `gob_audit_created_idx` ON `rotom_gobierno_auditoria` (`created_at`);--> statement-breakpoint
CREATE INDEX `gob_especies_evento_idx` ON `rotom_gobierno_evento_especies` (`evento_id`);--> statement-breakpoint
CREATE INDEX `gob_obras_evento_idx` ON `rotom_gobierno_evento_obras` (`evento_id`);--> statement-breakpoint
CREATE INDEX `gob_expev_expediente_idx` ON `rotom_gobierno_expediente_eventos` (`expediente_id`);--> statement-breakpoint
CREATE INDEX `gob_hist_region_idx` ON `rotom_gobierno_parcela_historial` (`region_id`);--> statement-breakpoint
CREATE INDEX `gob_parcelas_town_idx` ON `rotom_gobierno_parcelas` (`town`);--> statement-breakpoint
CREATE INDEX `gob_patoff_patrulla_idx` ON `rotom_gobierno_patrulla_oficiales` (`patrulla_id`);--> statement-breakpoint
CREATE INDEX `gob_pujas_subasta_idx` ON `rotom_gobierno_pujas` (`subasta_id`);--> statement-breakpoint
CREATE INDEX `krp_uuid_idx` ON `rotom_kart_race_players` (`uuid`);--> statement-breakpoint
CREATE INDEX `krp_race_idx` ON `rotom_kart_race_players` (`race_id`);--> statement-breakpoint
CREATE INDEX `kr_circuit_idx` ON `rotom_kart_races` (`circuito`);--> statement-breakpoint
CREATE INDEX `kr_mode_idx` ON `rotom_kart_races` (`modo`);--> statement-breakpoint
CREATE INDEX `rotom_rooker_follows_followee_idx` ON `rotom_rooker_follows` (`followee_uuid`);--> statement-breakpoint
CREATE INDEX `rotom_rooker_hashtags_tag_idx` ON `rotom_rooker_hashtags` (`tag`,`post_id`);--> statement-breakpoint
CREATE INDEX `rotom_rooker_posts_uuid_idx` ON `rotom_rooker_posts` (`uuid`);--> statement-breakpoint
CREATE INDEX `rotom_rooker_posts_parent_idx` ON `rotom_rooker_posts` (`parent_id`);--> statement-breakpoint
CREATE INDEX `rotom_rooker_posts_created_idx` ON `rotom_rooker_posts` (`created_at`);--> statement-breakpoint
CREATE INDEX `starbank_accounts_type_idx` ON `rotom_starbank_accounts` (`type`);--> statement-breakpoint
CREATE INDEX `sb_tx_date_idx` ON `rotom_starbank_transactions` (`date`);--> statement-breakpoint
CREATE INDEX `sb_tx_from_idx` ON `rotom_starbank_transactions` (`from_account_id`,`date`);--> statement-breakpoint
CREATE INDEX `sb_tx_to_idx` ON `rotom_starbank_transactions` (`to_account_id`,`date`);--> statement-breakpoint
CREATE INDEX `wp_bids_listing_idx` ON `rotom_wigglypop_bids` (`listing_id`);--> statement-breakpoint
CREATE INDEX `wp_litems_listing_idx` ON `rotom_wigglypop_listing_items` (`listing_id`);--> statement-breakpoint
CREATE INDEX `wp_lmons_listing_idx` ON `rotom_wigglypop_listing_mons` (`listing_id`);--> statement-breakpoint
CREATE INDEX `wp_lmons_dex_idx` ON `rotom_wigglypop_listing_mons` (`dex`);--> statement-breakpoint
CREATE INDEX `wp_listings_browse_idx` ON `rotom_wigglypop_listings` (`status`,`kind`,`format`);--> statement-breakpoint
CREATE INDEX `wp_listings_seller_idx` ON `rotom_wigglypop_listings` (`seller_uuid`);--> statement-breakpoint
CREATE INDEX `wp_offers_listing_idx` ON `rotom_wigglypop_offers` (`listing_id`);--> statement-breakpoint
CREATE INDEX `wp_offers_buyer_idx` ON `rotom_wigglypop_offers` (`buyer_uuid`);--> statement-breakpoint
CREATE INDEX `wp_olines_order_idx` ON `rotom_wigglypop_order_lines` (`order_id`);--> statement-breakpoint
CREATE INDEX `wp_olines_seller_idx` ON `rotom_wigglypop_order_lines` (`seller_uuid`);--> statement-breakpoint
CREATE INDEX `wp_olines_listing_idx` ON `rotom_wigglypop_order_lines` (`listing_id`);--> statement-breakpoint
CREATE INDEX `wp_orders_buyer_idx` ON `rotom_wigglypop_orders` (`buyer_uuid`);--> statement-breakpoint
CREATE INDEX `wp_reviews_seller_idx` ON `rotom_wigglypop_reviews` (`seller_uuid`);--> statement-breakpoint
CREATE INDEX `wp_trades_listing_idx` ON `rotom_wigglypop_trade_offers` (`listing_id`);--> statement-breakpoint
CREATE INDEX `tools_vgc_limitless_teams_tournament_player_idx` ON `tools_vgc_limitless_teams` (`tournament_id`,`player_slug`);--> statement-breakpoint
CREATE INDEX `tools_vgc_limitless_teams_paste_idx` ON `tools_vgc_limitless_teams` (`paste_id`);--> statement-breakpoint
CREATE INDEX `tools_vgc_limitless_tournaments_regulation_status_idx` ON `tools_vgc_limitless_tournaments` (`regulation_id`,`status`);--> statement-breakpoint
CREATE INDEX `tools_vgc_pastes_repository_regulation_paste_idx` ON `tools_vgc_pastes_repository` (`regulation_id`,`paste_id`);--> statement-breakpoint
CREATE INDEX `tools_vgc_pokepastes_format_idx` ON `tools_vgc_pokepastes` (`format_id`);--> statement-breakpoint
CREATE INDEX `tools_vgc_regulations_active_idx` ON `tools_vgc_regulations` (`active`);--> statement-breakpoint
CREATE INDEX `tools_vgc_regulations_format_idx` ON `tools_vgc_regulations` (`format_id`);