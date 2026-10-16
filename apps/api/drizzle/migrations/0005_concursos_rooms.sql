CREATE TABLE `concursos_salas` (
	`id` char(36) NOT NULL,
	`code` char(6) NOT NULL,
	`host_hash` char(64) NOT NULL,
	`status` enum('lobby','playing','closed') NOT NULL DEFAULT 'lobby',
	`active_host_hash` char(64) GENERATED ALWAYS AS (case when `status` in ('lobby', 'playing') then rtrim(`host_hash`) else null end) STORED,
	`snapshot_version` int unsigned NOT NULL DEFAULT 1,
	`revision` bigint unsigned NOT NULL DEFAULT 1,
	`snapshot` json NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp(3),
	CONSTRAINT `concursos_salas_id` PRIMARY KEY(`id`),
	CONSTRAINT `concursos_salas_code_uq` UNIQUE(`code`),
	CONSTRAINT `concursos_salas_active_host_uq` UNIQUE(`active_host_hash`),
	CONSTRAINT `concursos_salas_version_ck` CHECK(`concursos_salas`.`snapshot_version` >= 1),
	CONSTRAINT `concursos_salas_revision_ck` CHECK(`concursos_salas`.`revision` >= 1),
	CONSTRAINT `concursos_salas_lifecycle_ck` CHECK((`concursos_salas`.`status` = 'closed' and `concursos_salas`.`deleted_at` is not null)
        or (`concursos_salas`.`status` in ('lobby', 'playing') and `concursos_salas`.`deleted_at` is null))
);
--> statement-breakpoint
CREATE INDEX `concursos_salas_host_status_idx` ON `concursos_salas` (`host_hash`,`status`);--> statement-breakpoint
CREATE INDEX `concursos_salas_status_expires_idx` ON `concursos_salas` (`status`,`expires_at`);--> statement-breakpoint
CREATE INDEX `concursos_salas_status_deleted_idx` ON `concursos_salas` (`status`,`deleted_at`);