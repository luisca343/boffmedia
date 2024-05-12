ALTER TABLE `rotom_chat_messages` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `rotom_chats` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `rotom_chats` MODIFY COLUMN `updated_at` timestamp;