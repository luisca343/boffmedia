CREATE TABLE `rotom_millionaire_answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`question_id` int NOT NULL,
	`player_uuid` char(36) NOT NULL,
	`answer_index` int NOT NULL,
	`is_correct` boolean NOT NULL,
	`time_spent` int NOT NULL,
	`submitted_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_millionaire_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_millionaire_game_states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`question_number` int NOT NULL,
	`question_id` int NOT NULL,
	`player_answer` int,
	`is_correct` boolean,
	`time_spent` int,
	`lifeline_used` varchar(20),
	`state_snapshot` text NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_millionaire_game_states_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_millionaire_players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`uuid` char(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`connection_status` enum('CONNECTED','DISCONNECTED') DEFAULT 'CONNECTED',
	`last_heartbeat` timestamp DEFAULT CURRENT_TIMESTAMP(),
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_millionaire_players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_millionaire_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`text` text NOT NULL,
	`answers` text NOT NULL,
	`correct_answer` int NOT NULL,
	`difficulty_level` int NOT NULL,
	`prize_value` decimal(10,2) NOT NULL,
	`category` varchar(50),
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_millionaire_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_millionaire_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_code` varchar(8) NOT NULL,
	`conductor_uuid` char(36) NOT NULL,
	`status` enum('WAITING','ACTIVE','PAUSED','COMPLETED','CANCELLED') DEFAULT 'WAITING',
	`current_question` int DEFAULT 0,
	`prize_money` decimal(10,2) DEFAULT '0',
	`lifelines_remaining` text DEFAULT ('{"50:50":true,"phone":true,"audience":true}'),
	`question_time_limit` int DEFAULT 30,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_millionaire_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_millionaire_sessions_session_code_unique` UNIQUE(`session_code`)
);
--> statement-breakpoint
ALTER TABLE `rotom_millionaire_answers` ADD CONSTRAINT `mill_answer_session_fk` FOREIGN KEY (`session_id`) REFERENCES `rotom_millionaire_sessions`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_millionaire_answers` ADD CONSTRAINT `mill_answer_question_fk` FOREIGN KEY (`question_id`) REFERENCES `rotom_millionaire_questions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rotom_millionaire_answers` ADD CONSTRAINT `mill_answer_user_fk` FOREIGN KEY (`player_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_millionaire_game_states` ADD CONSTRAINT `mill_state_session_fk` FOREIGN KEY (`session_id`) REFERENCES `rotom_millionaire_sessions`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_millionaire_game_states` ADD CONSTRAINT `mill_state_question_fk` FOREIGN KEY (`question_id`) REFERENCES `rotom_millionaire_questions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rotom_millionaire_players` ADD CONSTRAINT `mill_player_session_fk` FOREIGN KEY (`session_id`) REFERENCES `rotom_millionaire_sessions`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_millionaire_players` ADD CONSTRAINT `mill_player_user_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_millionaire_sessions` ADD CONSTRAINT `rotom_millionaire_sessions_conductor_uuid_rotom_users_uuid_fk` FOREIGN KEY (`conductor_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_millionaire_sessions` ADD CONSTRAINT `mill_session_conductor_fk` FOREIGN KEY (`conductor_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;