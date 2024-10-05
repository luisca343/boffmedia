CREATE TABLE `rotom_news` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` varchar(255),
	`subcategory` varchar(255),
	`public` int NOT NULL,
	`content` text NOT NULL,
	`button_text` varchar(255),
	`image_url` varchar(255),
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `rotom_news_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `rotom_documents` DROP COLUMN `public`;