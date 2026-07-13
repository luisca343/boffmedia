CREATE TABLE `gobierno_anuncios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` varchar(16) NOT NULL DEFAULT 'anuncio',
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`town` varchar(64),
	`author_uuid` varchar(36) NOT NULL,
	`pinned` tinyint NOT NULL DEFAULT 0,
	`audience` varchar(16) NOT NULL DEFAULT 'public',
	`published_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gobierno_anuncios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_apelaciones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`multa_id` int NOT NULL,
	`player_uuid` varchar(36) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'pending',
	`grounds` text NOT NULL,
	`reviewer_uuid` varchar(36),
	`decision` text,
	`resolved_at` timestamp,
	`refund_tx_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gobierno_apelaciones_id` PRIMARY KEY(`id`),
	CONSTRAINT `gobierno_apelaciones_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_auditoria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actor_uuid` varchar(36) NOT NULL,
	`action` varchar(32) NOT NULL,
	`target` varchar(255) NOT NULL,
	`dep` varchar(32) NOT NULL,
	`source` varchar(16) NOT NULL DEFAULT 'gobierno',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gobierno_auditoria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_bitacora` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patrulla_id` int,
	`uuid` varchar(36) NOT NULL,
	`text` text NOT NULL,
	`tone` varchar(16) NOT NULL DEFAULT 'info',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gobierno_bitacora_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_buscados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`player_uuid` varchar(36) NOT NULL,
	`severity` varchar(16) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'active',
	`bounty` bigint NOT NULL DEFAULT 0,
	`offense` varchar(255) NOT NULL,
	`reported_by` varchar(36) NOT NULL,
	`last_seen` varchar(128),
	`notes` text,
	`captured_by` varchar(36),
	`captured_at` timestamp,
	`payout_tx_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gobierno_buscados_id` PRIMARY KEY(`id`),
	CONSTRAINT `gobierno_buscados_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_carteles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`highway` varchar(64) NOT NULL,
	`destinations` json,
	`created_by` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gobierno_carteles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_denuncias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`town` varchar(64),
	`plot_number` int,
	`accused_uuid` varchar(36),
	`reporter_uuid` varchar(36) NOT NULL,
	`category` varchar(32) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'pending',
	`description` text NOT NULL,
	`resolution` text,
	`resolved_by` varchar(36),
	`resolved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gobierno_denuncias_id` PRIMARY KEY(`id`),
	CONSTRAINT `gobierno_denuncias_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_evento_capturas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evento_id` int NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`species` varchar(64) NOT NULL,
	`level` int NOT NULL,
	`ivs_total` int NOT NULL,
	`shiny` tinyint NOT NULL DEFAULT 0,
	`size` decimal(6,2),
	`score` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gobierno_evento_capturas_id` PRIMARY KEY(`id`),
	CONSTRAINT `gob_capturas_evento_uuid_uq` UNIQUE(`evento_id`,`uuid`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_evento_especies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evento_id` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`rarity` varchar(32) NOT NULL,
	`rarity_pts` int NOT NULL DEFAULT 0,
	`spawn_pct` decimal(5,2) NOT NULL DEFAULT '0',
	`shiny_pct` decimal(5,2) NOT NULL DEFAULT '0',
	`lvl_min` int NOT NULL DEFAULT 1,
	`lvl_max` int NOT NULL DEFAULT 100,
	CONSTRAINT `gobierno_evento_especies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_evento_obras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evento_id` int NOT NULL,
	`town` varchar(64) NOT NULL,
	`build_name` varchar(255) NOT NULL,
	`description` text,
	`builders` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gobierno_evento_obras_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_evento_votos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`obra_id` int NOT NULL,
	`voter_uuid` varchar(36) NOT NULL,
	`diseno` int NOT NULL,
	`ambicion` int NOT NULL,
	`fidelidad` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gobierno_evento_votos_id` PRIMARY KEY(`id`),
	CONSTRAINT `gob_votos_obra_voter_uq` UNIQUE(`obra_id`,`voter_uuid`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_eventos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`type` varchar(16) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'upcoming',
	`title` varchar(255) NOT NULL,
	`brief` text,
	`prize` varchar(255),
	`crew` varchar(128),
	`build_closed_at` timestamp,
	`rating_opens_at` timestamp,
	`rating_closes_at` timestamp,
	`winner_town` varchar(64),
	`zone` varchar(128),
	`coords_x` int,
	`coords_z` int,
	`radius` int,
	`opens_at` timestamp,
	`closes_at` timestamp,
	`rules` text,
	`weights` json,
	`created_by` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gobierno_eventos_id` PRIMARY KEY(`id`),
	CONSTRAINT `gobierno_eventos_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_expediente_eventos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expediente_id` int NOT NULL,
	`kind` varchar(16) NOT NULL,
	`ref` varchar(32),
	`text` text NOT NULL,
	`at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gobierno_expediente_eventos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_expedientes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`title` varchar(255) NOT NULL,
	`subject_uuid` varchar(36) NOT NULL,
	`dep` varchar(32) NOT NULL DEFAULT 'justicia',
	`status` varchar(16) NOT NULL DEFAULT 'open',
	`severity` varchar(16) NOT NULL DEFAULT 'medium',
	`lead_uuid` varchar(36) NOT NULL,
	`opened_at` timestamp NOT NULL DEFAULT (now()),
	`closed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gobierno_expedientes_id` PRIMARY KEY(`id`),
	CONSTRAINT `gobierno_expedientes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_megafonia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`speaker` varchar(64) NOT NULL,
	`text` text NOT NULL,
	`by_uuid` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gobierno_megafonia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_multas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`player_uuid` varchar(36) NOT NULL,
	`amount` bigint NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'pending',
	`reason` varchar(255) NOT NULL,
	`issued_by` varchar(36) NOT NULL,
	`denuncia_id` int,
	`paid_tx_id` int,
	`paid_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gobierno_multas_id` PRIMARY KEY(`id`),
	CONSTRAINT `gobierno_multas_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_npc_skins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`skin` varchar(64) NOT NULL,
	`npcs` json,
	`src` tinyint NOT NULL DEFAULT 0,
	`face` tinyint NOT NULL DEFAULT 0,
	`head` tinyint NOT NULL DEFAULT 0,
	`body` tinyint NOT NULL DEFAULT 0,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gobierno_npc_skins_id` PRIMARY KEY(`id`),
	CONSTRAINT `gobierno_npc_skins_skin_unique` UNIQUE(`skin`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_parcela_historial` (
	`id` int AUTO_INCREMENT NOT NULL,
	`region_id` varchar(128) NOT NULL,
	`town` varchar(64) NOT NULL,
	`number` int NOT NULL,
	`previous_owner_uuid` varchar(36),
	`new_owner_uuid` varchar(36),
	`reason` varchar(255),
	`changed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gobierno_parcela_historial_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_parcelas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`region_id` varchar(128) NOT NULL,
	`town` varchar(64) NOT NULL,
	`number` int NOT NULL,
	`zona_id` int,
	`status` varchar(16) NOT NULL DEFAULT 'ocupada',
	`tax_amount` bigint NOT NULL DEFAULT 500,
	`tax_due_at` timestamp,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gobierno_parcelas_id` PRIMARY KEY(`id`),
	CONSTRAINT `gob_parcelas_region_uq` UNIQUE(`region_id`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_patrulla_oficiales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patrulla_id` int NOT NULL,
	`uuid` varchar(36) NOT NULL,
	CONSTRAINT `gobierno_patrulla_oficiales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_patrullas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`label` varchar(64) NOT NULL,
	`from_time` varchar(8) NOT NULL,
	`to_time` varchar(8) NOT NULL,
	`zone` varchar(128),
	`status` varchar(16) NOT NULL DEFAULT 'rest',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gobierno_patrullas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_pujas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subasta_id` int NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`amount` bigint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gobierno_pujas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_subastas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`region_id` varchar(128) NOT NULL,
	`town` varchar(64) NOT NULL,
	`number` int NOT NULL,
	`start_bid` bigint NOT NULL,
	`current_bid` bigint NOT NULL,
	`bidder_uuid` varchar(36),
	`bids` int NOT NULL DEFAULT 0,
	`reason` varchar(255),
	`status` varchar(16) NOT NULL DEFAULT 'live',
	`ends_at` timestamp NOT NULL,
	`settled_tx_id` int,
	`created_by` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gobierno_subastas_id` PRIMARY KEY(`id`),
	CONSTRAINT `gobierno_subastas_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_tasas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`concept` varchar(128) NOT NULL,
	`kind` varchar(32) NOT NULL,
	`rate` varchar(64) NOT NULL,
	`amount` bigint NOT NULL DEFAULT 0,
	`active` tinyint NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gobierno_tasas_id` PRIMARY KEY(`id`),
	CONSTRAINT `gobierno_tasas_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `gobierno_zonas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`town` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`kind` varchar(32) NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gobierno_zonas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `gobierno_apelaciones` ADD CONSTRAINT `gobierno_apelaciones_multa_id_gobierno_multas_id_fk` FOREIGN KEY (`multa_id`) REFERENCES `gobierno_multas`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `gobierno_apelaciones` ADD CONSTRAINT `gobierno_apelaciones_refund_tx_id_rotom_bank_transactions_id_fk` FOREIGN KEY (`refund_tx_id`) REFERENCES `rotom_bank_transactions`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `gobierno_bitacora` ADD CONSTRAINT `gobierno_bitacora_patrulla_id_gobierno_patrullas_id_fk` FOREIGN KEY (`patrulla_id`) REFERENCES `gobierno_patrullas`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `gobierno_buscados` ADD CONSTRAINT `gobierno_buscados_payout_tx_id_rotom_bank_transactions_id_fk` FOREIGN KEY (`payout_tx_id`) REFERENCES `rotom_bank_transactions`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `gobierno_evento_capturas` ADD CONSTRAINT `gobierno_evento_capturas_evento_id_gobierno_eventos_id_fk` FOREIGN KEY (`evento_id`) REFERENCES `gobierno_eventos`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `gobierno_evento_especies` ADD CONSTRAINT `gobierno_evento_especies_evento_id_gobierno_eventos_id_fk` FOREIGN KEY (`evento_id`) REFERENCES `gobierno_eventos`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `gobierno_evento_obras` ADD CONSTRAINT `gobierno_evento_obras_evento_id_gobierno_eventos_id_fk` FOREIGN KEY (`evento_id`) REFERENCES `gobierno_eventos`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `gobierno_evento_votos` ADD CONSTRAINT `gobierno_evento_votos_obra_id_gobierno_evento_obras_id_fk` FOREIGN KEY (`obra_id`) REFERENCES `gobierno_evento_obras`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `gobierno_expediente_eventos` ADD CONSTRAINT `gob_expev_expediente_fk` FOREIGN KEY (`expediente_id`) REFERENCES `gobierno_expedientes`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `gobierno_multas` ADD CONSTRAINT `gobierno_multas_denuncia_id_gobierno_denuncias_id_fk` FOREIGN KEY (`denuncia_id`) REFERENCES `gobierno_denuncias`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `gobierno_multas` ADD CONSTRAINT `gobierno_multas_paid_tx_id_rotom_bank_transactions_id_fk` FOREIGN KEY (`paid_tx_id`) REFERENCES `rotom_bank_transactions`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `gobierno_parcelas` ADD CONSTRAINT `gobierno_parcelas_zona_id_gobierno_zonas_id_fk` FOREIGN KEY (`zona_id`) REFERENCES `gobierno_zonas`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `gobierno_patrulla_oficiales` ADD CONSTRAINT `gobierno_patrulla_oficiales_patrulla_id_gobierno_patrullas_id_fk` FOREIGN KEY (`patrulla_id`) REFERENCES `gobierno_patrullas`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `gobierno_pujas` ADD CONSTRAINT `gobierno_pujas_subasta_id_gobierno_subastas_id_fk` FOREIGN KEY (`subasta_id`) REFERENCES `gobierno_subastas`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `gobierno_subastas` ADD CONSTRAINT `gobierno_subastas_settled_tx_id_rotom_bank_transactions_id_fk` FOREIGN KEY (`settled_tx_id`) REFERENCES `rotom_bank_transactions`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `gob_audit_dep_idx` ON `gobierno_auditoria` (`dep`);--> statement-breakpoint
CREATE INDEX `gob_audit_created_idx` ON `gobierno_auditoria` (`created_at`);--> statement-breakpoint
CREATE INDEX `gob_especies_evento_idx` ON `gobierno_evento_especies` (`evento_id`);--> statement-breakpoint
CREATE INDEX `gob_obras_evento_idx` ON `gobierno_evento_obras` (`evento_id`);--> statement-breakpoint
CREATE INDEX `gob_expev_expediente_idx` ON `gobierno_expediente_eventos` (`expediente_id`);--> statement-breakpoint
CREATE INDEX `gob_hist_region_idx` ON `gobierno_parcela_historial` (`region_id`);--> statement-breakpoint
CREATE INDEX `gob_parcelas_town_idx` ON `gobierno_parcelas` (`town`);--> statement-breakpoint
CREATE INDEX `gob_patoff_patrulla_idx` ON `gobierno_patrulla_oficiales` (`patrulla_id`);--> statement-breakpoint
CREATE INDEX `gob_pujas_subasta_idx` ON `gobierno_pujas` (`subasta_id`);