-- NOTE: order matters. `tph_tournament_idx` is the index supporting the FK
-- `tph_t_fk` on tournament_id, so dropping it first fails with errno 1553
-- (ER_DROP_INDEX_FK) -- which is what drizzle-kit emitted and then reported as
-- a bare exit. The new UNIQUE index has the same leading column, so once it
-- exists the FK has a supporting index and the old one can go.
ALTER TABLE `boffmedia_tournament_phases` ADD CONSTRAINT `tph_tournament_order_uq` UNIQUE(`tournament_id`,`phase_order`);--> statement-breakpoint
DROP INDEX `tph_tournament_idx` ON `boffmedia_tournament_phases`;--> statement-breakpoint
CREATE TABLE `boffmedia_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject_type` enum('event','tournament','participant','match') NOT NULL,
	`subject_id` int NOT NULL,
	`action` varchar(48) NOT NULL,
	`actor_user_id` int,
	`meta` json,
	`at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_phase_entrants` ADD CONSTRAINT `tpe_phase_seed_uq` UNIQUE(`phase_id`,`seed`);--> statement-breakpoint
CREATE INDEX `ba_subject_idx` ON `boffmedia_audit` (`subject_type`,`subject_id`,`at`);--> statement-breakpoint
CREATE INDEX `ba_actor_idx` ON `boffmedia_audit` (`actor_user_id`);--> statement-breakpoint
CREATE INDEX `tm_proposal_idx` ON `boffmedia_tournament_matches` (`tournament_id`,`proposal_state`);
