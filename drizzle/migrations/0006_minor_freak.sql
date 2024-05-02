CREATE TABLE `rotom_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` int NOT NULL,
	`public` int NOT NULL,
	`content` text NOT NULL,
	`created_at` date NOT NULL,
	`updated_at` date NOT NULL,
	CONSTRAINT `rotom_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_documents_users` (
	`uuid` varchar(36) NOT NULL,
	`document_id` int NOT NULL
);
