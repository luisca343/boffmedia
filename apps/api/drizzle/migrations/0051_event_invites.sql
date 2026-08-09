CREATE TABLE `boffmedia_event_invites` (
	`code` varchar(32) NOT NULL,
	`event_id` int NOT NULL,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`expires_at` timestamp,
	`max_uses` int NOT NULL DEFAULT 1,
	`uses` int NOT NULL DEFAULT 0,
	`revoked` boolean NOT NULL DEFAULT false,
	CONSTRAINT `boffmedia_event_invites_code` PRIMARY KEY(`code`)
);
--> statement-breakpoint
ALTER TABLE `boffmedia_event_invites` ADD CONSTRAINT `ei_event_fk` FOREIGN KEY (`event_id`) REFERENCES `boffmedia_events`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_event_invites` ADD CONSTRAINT `ei_creator_fk` FOREIGN KEY (`created_by`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `ei_event_idx` ON `boffmedia_event_invites` (`event_id`);