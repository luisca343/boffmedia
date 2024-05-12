ALTER TABLE `rotom_chat_messages` MODIFY COLUMN `created_at` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `rotom_chats` MODIFY COLUMN `created_at` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `rotom_chats` MODIFY COLUMN `updated_at` timestamp NOT NULL;