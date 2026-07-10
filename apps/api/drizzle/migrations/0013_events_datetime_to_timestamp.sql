ALTER TABLE `boffmedia_achievements` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `boffmedia_achievements` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `boffmedia_achievements` MODIFY COLUMN `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `boffmedia_event_participants` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `boffmedia_event_participants` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `boffmedia_event_suggestions` MODIFY COLUMN `suggested_date` timestamp;--> statement-breakpoint
ALTER TABLE `boffmedia_event_suggestions` MODIFY COLUMN `end_date` timestamp;--> statement-breakpoint
ALTER TABLE `boffmedia_event_suggestions` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `boffmedia_event_suggestions` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `boffmedia_event_team_members` MODIFY COLUMN `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `boffmedia_event_team_members` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `boffmedia_event_teams` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `boffmedia_event_teams` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `boffmedia_event_teams` MODIFY COLUMN `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `boffmedia_events` MODIFY COLUMN `start_date` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `boffmedia_events` MODIFY COLUMN `end_date` timestamp;--> statement-breakpoint
ALTER TABLE `boffmedia_events` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `boffmedia_events` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `boffmedia_events` MODIFY COLUMN `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `boffmedia_games` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `boffmedia_games` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `boffmedia_games` MODIFY COLUMN `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `boffmedia_participant_progress` MODIFY COLUMN `completed_at` timestamp;--> statement-breakpoint
ALTER TABLE `boffmedia_participant_progress` MODIFY COLUMN `last_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `boffmedia_participant_progress` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `boffmedia_participants` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `boffmedia_participants` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP();