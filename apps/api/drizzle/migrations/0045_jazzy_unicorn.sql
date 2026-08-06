ALTER TABLE `pack_versions` MODIFY COLUMN `minecraft` varchar(32);--> statement-breakpoint
ALTER TABLE `pack_versions` ADD `emulator` json;--> statement-breakpoint
ALTER TABLE `packs` ADD `game_type` varchar(16) DEFAULT 'minecraft' NOT NULL;