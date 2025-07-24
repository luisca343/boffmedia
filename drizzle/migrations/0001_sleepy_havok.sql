ALTER TABLE `user_card_history` RENAME COLUMN `timestamp` TO `date`;--> statement-breakpoint
ALTER TABLE `tcg_cards` MODIFY COLUMN `updated` date;--> statement-breakpoint
ALTER TABLE `user_card_history` MODIFY COLUMN `date` date NOT NULL;--> statement-breakpoint
ALTER TABLE `user_cards` MODIFY COLUMN `acquired_date` date NOT NULL;--> statement-breakpoint
ALTER TABLE `user_cards` MODIFY COLUMN `created_at` date NOT NULL;--> statement-breakpoint
ALTER TABLE `user_cards` MODIFY COLUMN `updated_at` date NOT NULL;