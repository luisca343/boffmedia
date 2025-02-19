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
	`order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_event_participants` (
	`user_id` int NOT NULL,
	`event_id` int NOT NULL,
	`comment` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_event_participants_user_id_event_id_pk` PRIMARY KEY(`user_id`,`event_id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_event_team_members` (
	`team_id` int NOT NULL,
	`user_id` int NOT NULL,
	`role` enum('leader','member') NOT NULL DEFAULT 'member',
	`joined_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_event_team_members_team_id_user_id_pk` PRIMARY KEY(`team_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_event_teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` int,
	`name` varchar(255) NOT NULL,
	`tag` varchar(10),
	`icon` varchar(255),
	`total_score` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_event_teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`game` int,
	`description` text,
	`icon` varchar(255) NOT NULL,
	`banner` varchar(255),
	`start_date` datetime NOT NULL,
	`end_date` datetime NOT NULL,
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
CREATE TABLE `boffmedia_points_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` int,
	`category` varchar(50) NOT NULL,
	`multiplier` int NOT NULL DEFAULT 100,
	`rules` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_points_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_points_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`event_id` int,
	`team_id` int,
	`achievement_id` int,
	`points_awarded` int NOT NULL,
	`reason` varchar(255) NOT NULL,
	`metadata` text,
	`awarded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_points_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_user_progress` (
	`user_id` int NOT NULL,
	`achievement_id` int NOT NULL,
	`current_progress` int NOT NULL DEFAULT 0,
	`is_completed` int NOT NULL DEFAULT 0,
	`completed_at` datetime,
	`last_updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_user_progress_user_id_achievement_id_pk` PRIMARY KEY(`user_id`,`achievement_id`)
);
--> statement-breakpoint
ALTER TABLE `boffmedia_achievements` ADD CONSTRAINT `a_event_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_participants` ADD CONSTRAINT `ep_user_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_participants` ADD CONSTRAINT `ep_event_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_team_members` ADD CONSTRAINT `boffmedia_event_team_members_team_id_boffmedia_event_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `boffmedia_event_teams`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_team_members` ADD CONSTRAINT `boffmedia_event_team_members_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_teams` ADD CONSTRAINT `boffmedia_event_teams_event_id_boffmedia_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_events` ADD CONSTRAINT `boffmedia_events_game_boffmedia_games_id_fk` FOREIGN KEY (`game`) REFERENCES `boffmedia_games`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_points_config` ADD CONSTRAINT `pc_event_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_points_history` ADD CONSTRAINT `ph_user_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_points_history` ADD CONSTRAINT `ph_event_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_points_history` ADD CONSTRAINT `ph_team_fk` FOREIGN KEY (`team_id`) REFERENCES `boffmedia_event_teams`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_points_history` ADD CONSTRAINT `ph_achievement_fk` FOREIGN KEY (`achievement_id`) REFERENCES `boffmedia_achievements`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_user_progress` ADD CONSTRAINT `up_user_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_user_progress` ADD CONSTRAINT `up_achievement_fk` FOREIGN KEY (`achievement_id`) REFERENCES `boffmedia_achievements`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `a_event_idx` ON `boffmedia_achievements` (`event_id`);--> statement-breakpoint
CREATE INDEX `a_category_idx` ON `boffmedia_achievements` (`category`);--> statement-breakpoint
CREATE INDEX `ep_event_idx` ON `boffmedia_event_participants` (`event_id`);--> statement-breakpoint
CREATE INDEX `etm_role_idx` ON `boffmedia_event_team_members` (`team_id`,`role`);--> statement-breakpoint
CREATE INDEX `et_event_idx` ON `boffmedia_event_teams` (`event_id`);--> statement-breakpoint
CREATE INDEX `game_idx` ON `boffmedia_events` (`game`);--> statement-breakpoint
CREATE INDEX `pc_event_idx` ON `boffmedia_points_config` (`event_id`);--> statement-breakpoint
CREATE INDEX `pc_category_idx` ON `boffmedia_points_config` (`category`);--> statement-breakpoint
CREATE INDEX `ph_user_idx` ON `boffmedia_points_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `ph_event_idx` ON `boffmedia_points_history` (`event_id`);--> statement-breakpoint
CREATE INDEX `ph_team_idx` ON `boffmedia_points_history` (`team_id`);--> statement-breakpoint
CREATE INDEX `ph_achievement_idx` ON `boffmedia_points_history` (`achievement_id`);--> statement-breakpoint
CREATE INDEX `up_achievement_idx` ON `boffmedia_user_progress` (`achievement_id`);--> statement-breakpoint
CREATE INDEX `up_user_idx` ON `boffmedia_user_progress` (`user_id`);