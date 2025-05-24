CREATE TABLE `boffmedia_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(32) NOT NULL,
	CONSTRAINT `boffmedia_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `boffmedia_roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_user_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`roleId` int,
	CONSTRAINT `boffmedia_user_roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(32) NOT NULL,
	`password` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`uuid` char(36),
	CONSTRAINT `boffmedia_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `boffmedia_users_username_unique` UNIQUE(`username`)
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
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_event_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participant_id` int NOT NULL,
	`event_id` int NOT NULL,
	`status` enum('registered','confirmed','declined','removed') NOT NULL DEFAULT 'registered',
	`comment` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_event_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_event_team_members` (
	`team_id` int NOT NULL,
	`participant_id` int NOT NULL,
	`role` enum('leader','member') NOT NULL DEFAULT 'member',
	`joined_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
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
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_event_teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parent_id` int,
	`title` varchar(255) NOT NULL,
	`game` int,
	`description` text,
	`icon` varchar(255) NOT NULL,
	`banner` varchar(255),
	`start_date` datetime NOT NULL,
	`end_date` datetime,
	`status` enum('upcoming','active','completed') NOT NULL DEFAULT 'upcoming',
	`visibility` enum('public','private') NOT NULL DEFAULT 'private',
	`type` enum('event','server') NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(255) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_games_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_participant_progress` (
	`participant_id` int NOT NULL,
	`achievement_id` int NOT NULL,
	`current_progress` int NOT NULL DEFAULT 0,
	`is_completed` int NOT NULL DEFAULT 0,
	`completed_at` datetime,
	`last_updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_participant_progress_participant_id_achievement_id_pk` PRIMARY KEY(`participant_id`,`achievement_id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`nickname` varchar(32),
	`avatar` varchar(255),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discord_users` (
	`user_id` varchar(32) NOT NULL,
	`username` varchar(32) NOT NULL,
	`avatar` varchar(255),
	`color` varchar(6),
	`tts_voice` varchar(32) DEFAULT 'Enrique',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime,
	CONSTRAINT `discord_users_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `ficus_quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`discord_id` varchar(32) NOT NULL,
	`server_id` varchar(32) NOT NULL,
	`quote` text NOT NULL,
	`comment` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime,
	CONSTRAINT `ficus_quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ficus_messages` (
	`uuid` char(36),
	`content` json,
	`id` int AUTO_INCREMENT NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP(),
	`deleted_at` datetime,
	CONSTRAINT `ficus_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sharex_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`app` varchar(32) NOT NULL,
	`name` char(10) NOT NULL,
	`extension` varchar(4) NOT NULL,
	`key` char(32) NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `sharex_images_id` PRIMARY KEY(`id`)
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
	CONSTRAINT `rotom_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_arcade_streaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`last_claimed` timestamp,
	`last_banner` varchar(100),
	`streak` int DEFAULT 0,
	`total_claims` int DEFAULT 0,
	CONSTRAINT `rotom_arcade_streaks_id` PRIMARY KEY(`id`)
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
	`item_id` varchar(32) NOT NULL,
	`item_type` varchar(32) NOT NULL,
	`amount` int DEFAULT 1,
	`source_type` varchar(32),
	`used` int DEFAULT 0,
	`rarity` varchar(20) DEFAULT 'common',
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_replays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`side1` varchar(36) NOT NULL,
	`side2` varchar(36) NOT NULL,
	`team1` text,
	`team2` text,
	`replay` text NOT NULL,
	`winner` int DEFAULT 0,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_replays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_user_achievements` (
	`achievement_id` varchar(32) NOT NULL,
	`uuid` char(36) NOT NULL,
	`progress` int DEFAULT 0,
	`completed` int DEFAULT 0,
	`completed_at` timestamp,
	`data_id` int DEFAULT 0,
	CONSTRAINT `rotom_user_achievements_achievement_id_uuid_pk` PRIMARY KEY(`achievement_id`,`uuid`)
);
--> statement-breakpoint
CREATE TABLE `rotom_user_replays` (
	`uuid` char(36) NOT NULL,
	`replay_id` int NOT NULL,
	`side` int DEFAULT 1,
	CONSTRAINT `rotom_user_replays_uuid_replay_id_pk` PRIMARY KEY(`uuid`,`replay_id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_apps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(32) NOT NULL,
	`url` varchar(255),
	`active` int DEFAULT 1,
	CONSTRAINT `rotom_apps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_user_apps` (
	`uuid` char(36) NOT NULL,
	`app_id` int NOT NULL,
	`order` int DEFAULT 999
);
--> statement-breakpoint
CREATE TABLE `rotom_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` char(36) NOT NULL,
	`username` varchar(32) NOT NULL,
	`world` varchar(8),
	`energy` int DEFAULT 10,
	`last_charge` timestamp DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_users_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `rotom_chat_message_reads` (
	`message_id` int NOT NULL,
	`uuid` varchar(36) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rotom_chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chat_id` int NOT NULL,
	`sender_uuid` varchar(36) NOT NULL,
	`content` text NOT NULL,
	`type` varchar(255) DEFAULT 'text',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_chat_users` (
	`chat_id` int NOT NULL,
	`uuid` varchar(36) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rotom_chats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` varchar(255) NOT NULL,
	`image` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp,
	CONSTRAINT `rotom_chats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` int NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `rotom_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_documents_users` (
	`uuid` varchar(36) NOT NULL,
	`document_id` int NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rotom_news` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` varchar(255),
	`category` varchar(255),
	`subcategory` varchar(255),
	`published` int NOT NULL DEFAULT 0,
	`featured` int NOT NULL DEFAULT 0,
	`content` text NOT NULL,
	`button_text` varchar(255),
	`image_url` varchar(255),
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `rotom_news_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_mine_games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` char(36) NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_mine_games_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_mine_games_detail` (
	`id` int AUTO_INCREMENT NOT NULL,
	`game_id` int NOT NULL,
	`reward_id` int NOT NULL,
	`value` int NOT NULL,
	CONSTRAINT `rotom_mine_games_detail_id` PRIMARY KEY(`id`)
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
CREATE TABLE `rotom_pokedex` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` char(36) NOT NULL,
	`pokemon_id` int NOT NULL,
	`form_id` varchar(32) NOT NULL,
	`palette_id` varchar(32) NOT NULL,
	`seen_at` datetime DEFAULT CURRENT_TIMESTAMP(),
	`caught_at` datetime,
	CONSTRAINT `rotom_pokedex_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_bank_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(32) NOT NULL,
	`balance` bigint DEFAULT 0,
	`type` varchar(32) NOT NULL,
	CONSTRAINT `rotom_bank_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_bank_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`from` int NOT NULL,
	`to` int NOT NULL,
	`amount` bigint NOT NULL,
	`from_balance` bigint NOT NULL,
	`to_balance` bigint NOT NULL,
	`concept` varchar(255) NOT NULL,
	`type` varchar(32) NOT NULL,
	`date` varchar(32) NOT NULL,
	CONSTRAINT `rotom_bank_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_bank_users_accounts` (
	`uuid` varchar(36) NOT NULL,
	`account_id` int NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tcgp_booster_packs` (
	`name` varchar(32) NOT NULL,
	`expansion` varchar(32) NOT NULL,
	CONSTRAINT `tcgp_booster_packs_name` PRIMARY KEY(`name`),
	CONSTRAINT `tcgp_booster_packs_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `tcgp_cards` (
	`expansion` varchar(32) NOT NULL,
	`number` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`rarity` varchar(32) NOT NULL,
	`type` varchar(32) NOT NULL,
	`hp` int,
	`weakness` varchar(32),
	`weakness_value` int,
	`retreat_cost` int,
	CONSTRAINT `tcgp_cards_expansion_number_pk` PRIMARY KEY(`expansion`,`number`)
);
--> statement-breakpoint
CREATE TABLE `tcgp_cards_packs` (
	`expansion` varchar(32) NOT NULL,
	`card_number` int NOT NULL,
	`pack_id` varchar(32) NOT NULL,
	CONSTRAINT `tcgp_cards_packs_expansion_card_number_pack_id_pk` PRIMARY KEY(`expansion`,`card_number`,`pack_id`)
);
--> statement-breakpoint
CREATE TABLE `tcgp_expansions` (
	`id` varchar(32) NOT NULL,
	`name` varchar(32) NOT NULL,
	`logo_url` varchar(255) NOT NULL,
	`icon_url` varchar(255) NOT NULL,
	`type` varchar(32) NOT NULL,
	`release_date` datetime,
	CONSTRAINT `tcgp_expansions_id` PRIMARY KEY(`id`),
	CONSTRAINT `tcgp_expansions_id_unique` UNIQUE(`id`),
	CONSTRAINT `tcgp_expansions_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `tcgp_user_card_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`expansion` varchar(32) NOT NULL,
	`card_number` int NOT NULL,
	`count` int NOT NULL,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `tcgp_user_card_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tcgp_users_cards` (
	`user_id` int NOT NULL,
	`expansion` varchar(32) NOT NULL,
	`card_number` int NOT NULL,
	`count` int NOT NULL,
	`obtained_at` datetime NOT NULL,
	CONSTRAINT `tcgp_users_cards_user_id_expansion_card_number_pk` PRIMARY KEY(`user_id`,`expansion`,`card_number`)
);
--> statement-breakpoint
CREATE TABLE `wingull_invites` (
	`id` varchar(6) NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`username` varchar(32) NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP(),
	`used_at` datetime,
	`deleted_at` datetime,
	CONSTRAINT `wingull_invites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `boffmedia_user_roles` ADD CONSTRAINT `bur_user_fk` FOREIGN KEY (`userId`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_user_roles` ADD CONSTRAINT `bur_role_fk` FOREIGN KEY (`roleId`) REFERENCES `boffmedia_roles`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_users` ADD CONSTRAINT `bu_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_achievements` ADD CONSTRAINT `a_event_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_participants` ADD CONSTRAINT `ep_participant_fk` FOREIGN KEY (`participant_id`) REFERENCES `boffmedia_participants`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_participants` ADD CONSTRAINT `ep_event_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_team_members` ADD CONSTRAINT `etm_team_fk` FOREIGN KEY (`team_id`) REFERENCES `boffmedia_event_teams`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_team_members` ADD CONSTRAINT `etm_participant_fk` FOREIGN KEY (`participant_id`) REFERENCES `boffmedia_participants`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_teams` ADD CONSTRAINT `bet_event_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_events` ADD CONSTRAINT `be_parent_fk` FOREIGN KEY (`parent_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_events` ADD CONSTRAINT `be_game_fk` FOREIGN KEY (`game`) REFERENCES `boffmedia_games`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_participant_progress` ADD CONSTRAINT `pp_participant_fk` FOREIGN KEY (`participant_id`) REFERENCES `boffmedia_participants`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_participant_progress` ADD CONSTRAINT `pp_achievement_fk` FOREIGN KEY (`achievement_id`) REFERENCES `boffmedia_achievements`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_participants` ADD CONSTRAINT `p_user_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ficus_quotes` ADD CONSTRAINT `fq_discord_fk` FOREIGN KEY (`discord_id`) REFERENCES `discord_users`(`user_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_inventory` ADD CONSTRAINT `ri_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_achievements` ADD CONSTRAINT `rua_achievement_fk` FOREIGN KEY (`achievement_id`) REFERENCES `rotom_achievements`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_achievements` ADD CONSTRAINT `rua_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_replays` ADD CONSTRAINT `rur_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_replays` ADD CONSTRAINT `rur_replay_fk` FOREIGN KEY (`replay_id`) REFERENCES `rotom_replays`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_apps` ADD CONSTRAINT `ruapp_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_apps` ADD CONSTRAINT `ruapp_app_fk` FOREIGN KEY (`app_id`) REFERENCES `rotom_apps`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_message_reads` ADD CONSTRAINT `rcmr_message_fk` FOREIGN KEY (`message_id`) REFERENCES `rotom_chat_messages`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_message_reads` ADD CONSTRAINT `rcmr_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_messages` ADD CONSTRAINT `rcm_chat_fk` FOREIGN KEY (`chat_id`) REFERENCES `rotom_chats`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_messages` ADD CONSTRAINT `rcm_sender_uuid_fk` FOREIGN KEY (`sender_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_users` ADD CONSTRAINT `rcu_chat_fk` FOREIGN KEY (`chat_id`) REFERENCES `rotom_chats`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_users` ADD CONSTRAINT `rcu_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_documents_users` ADD CONSTRAINT `rdu_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_documents_users` ADD CONSTRAINT `rdu_document_fk` FOREIGN KEY (`document_id`) REFERENCES `rotom_documents`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_mine_games` ADD CONSTRAINT `rmg_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_mine_games_detail` ADD CONSTRAINT `rmgd_game_fk` FOREIGN KEY (`game_id`) REFERENCES `rotom_mine_games`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_mine_games_detail` ADD CONSTRAINT `rmgd_reward_fk` FOREIGN KEY (`reward_id`) REFERENCES `rotom_mine_rewards`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_pokedex` ADD CONSTRAINT `rpdx_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_bank_transactions` ADD CONSTRAINT `rbt_from_fk` FOREIGN KEY (`from`) REFERENCES `rotom_bank_accounts`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_bank_transactions` ADD CONSTRAINT `rbt_to_fk` FOREIGN KEY (`to`) REFERENCES `rotom_bank_accounts`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_bank_users_accounts` ADD CONSTRAINT `rbua_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_bank_users_accounts` ADD CONSTRAINT `rbua_account_fk` FOREIGN KEY (`account_id`) REFERENCES `rotom_bank_accounts`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcgp_booster_packs` ADD CONSTRAINT `tbp_expansion_fk` FOREIGN KEY (`expansion`) REFERENCES `tcgp_expansions`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcgp_cards` ADD CONSTRAINT `tca_expansion_fk` FOREIGN KEY (`expansion`) REFERENCES `tcgp_expansions`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcgp_cards_packs` ADD CONSTRAINT `tcpk_expansion_fk` FOREIGN KEY (`expansion`) REFERENCES `tcgp_cards`(`expansion`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcgp_cards_packs` ADD CONSTRAINT `tcpk_pack_fk` FOREIGN KEY (`pack_id`) REFERENCES `tcgp_booster_packs`(`name`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcgp_user_card_history` ADD CONSTRAINT `tuch_user_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcgp_users_cards` ADD CONSTRAINT `tuc_user_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcgp_users_cards` ADD CONSTRAINT `tuc_expansion_fk` FOREIGN KEY (`expansion`) REFERENCES `tcgp_cards`(`expansion`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `a_event_idx` ON `boffmedia_achievements` (`event_id`);--> statement-breakpoint
CREATE INDEX `a_category_idx` ON `boffmedia_achievements` (`category`);--> statement-breakpoint
CREATE INDEX `ep_event_idx` ON `boffmedia_event_participants` (`event_id`);--> statement-breakpoint
CREATE INDEX `ep_participant_idx` ON `boffmedia_event_participants` (`participant_id`);--> statement-breakpoint
CREATE INDEX `etm_role_idx` ON `boffmedia_event_team_members` (`team_id`,`role`);--> statement-breakpoint
CREATE INDEX `et_event_idx` ON `boffmedia_event_teams` (`event_id`);--> statement-breakpoint
CREATE INDEX `game_idx` ON `boffmedia_events` (`game`);--> statement-breakpoint
CREATE INDEX `pp_achievement_idx` ON `boffmedia_participant_progress` (`achievement_id`);--> statement-breakpoint
CREATE INDEX `pp_participant_idx` ON `boffmedia_participant_progress` (`participant_id`);--> statement-breakpoint
CREATE INDEX `p_user_idx` ON `boffmedia_participants` (`user_id`);