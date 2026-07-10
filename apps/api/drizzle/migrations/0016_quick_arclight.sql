CREATE TABLE `boffmedia_forum_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(64) NOT NULL,
	`hue` int NOT NULL DEFAULT 28,
	`locked` boolean NOT NULL DEFAULT false,
	`position` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	`deleted_at` timestamp,
	CONSTRAINT `boffmedia_forum_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `fc_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_forum_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`thread_id` int NOT NULL,
	`user_id` int NOT NULL,
	`body` text NOT NULL,
	`is_solution` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	`deleted_at` timestamp,
	CONSTRAINT `boffmedia_forum_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_forum_threads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category_id` int NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`pinned` boolean NOT NULL DEFAULT false,
	`locked` boolean NOT NULL DEFAULT false,
	`solved` boolean NOT NULL DEFAULT false,
	`view_count` int NOT NULL DEFAULT 0,
	`reply_count` int NOT NULL DEFAULT 0,
	`vote_count` int NOT NULL DEFAULT 0,
	`last_post_at` timestamp,
	`last_post_user_id` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	`deleted_at` timestamp,
	CONSTRAINT `boffmedia_forum_threads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_forum_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`thread_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_forum_votes_id` PRIMARY KEY(`id`),
	CONSTRAINT `fv_user_thread_idx` UNIQUE(`user_id`,`thread_id`)
);
--> statement-breakpoint
ALTER TABLE `boffmedia_users` ADD `last_seen_at` timestamp;--> statement-breakpoint
ALTER TABLE `boffmedia_forum_posts` ADD CONSTRAINT `fp_thread_fk` FOREIGN KEY (`thread_id`) REFERENCES `boffmedia_forum_threads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boffmedia_forum_posts` ADD CONSTRAINT `fp_author_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boffmedia_forum_threads` ADD CONSTRAINT `ft_category_fk` FOREIGN KEY (`category_id`) REFERENCES `boffmedia_forum_categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boffmedia_forum_threads` ADD CONSTRAINT `ft_author_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boffmedia_forum_threads` ADD CONSTRAINT `ft_lastpost_fk` FOREIGN KEY (`last_post_user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boffmedia_forum_votes` ADD CONSTRAINT `fv_user_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boffmedia_forum_votes` ADD CONSTRAINT `fv_thread_fk` FOREIGN KEY (`thread_id`) REFERENCES `boffmedia_forum_threads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `fp_thread_idx` ON `boffmedia_forum_posts` (`thread_id`);--> statement-breakpoint
CREATE INDEX `ft_category_idx` ON `boffmedia_forum_threads` (`category_id`);--> statement-breakpoint
CREATE INDEX `ft_last_post_idx` ON `boffmedia_forum_threads` (`last_post_at`);