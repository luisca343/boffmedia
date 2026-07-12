CREATE TABLE `rotom_chat_message_reactions` (
	`message_id` int NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`emoji` varchar(32) NOT NULL,
	CONSTRAINT `rotom_chat_message_reactions_message_id_uuid_emoji_pk` PRIMARY KEY(`message_id`,`uuid`,`emoji`)
);
--> statement-breakpoint
ALTER TABLE `rotom_chat_users` ADD `pinned` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `rotom_chat_users` ADD `muted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `rotom_chat_message_reactions` ADD CONSTRAINT `rotom_chat_message_reactions_message_id_rotom_chat_messages_id_fk` FOREIGN KEY (`message_id`) REFERENCES `rotom_chat_messages`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_chat_message_reactions` ADD CONSTRAINT `rotom_chat_message_reactions_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;