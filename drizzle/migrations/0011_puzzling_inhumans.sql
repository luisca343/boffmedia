CREATE TABLE `boffmedia_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(32) NOT NULL,
	CONSTRAINT `boffmedia_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `boffmedia_roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_user_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`roleId` int,
	CONSTRAINT `boffmedia_user_roles_id` PRIMARY KEY(`id`)
);
