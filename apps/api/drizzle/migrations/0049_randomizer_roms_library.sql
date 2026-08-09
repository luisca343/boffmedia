CREATE TABLE `randomizer_roms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`game_platform` varchar(8) NOT NULL,
	`sha512` char(128) NOT NULL,
	`file_size` bigint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `randomizer_roms_id` PRIMARY KEY(`id`),
	CONSTRAINT `rr_sha512_unique` UNIQUE(`sha512`)
);
--> statement-breakpoint
ALTER TABLE `randomizer_configs` ADD `rom_id` int;--> statement-breakpoint
CREATE INDEX `rr_platform_idx` ON `randomizer_roms` (`game_platform`);--> statement-breakpoint
ALTER TABLE `randomizer_configs` ADD CONSTRAINT `rc_rom_fk` FOREIGN KEY (`rom_id`) REFERENCES `randomizer_roms`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `rc_rom_idx` ON `randomizer_configs` (`rom_id`);