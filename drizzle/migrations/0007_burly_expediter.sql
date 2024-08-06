CREATE TABLE `ficus_quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`discord_id` varchar(32) NOT NULL,
	`server_id` varchar(32) NOT NULL,
	`quote` text NOT NULL,
	`comment` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` datetime,
	CONSTRAINT `ficus_quotes_id` PRIMARY KEY(`id`)
);
