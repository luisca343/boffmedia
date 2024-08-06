CREATE TABLE `discord_users` (
	`user_id` varchar(32) NOT NULL,
	`username` varchar(32) NOT NULL,
	`avatar` varchar(255),
	`color` varchar(6),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime,
	CONSTRAINT `discord_users_user_id` PRIMARY KEY(`user_id`)
);
