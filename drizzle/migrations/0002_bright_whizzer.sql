ALTER TABLE `tcg_cards` MODIFY COLUMN `updated` varchar(40);--> statement-breakpoint
ALTER TABLE `user_card_history` MODIFY COLUMN `date` varchar(40) NOT NULL;--> statement-breakpoint
ALTER TABLE `user_cards` MODIFY COLUMN `acquired_date` varchar(40) NOT NULL;--> statement-breakpoint
ALTER TABLE `user_cards` MODIFY COLUMN `created_at` varchar(40) NOT NULL;--> statement-breakpoint
ALTER TABLE `user_cards` MODIFY COLUMN `updated_at` varchar(40) NOT NULL;