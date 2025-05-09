CREATE TABLE `rotom_arcade_streaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`last_claimed` timestamp,
	`streak` int DEFAULT 0,
	`total_claims` int DEFAULT 0,
	CONSTRAINT `rotom_arcade_streaks_id` PRIMARY KEY(`id`)
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
ALTER TABLE `rotom_inventory` ADD CONSTRAINT `rotom_inventory_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_mine_games_detail` DROP COLUMN `claimed`;