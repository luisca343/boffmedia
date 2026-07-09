CREATE TABLE `boffmedia_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(32) NOT NULL,
	CONSTRAINT `boffmedia_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `boffmedia_roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_user_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`roleId` int NOT NULL,
	CONSTRAINT `boffmedia_user_roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(32) NOT NULL,
	`password` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`uuid` char(36),
	`profilePicture` varchar(255) NOT NULL DEFAULT 'https://cdn.boffmedia.es/default-profile.png',
	`googleId` varchar(255),
	`discordId` varchar(255),
	`twitchId` varchar(255),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boffmedia_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `boffmedia_users_username_unique` UNIQUE(`username`),
	CONSTRAINT `boffmedia_users_googleId_unique` UNIQUE(`googleId`),
	CONSTRAINT `boffmedia_users_discordId_unique` UNIQUE(`discordId`),
	CONSTRAINT `boffmedia_users_twitchId_unique` UNIQUE(`twitchId`)
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
	`deleted_at` datetime DEFAULT null,
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
	`deleted_at` datetime DEFAULT null,
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
	`deleted_at` datetime DEFAULT null,
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
	`deleted_at` datetime DEFAULT null,
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
	`winner` varchar(36),
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
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
	`world` varchar(36),
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
CREATE TABLE `tcg_cards` (
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
	`updated` datetime,
	`types` varchar(255),
	`weaknesses` varchar(512),
	`attacks` text,
	`boosters` varchar(512),
	`variants` varchar(255),
	`legal` varchar(100),
	`retreat` int,
	CONSTRAINT `tcg_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tcg_series` (
	`id` varchar(32) NOT NULL,
	`name_en` varchar(64) NOT NULL,
	`name_es` varchar(64) NOT NULL,
	`logo` varchar(255),
	`logo_local` varchar(255),
	CONSTRAINT `tcg_series_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tcg_sets` (
	`id` varchar(32) NOT NULL,
	`series_id` varchar(32) NOT NULL,
	`name_en` varchar(128) NOT NULL,
	`name_es` varchar(128) NOT NULL,
	`logo` varchar(255),
	`symbol` varchar(255),
	`logo_local` varchar(255),
	`symbol_local` varchar(255),
	`card_count_official` int,
	`card_count_total` int,
	CONSTRAINT `tcg_sets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tcg_user_card_history` (
	`id` varchar(32) NOT NULL,
	`user_id` int NOT NULL,
	`card_id` varchar(32) NOT NULL,
	`quantity_change` int NOT NULL,
	`date` datetime NOT NULL,
	CONSTRAINT `tcg_user_card_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tcg_user_cards` (
	`id` varchar(32) NOT NULL,
	`user_id` int NOT NULL,
	`card_id` varchar(32) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`acquired_date` datetime NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `tcg_user_cards_id` PRIMARY KEY(`id`)
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
ALTER TABLE `boffmedia_user_roles` ADD CONSTRAINT `boffmedia_user_roles_userId_boffmedia_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_user_roles` ADD CONSTRAINT `boffmedia_user_roles_roleId_boffmedia_roles_id_fk` FOREIGN KEY (`roleId`) REFERENCES `boffmedia_roles`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_users` ADD CONSTRAINT `boffmedia_users_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_achievements` ADD CONSTRAINT `a_event_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_participants` ADD CONSTRAINT `ep_participant_fk` FOREIGN KEY (`participant_id`) REFERENCES `boffmedia_participants`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_participants` ADD CONSTRAINT `ep_event_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_team_members` ADD CONSTRAINT `etm_team_fk` FOREIGN KEY (`team_id`) REFERENCES `boffmedia_event_teams`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_team_members` ADD CONSTRAINT `etm_participant_fk` FOREIGN KEY (`participant_id`) REFERENCES `boffmedia_participants`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_teams` ADD CONSTRAINT `boffmedia_event_teams_event_id_boffmedia_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_events` ADD CONSTRAINT `boffmedia_events_parent_id_boffmedia_events_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_events` ADD CONSTRAINT `boffmedia_events_game_boffmedia_games_id_fk` FOREIGN KEY (`game`) REFERENCES `boffmedia_games`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_participant_progress` ADD CONSTRAINT `pp_participant_fk` FOREIGN KEY (`participant_id`) REFERENCES `boffmedia_participants`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_participant_progress` ADD CONSTRAINT `pp_achievement_fk` FOREIGN KEY (`achievement_id`) REFERENCES `boffmedia_achievements`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_participants` ADD CONSTRAINT `p_user_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ficus_quotes` ADD CONSTRAINT `ficus_quotes_discord_id_discord_users_user_id_fk` FOREIGN KEY (`discord_id`) REFERENCES `discord_users`(`user_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_inventory` ADD CONSTRAINT `rotom_inventory_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_achievements` ADD CONSTRAINT `rotom_user_achievements_achievement_id_rotom_achievements_id_fk` FOREIGN KEY (`achievement_id`) REFERENCES `rotom_achievements`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_achievements` ADD CONSTRAINT `rotom_user_achievements_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_replays` ADD CONSTRAINT `rotom_user_replays_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_replays` ADD CONSTRAINT `rotom_user_replays_replay_id_rotom_replays_id_fk` FOREIGN KEY (`replay_id`) REFERENCES `rotom_replays`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_apps` ADD CONSTRAINT `rotom_user_apps_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_apps` ADD CONSTRAINT `rotom_user_apps_app_id_rotom_apps_id_fk` FOREIGN KEY (`app_id`) REFERENCES `rotom_apps`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_message_reads` ADD CONSTRAINT `rotom_chat_message_reads_message_id_rotom_chat_messages_id_fk` FOREIGN KEY (`message_id`) REFERENCES `rotom_chat_messages`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_message_reads` ADD CONSTRAINT `rotom_chat_message_reads_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_messages` ADD CONSTRAINT `rotom_chat_messages_chat_id_rotom_chats_id_fk` FOREIGN KEY (`chat_id`) REFERENCES `rotom_chats`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_messages` ADD CONSTRAINT `rotom_chat_messages_sender_uuid_rotom_users_uuid_fk` FOREIGN KEY (`sender_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_users` ADD CONSTRAINT `rotom_chat_users_chat_id_rotom_chats_id_fk` FOREIGN KEY (`chat_id`) REFERENCES `rotom_chats`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_users` ADD CONSTRAINT `rotom_chat_users_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_documents_users` ADD CONSTRAINT `rotom_documents_users_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_documents_users` ADD CONSTRAINT `rotom_documents_users_document_id_rotom_documents_id_fk` FOREIGN KEY (`document_id`) REFERENCES `rotom_documents`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_mine_games` ADD CONSTRAINT `rotom_mine_games_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_mine_games_detail` ADD CONSTRAINT `rotom_mine_games_detail_game_id_rotom_mine_games_id_fk` FOREIGN KEY (`game_id`) REFERENCES `rotom_mine_games`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_mine_games_detail` ADD CONSTRAINT `rotom_mine_games_detail_reward_id_rotom_mine_rewards_id_fk` FOREIGN KEY (`reward_id`) REFERENCES `rotom_mine_rewards`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_pokedex` ADD CONSTRAINT `rotom_pokedex_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_bank_transactions` ADD CONSTRAINT `rotom_bank_transactions_from_rotom_bank_accounts_id_fk` FOREIGN KEY (`from`) REFERENCES `rotom_bank_accounts`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_bank_transactions` ADD CONSTRAINT `rotom_bank_transactions_to_rotom_bank_accounts_id_fk` FOREIGN KEY (`to`) REFERENCES `rotom_bank_accounts`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_bank_users_accounts` ADD CONSTRAINT `rotom_bank_users_accounts_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_bank_users_accounts` ADD CONSTRAINT `rotom_bank_users_accounts_account_id_rotom_bank_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `rotom_bank_accounts`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
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