CREATE TABLE `rotom_pasaporte_profiles` (
	`uuid` char(36) NOT NULL,
	`trainer_id` varchar(16) NOT NULL,
	`region` varchar(32) NOT NULL DEFAULT 'Fukitsu',
	`member_since` timestamp DEFAULT CURRENT_TIMESTAMP(),
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_pasaporte_profiles_uuid` PRIMARY KEY(`uuid`),
	CONSTRAINT `rotom_pasaporte_profiles_trainer_id_unique` UNIQUE(`trainer_id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_pasaporte_seasons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`starts_at` timestamp NOT NULL,
	`ends_at` timestamp NOT NULL,
	`active` int DEFAULT 1,
	CONSTRAINT `rotom_pasaporte_seasons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `rotom_achievements` ADD `points` int DEFAULT 10;--> statement-breakpoint
ALTER TABLE `rotom_achievements` ADD `tier` varchar(16) DEFAULT 'bronce';--> statement-breakpoint
ALTER TABLE `rotom_pasaporte_profiles` ADD CONSTRAINT `rotom_pasaporte_profiles_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;