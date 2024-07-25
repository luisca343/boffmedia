ALTER TABLE `rotom_user_achievements` MODIFY COLUMN `achievement_id` varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE `rotom_user_achievements` MODIFY COLUMN `uuid` char(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `rotom_achievements` ADD `order` int DEFAULT 0;