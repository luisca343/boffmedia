CREATE TABLE `mina_partidas_detalle` (
	`id` int AUTO_INCREMENT NOT NULL,
	`id_partida` int NOT NULL,
	`id_recompensa` int NOT NULL,
	`valor` int NOT NULL,
	`reclamada` int NOT NULL DEFAULT 0,
	CONSTRAINT `mina_partidas_detalle_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mina_partidas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` char(36) NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `mina_partidas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mina_recompensas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`valor` int NOT NULL,
	`nombre` varchar(32) NOT NULL,
	`tipo` varchar(32) NOT NULL,
	`ancho` int NOT NULL,
	`alto` int NOT NULL,
	CONSTRAINT `mina_recompensas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `smartrotom_users` ADD `energia` int DEFAULT 10;