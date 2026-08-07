ALTER TABLE `randomizer_events` ADD `pack_id` varchar(32);--> statement-breakpoint
ALTER TABLE `randomizer_events` ADD CONSTRAINT `re_pack_fk` FOREIGN KEY (`pack_id`) REFERENCES `packs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `re_pack_idx` ON `randomizer_events` (`pack_id`);