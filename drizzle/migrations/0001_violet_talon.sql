CREATE TABLE `tcgp_booster_packs` (
	`name` varchar(32) NOT NULL,
	`expansion` varchar(32) NOT NULL,
	CONSTRAINT `tcgp_booster_packs_name` PRIMARY KEY(`name`),
	CONSTRAINT `tcgp_booster_packs_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `tcgp_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expansion` varchar(32) NOT NULL,
	`name` varchar(64) NOT NULL,
	`number` int NOT NULL,
	`rarity` varchar(32) NOT NULL,
	`type` varchar(32) NOT NULL,
	`hp` int,
	`weakness` varchar(32),
	`weakness_value` int,
	`retreat_cost` int,
	CONSTRAINT `tcgp_cards_id` PRIMARY KEY(`id`),
	CONSTRAINT `tcgp_cards_expansion_number_unique` UNIQUE(`expansion`,`number`)
);
--> statement-breakpoint
CREATE TABLE `tcgp_cards_packs` (
	`card_id` int NOT NULL,
	`pack_id` varchar(32) NOT NULL
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
ALTER TABLE `tcgp_booster_packs` ADD CONSTRAINT `tcgp_booster_packs_expansion_tcgp_expansions_id_fk` FOREIGN KEY (`expansion`) REFERENCES `tcgp_expansions`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcgp_cards` ADD CONSTRAINT `tcgp_cards_expansion_tcgp_expansions_id_fk` FOREIGN KEY (`expansion`) REFERENCES `tcgp_expansions`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcgp_cards_packs` ADD CONSTRAINT `tcgp_cards_packs_card_id_tcgp_cards_id_fk` FOREIGN KEY (`card_id`) REFERENCES `tcgp_cards`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcgp_cards_packs` ADD CONSTRAINT `tcgp_cards_packs_pack_id_tcgp_booster_packs_name_fk` FOREIGN KEY (`pack_id`) REFERENCES `tcgp_booster_packs`(`name`) ON DELETE cascade ON UPDATE cascade;