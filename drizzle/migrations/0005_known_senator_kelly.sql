CREATE TABLE `boffmedia_achievement_progress` (
	`user_id` int NOT NULL,
	`achievement_id` int NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`completed` int NOT NULL DEFAULT 0,
	`completed_at` datetime,
	`last_updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_achievement_progress_user_id_achievement_id_pk` PRIMARY KEY(`user_id`,`achievement_id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(255) NOT NULL,
	`event_id` int,
	`target` int NOT NULL DEFAULT 1,
	`rarity` enum('bronze','silver','gold','platinum','diamond') NOT NULL,
	`points` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_event_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`start_date` datetime NOT NULL,
	`end_date` datetime NOT NULL,
	`medal_id` int,
	`max_progress` int NOT NULL DEFAULT 1,
	`active` int NOT NULL DEFAULT 1,
	CONSTRAINT `boffmedia_event_challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_event_medal_progress` (
	`user_id` int NOT NULL,
	`medal_id` int NOT NULL,
	`current_progress` int NOT NULL DEFAULT 0,
	`earned` int NOT NULL DEFAULT 0,
	`earned_at` datetime,
	`last_updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_event_medal_progress_user_id_medal_id_pk` PRIMARY KEY(`user_id`,`medal_id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_event_medals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(255) NOT NULL,
	`points` int NOT NULL DEFAULT 0,
	`category` enum('placement','challenge','participation') NOT NULL,
	`placement` int,
	`max_progress` int NOT NULL DEFAULT 1,
	`order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_event_medals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_event_participants` (
	`user_id` int NOT NULL,
	`event_id` int NOT NULL,
	`comment` text,
	CONSTRAINT `boffmedia_event_participants_user_id_event_id_pk` PRIMARY KEY(`user_id`,`event_id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_event_team_members` (
	`team_id` int NOT NULL,
	`user_id` int NOT NULL,
	`role` enum('leader','member') NOT NULL DEFAULT 'member',
	`joined_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_event_team_members_team_id_user_id_pk` PRIMARY KEY(`team_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_event_teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` int,
	`name` varchar(255) NOT NULL,
	`tag` varchar(10),
	`icon` varchar(255),
	`leader_id` int,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`total_score` int NOT NULL DEFAULT 0,
	CONSTRAINT `boffmedia_event_teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`game` int,
	`description` text,
	`start_date` datetime NOT NULL,
	`end_date` datetime NOT NULL,
	`type` enum('event','server') NOT NULL,
	CONSTRAINT `boffmedia_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(255) NOT NULL,
	CONSTRAINT `boffmedia_games_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `boffmedia_achievement_progress` ADD CONSTRAINT `bmap_user_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_achievement_progress` ADD CONSTRAINT `bmap_achievement_fk` FOREIGN KEY (`achievement_id`) REFERENCES `boffmedia_achievements`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_achievements` ADD CONSTRAINT `boffmedia_achievements_event_id_boffmedia_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_challenges` ADD CONSTRAINT `boffmedia_event_challenges_event_id_boffmedia_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_challenges` ADD CONSTRAINT `boffmedia_event_challenges_medal_id_boffmedia_event_medals_id_fk` FOREIGN KEY (`medal_id`) REFERENCES `boffmedia_event_medals`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_medal_progress` ADD CONSTRAINT `fk_user_id` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_medal_progress` ADD CONSTRAINT `fk_medal_id` FOREIGN KEY (`medal_id`) REFERENCES `boffmedia_event_medals`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_medals` ADD CONSTRAINT `boffmedia_event_medals_event_id_boffmedia_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_participants` ADD CONSTRAINT `boffmedia_event_participants_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_participants` ADD CONSTRAINT `boffmedia_event_participants_event_id_boffmedia_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_team_members` ADD CONSTRAINT `boffmedia_event_team_members_team_id_boffmedia_event_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `boffmedia_event_teams`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_team_members` ADD CONSTRAINT `boffmedia_event_team_members_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_teams` ADD CONSTRAINT `boffmedia_event_teams_event_id_boffmedia_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_teams` ADD CONSTRAINT `boffmedia_event_teams_leader_id_boffmedia_users_id_fk` FOREIGN KEY (`leader_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_events` ADD CONSTRAINT `boffmedia_events_game_boffmedia_games_id_fk` FOREIGN KEY (`game`) REFERENCES `boffmedia_games`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `achievement_id_idx` ON `boffmedia_achievement_progress` (`achievement_id`);--> statement-breakpoint
CREATE INDEX `medal_id_idx` ON `boffmedia_event_medal_progress` (`medal_id`);