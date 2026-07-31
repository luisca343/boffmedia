CREATE TABLE `launcher_releases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version` varchar(32) NOT NULL,
	`target` varchar(32) NOT NULL,
	`signature` text NOT NULL,
	`notes` text,
	`artifact_name` varchar(255) NOT NULL,
	`artifact_sha512` char(128) NOT NULL,
	`size_bytes` int unsigned NOT NULL,
	`published` boolean NOT NULL DEFAULT false,
	`published_at` timestamp,
	`uploaded_by` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `launcher_releases_id` PRIMARY KEY(`id`),
	CONSTRAINT `launcher_releases_version_target_idx` UNIQUE(`version`,`target`)
);
--> statement-breakpoint
CREATE INDEX `launcher_releases_target_published_idx` ON `launcher_releases` (`target`,`published`);