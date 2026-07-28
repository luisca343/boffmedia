CREATE TABLE `rotom_kart_race_players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`race_id` int NOT NULL,
	`uuid` char(36) NOT NULL,
	`nombre` varchar(32) NOT NULL,
	`posicion` int NOT NULL,
	`tiempo_ms` int NOT NULL,
	`mejor_vuelta_ms` int NOT NULL,
	`vueltas_completadas` int NOT NULL DEFAULT 0,
	`dnf` boolean NOT NULL DEFAULT false,
	CONSTRAINT `rotom_kart_race_players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_kart_races` (
	`id` int AUTO_INCREMENT NOT NULL,
	`server` varchar(64),
	`circuito` varchar(128) NOT NULL,
	`modo` varchar(32) NOT NULL,
	`vueltas` int NOT NULL,
	`fecha` timestamp NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `rotom_kart_races_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `rotom_kart_race_players` ADD CONSTRAINT `rotom_kart_race_players_race_id_rotom_kart_races_id_fk` FOREIGN KEY (`race_id`) REFERENCES `rotom_kart_races`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `idx_kart_race_players_uuid` ON `rotom_kart_race_players` (`uuid`);--> statement-breakpoint
CREATE INDEX `idx_kart_race_players_race` ON `rotom_kart_race_players` (`race_id`);--> statement-breakpoint
CREATE INDEX `idx_kart_races_circuito` ON `rotom_kart_races` (`circuito`);--> statement-breakpoint
CREATE INDEX `idx_kart_races_modo` ON `rotom_kart_races` (`modo`);