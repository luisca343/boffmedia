CREATE TABLE `boffmedia_tournament_phase_entrants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phase_id` int NOT NULL,
	`participant_id` int NOT NULL,
	`seed` int NOT NULL,
	`source_rank` int,
	`source_record` varchar(16),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_tournament_phase_entrants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tpe_unique` UNIQUE(`phase_id`,`participant_id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_tournament_phases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournament_id` int NOT NULL,
	`phase_order` int NOT NULL DEFAULT 1,
	`name` varchar(128) NOT NULL,
	`format` enum('single','double','roundrobin','swiss','leaderboard') NOT NULL,
	`status` enum('pending','live','completed') NOT NULL DEFAULT 'pending',
	`best_of` int,
	`rounds` int,
	`carry_standings` boolean NOT NULL DEFAULT false,
	`advance_type` enum('all','top_n','record'),
	`advance_count` int,
	`advance_max_losses` int,
	`tiebreak_profile` enum('points','resistance') NOT NULL DEFAULT 'points',
	`start_date` timestamp,
	`end_date` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
	CONSTRAINT `boffmedia_tournament_phases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD `phase_id` int;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_participants` ADD CONSTRAINT `tp_user_unique` UNIQUE(`tournament_id`,`user_id`);--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_phase_entrants` ADD CONSTRAINT `tpe_ph_fk` FOREIGN KEY (`phase_id`) REFERENCES `boffmedia_tournament_phases`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_phase_entrants` ADD CONSTRAINT `tpe_p_fk` FOREIGN KEY (`participant_id`) REFERENCES `boffmedia_tournament_participants`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_phases` ADD CONSTRAINT `tph_t_fk` FOREIGN KEY (`tournament_id`) REFERENCES `boffmedia_tournaments`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `tpe_phase_idx` ON `boffmedia_tournament_phase_entrants` (`phase_id`);--> statement-breakpoint
CREATE INDEX `tph_tournament_idx` ON `boffmedia_tournament_phases` (`tournament_id`,`phase_order`);--> statement-breakpoint
ALTER TABLE `boffmedia_tournament_matches` ADD CONSTRAINT `tm_phase_fk` FOREIGN KEY (`phase_id`) REFERENCES `boffmedia_tournament_phases`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `tm_phase_idx` ON `boffmedia_tournament_matches` (`phase_id`);--> statement-breakpoint
-- Backfill: collapse every existing tournament into a single "Fase única" phase.
-- 'groups' has no phase-format equivalent (the legacy groups path stays keyed on
-- `bracket`, not `phase`); it maps to 'roundrobin' here purely as a placeholder —
-- single-phase detail rendering derives its view from `tournaments.format`, so
-- groups tournaments still render as groups.
INSERT INTO `boffmedia_tournament_phases`
  (`tournament_id`, `phase_order`, `name`, `format`, `status`, `best_of`)
SELECT
  t.`id`, 1, 'Fase única',
  CASE WHEN t.`format` = 'groups' THEN 'roundrobin' ELSE t.`format` END,
  CASE t.`status`
    WHEN 'live' THEN 'live'
    WHEN 'completed' THEN 'completed'
    ELSE 'pending'
  END,
  t.`best_of`
FROM `boffmedia_tournaments` t;--> statement-breakpoint
UPDATE `boffmedia_tournament_matches` m
JOIN `boffmedia_tournament_phases` ph
  ON ph.`tournament_id` = m.`tournament_id` AND ph.`phase_order` = 1
SET m.`phase_id` = ph.`id`;--> statement-breakpoint
INSERT INTO `boffmedia_tournament_phase_entrants`
  (`phase_id`, `participant_id`, `seed`)
SELECT
  ph.`id`, p.`id`,
  (SELECT COUNT(*) FROM `boffmedia_tournament_participants` p2
     WHERE p2.`tournament_id` = p.`tournament_id`
       AND (COALESCE(p2.`seed`, 2147483647) < COALESCE(p.`seed`, 2147483647)
         OR (COALESCE(p2.`seed`, 2147483647) = COALESCE(p.`seed`, 2147483647)
             AND p2.`id` <= p.`id`)))
FROM `boffmedia_tournament_participants` p
JOIN `boffmedia_tournament_phases` ph
  ON ph.`tournament_id` = p.`tournament_id` AND ph.`phase_order` = 1;