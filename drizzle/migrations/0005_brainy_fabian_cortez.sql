ALTER TABLE `rotom_user_achievements` RENAME COLUMN `data` TO `data_id`;--> statement-breakpoint
ALTER TABLE `rotom_user_achievements` MODIFY COLUMN `data_id` int;--> statement-breakpoint
ALTER TABLE `rotom_user_achievements` MODIFY COLUMN `data_id` int DEFAULT 0;