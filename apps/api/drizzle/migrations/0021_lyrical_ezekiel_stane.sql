ALTER TABLE `tools_battlesim_teams` ADD `favorite` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tools_battlesim_teams` ADD `pinned` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tools_battlesim_teams` ADD `notes` text;