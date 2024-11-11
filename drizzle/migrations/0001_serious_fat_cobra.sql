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
CREATE TABLE `tcgp_users_cards` (
	`user_id` int NOT NULL,
	`expansion` varchar(32) NOT NULL,
	`card_number` int NOT NULL,
	`count` int NOT NULL,
	`obtained_at` datetime NOT NULL,
	CONSTRAINT `tcgp_users_cards_user_id_expansion_card_number_pk` PRIMARY KEY(`user_id`,`expansion`,`card_number`)
);
--> statement-breakpoint
ALTER TABLE `tcgp_booster_packs` ADD CONSTRAINT `tcgp_booster_packs_expansion_tcgp_expansions_id_fk` FOREIGN KEY (`expansion`) REFERENCES `tcgp_expansions`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcgp_cards` ADD CONSTRAINT `tcgp_cards_expansion_tcgp_expansions_id_fk` FOREIGN KEY (`expansion`) REFERENCES `tcgp_expansions`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcgp_cards_packs` ADD CONSTRAINT `tcgp_cards_packs_expansion_tcgp_cards_expansion_fk` FOREIGN KEY (`expansion`) REFERENCES `tcgp_cards`(`expansion`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcgp_cards_packs` ADD CONSTRAINT `tcgp_cards_packs_pack_id_tcgp_booster_packs_name_fk` FOREIGN KEY (`pack_id`) REFERENCES `tcgp_booster_packs`(`name`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcgp_users_cards` ADD CONSTRAINT `tcgp_users_cards_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcgp_users_cards` ADD CONSTRAINT `tcgp_users_cards_expansion_tcgp_cards_expansion_fk` FOREIGN KEY (`expansion`) REFERENCES `tcgp_cards`(`expansion`) ON DELETE cascade ON UPDATE cascade;