CREATE TABLE `rotom_chat_message_reads` (
	`message_id` int NOT NULL,
	`uuid` varchar(36) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rotom_chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chat_id` int NOT NULL,
	`sender_uuid` varchar(36) NOT NULL,
	`content` varchar(255) NOT NULL,
	`created_at` int NOT NULL,
	CONSTRAINT `rotom_chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_chat_users` (
	`chat_id` int NOT NULL,
	`uuid` varchar(36) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rotom_chats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` varchar(255) NOT NULL,
	`image` varchar(255) NOT NULL,
	`created_at` int NOT NULL,
	`updated_at` int NOT NULL,
	CONSTRAINT `rotom_chats_id` PRIMARY KEY(`id`)
);
