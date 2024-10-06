ALTER TABLE `rotom_news` RENAME COLUMN `public` TO `published`;--> statement-breakpoint
ALTER TABLE `rotom_news` MODIFY COLUMN `published` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `rotom_news` ADD `category` varchar(255);--> statement-breakpoint
ALTER TABLE `rotom_news` ADD `featured` int DEFAULT 0 NOT NULL;