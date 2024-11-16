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
ALTER TABLE `tcgp_user_card_history` ADD CONSTRAINT `tcgp_user_card_history_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;