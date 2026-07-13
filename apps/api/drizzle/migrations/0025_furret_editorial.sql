CREATE TABLE `rotom_news_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`news_id` int NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`body` varchar(500) NOT NULL,
	`created_at` timestamp NOT NULL,
	CONSTRAINT `rotom_news_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_newsletter_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL,
	CONSTRAINT `rotom_newsletter_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotom_newsletter_subscribers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `rotom_news` ADD `author` varchar(255);--> statement-breakpoint
ALTER TABLE `rotom_news` ADD `author_role` varchar(255);--> statement-breakpoint
ALTER TABLE `rotom_news` ADD `issue` int;--> statement-breakpoint
ALTER TABLE `rotom_news` ADD `claps` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `rotom_news_comments` ADD CONSTRAINT `rotom_news_comments_news_id_rotom_news_id_fk` FOREIGN KEY (`news_id`) REFERENCES `rotom_news`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_news_comments` ADD CONSTRAINT `rotom_news_comments_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;