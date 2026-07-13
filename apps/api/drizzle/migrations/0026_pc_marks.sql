CREATE TABLE `rotom_pc_marks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_uuid` varchar(64) NOT NULL,
	`pokemon_key` varchar(64) NOT NULL,
	`favorite` boolean NOT NULL DEFAULT false,
	`tags` json NOT NULL DEFAULT ('[]'),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_pc_marks_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_pc_marks_user_key_idx` UNIQUE(`user_uuid`,`pokemon_key`)
);
--> statement-breakpoint
CREATE INDEX `rotom_pc_marks_user_idx` ON `rotom_pc_marks` (`user_uuid`);