CREATE TABLE `rotom_rooker_bookmarks` (
	`post_id` int NOT NULL,
	`uuid` char(36) NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_rooker_bookmarks_post_id_uuid_pk` PRIMARY KEY(`post_id`,`uuid`)
);
--> statement-breakpoint
CREATE TABLE `rotom_rooker_follows` (
	`follower_uuid` char(36) NOT NULL,
	`followee_uuid` char(36) NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_rooker_follows_follower_uuid_followee_uuid_pk` PRIMARY KEY(`follower_uuid`,`followee_uuid`)
);
--> statement-breakpoint
CREATE TABLE `rotom_rooker_hashtags` (
	`post_id` int NOT NULL,
	`tag` varchar(64) NOT NULL,
	CONSTRAINT `rotom_rooker_hashtags_post_id_tag_pk` PRIMARY KEY(`post_id`,`tag`)
);
--> statement-breakpoint
CREATE TABLE `rotom_rooker_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` char(36) NOT NULL,
	`text` varchar(280),
	`type` varchar(16) NOT NULL DEFAULT 'text',
	`parent_id` int,
	`pinned` int DEFAULT 0,
	`media_url` varchar(512),
	`capture_id` int,
	`replay_id` int,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_rooker_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_rooker_profiles` (
	`uuid` char(36) NOT NULL,
	`handle` varchar(32) NOT NULL,
	`display_name` varchar(48),
	`bio` varchar(280),
	`link` varchar(120),
	`partner_pokemon_id` int,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_rooker_profiles_uuid` PRIMARY KEY(`uuid`),
	CONSTRAINT `rotom_rooker_profiles_handle_unique` UNIQUE(`handle`)
);
--> statement-breakpoint
CREATE TABLE `rotom_rooker_reactions` (
	`post_id` int NOT NULL,
	`uuid` char(36) NOT NULL,
	`type` varchar(12) NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_rooker_reactions_post_id_uuid_pk` PRIMARY KEY(`post_id`,`uuid`)
);
--> statement-breakpoint
CREATE TABLE `rotom_rooker_retrinos` (
	`post_id` int NOT NULL,
	`uuid` char(36) NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_rooker_retrinos_post_id_uuid_pk` PRIMARY KEY(`post_id`,`uuid`)
);
--> statement-breakpoint
ALTER TABLE `rotom_rooker_bookmarks` ADD CONSTRAINT `rotom_rooker_bookmarks_post_id_rotom_rooker_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `rotom_rooker_posts`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_bookmarks` ADD CONSTRAINT `rotom_rooker_bookmarks_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_follows` ADD CONSTRAINT `rotom_rooker_follows_follower_uuid_rotom_users_uuid_fk` FOREIGN KEY (`follower_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_follows` ADD CONSTRAINT `rotom_rooker_follows_followee_uuid_rotom_users_uuid_fk` FOREIGN KEY (`followee_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_hashtags` ADD CONSTRAINT `rotom_rooker_hashtags_post_id_rotom_rooker_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `rotom_rooker_posts`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_posts` ADD CONSTRAINT `rotom_rooker_posts_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_posts` ADD CONSTRAINT `rotom_rooker_posts_capture_id_rotom_pokedex_id_fk` FOREIGN KEY (`capture_id`) REFERENCES `rotom_pokedex`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_posts` ADD CONSTRAINT `rotom_rooker_posts_replay_id_rotom_replays_id_fk` FOREIGN KEY (`replay_id`) REFERENCES `rotom_replays`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_posts` ADD CONSTRAINT `rotom_rooker_posts_parent_fk` FOREIGN KEY (`parent_id`) REFERENCES `rotom_rooker_posts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rotom_rooker_profiles` ADD CONSTRAINT `rotom_rooker_profiles_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_reactions` ADD CONSTRAINT `rotom_rooker_reactions_post_id_rotom_rooker_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `rotom_rooker_posts`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_reactions` ADD CONSTRAINT `rotom_rooker_reactions_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_retrinos` ADD CONSTRAINT `rotom_rooker_retrinos_post_id_rotom_rooker_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `rotom_rooker_posts`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_rooker_retrinos` ADD CONSTRAINT `rotom_rooker_retrinos_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `rotom_rooker_follows_followee_idx` ON `rotom_rooker_follows` (`followee_uuid`);--> statement-breakpoint
CREATE INDEX `rotom_rooker_hashtags_tag_idx` ON `rotom_rooker_hashtags` (`tag`,`post_id`);--> statement-breakpoint
CREATE INDEX `rotom_rooker_posts_uuid_idx` ON `rotom_rooker_posts` (`uuid`);--> statement-breakpoint
CREATE INDEX `rotom_rooker_posts_parent_idx` ON `rotom_rooker_posts` (`parent_id`);--> statement-breakpoint
CREATE INDEX `rotom_rooker_posts_created_idx` ON `rotom_rooker_posts` (`created_at`);