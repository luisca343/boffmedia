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
CREATE TABLE `ficus_messages` (
	`uuid` char(36),
	`id` int AUTO_INCREMENT NOT NULL,
	`content` json,
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
CREATE TABLE `rotom_apps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(32) NOT NULL,
	`url` varchar(255),
	`active` int DEFAULT 1,
	CONSTRAINT `rotom_apps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_user_apps` (
	`uuid` char(36),
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
	`public` int NOT NULL,
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
	`claimed` int NOT NULL DEFAULT 0,
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
CREATE TABLE `rotom_starbank_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(32) NOT NULL,
	`balance` int DEFAULT 0,
	`type` varchar(32) NOT NULL,
	CONSTRAINT `rotom_starbank_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_starbank_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`from` int NOT NULL,
	`to` int NOT NULL,
	`amount` int NOT NULL,
	`from_balance` int NOT NULL,
	`to_balance` int NOT NULL,
	`concept` varchar(255) NOT NULL,
	`type` varchar(32) NOT NULL,
	`date` varchar(32) NOT NULL,
	CONSTRAINT `rotom_starbank_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_starbank_users_accounts` (
	`uuid` varchar(36) NOT NULL,
	`account_id` int NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wingull_invites` (
	`id` varchar(6) NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`username` varchar(32) NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP(),
	`used_at` datetime DEFAULT CURRENT_TIMESTAMP(),
	`deleted_at` datetime,
	CONSTRAINT `wingull_invites_id` PRIMARY KEY(`id`)
);
