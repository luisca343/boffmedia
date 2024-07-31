CREATE TABLE `rotom_replays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`side1` varchar(32) NOT NULL,
	`side2` varchar(32) NOT NULL,
	`team1` text,
	`team2` text,
	`replay` text NOT NULL,
	`winner` int DEFAULT 0,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_replays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_user_replays` (
	`uuid` char(36) NOT NULL,
	`replay_id` int NOT NULL,
	`side` int DEFAULT 1,
	CONSTRAINT `rotom_user_replays_uuid_replay_id_pk` PRIMARY KEY(`uuid`,`replay_id`)
);
--> statement-breakpoint
ALTER TABLE `rotom_user_replays` ADD CONSTRAINT `rotom_user_replays_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_user_replays` ADD CONSTRAINT `rotom_user_replays_replay_id_rotom_replays_id_fk` FOREIGN KEY (`replay_id`) REFERENCES `rotom_replays`(`id`) ON DELETE cascade ON UPDATE cascade;