CREATE TABLE `test` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text,
	`email` text,
	`password` text,
	`role` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `test_id` PRIMARY KEY(`id`)
);
