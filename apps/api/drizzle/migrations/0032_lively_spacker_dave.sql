CREATE TABLE `rotom_dungeon_run_players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`run_id` int NOT NULL,
	`uuid` char(36) NOT NULL,
	`nombre` varchar(32) NOT NULL,
	`muertes` int NOT NULL DEFAULT 0,
	`abandono` boolean NOT NULL DEFAULT false,
	CONSTRAINT `rotom_dungeon_run_players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_dungeon_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`server` varchar(64),
	`semilla` varchar(64) NOT NULL,
	`etapa_inicial` int NOT NULL,
	`etapa_final` int NOT NULL,
	`pisos_superados` int NOT NULL,
	`completada` boolean NOT NULL,
	`duracion_ms` bigint NOT NULL,
	`maldiciones` json NOT NULL,
	`monedas_ganadas` int NOT NULL,
	`monedas_gastadas` int NOT NULL,
	`monedas_convertidas` int NOT NULL,
	`fecha` timestamp NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_dungeon_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `rotom_dungeon_run_players` ADD CONSTRAINT `rotom_dungeon_run_players_run_id_rotom_dungeon_runs_id_fk` FOREIGN KEY (`run_id`) REFERENCES `rotom_dungeon_runs`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `idx_dungeon_run_players_uuid` ON `rotom_dungeon_run_players` (`uuid`);--> statement-breakpoint
CREATE INDEX `idx_dungeon_run_players_run` ON `rotom_dungeon_run_players` (`run_id`);