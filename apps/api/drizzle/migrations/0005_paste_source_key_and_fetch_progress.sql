-- Migration 0005: paste source_key + regulation paste-fetch progress counter
--
-- Slice 2: add source_key to vgc_pastes so non-pokepaste sources (e.g. Limitless)
--   can be upserted by a stable key instead of producing orphaned duplicate rows
--   on each re-import.
--
-- Slice 3: add import_fetched_count to vgc_regulations so paste-fetch progress
--   can be polled live from the admin panel while the job is running.

ALTER TABLE `vgc_pastes`
  ADD COLUMN `source_key` VARCHAR(255) NULL UNIQUE AFTER `pokepaste_id`;

ALTER TABLE `vgc_regulations`
  ADD COLUMN `import_fetched_count` INT NOT NULL DEFAULT 0 AFTER `import_team_count`;

CREATE INDEX `vgc_paste_teams_regulation_idx`
  ON `vgc_paste_teams` (`regulation_id`);

CREATE INDEX `vgc_paste_teams_regulation_paste_idx`
  ON `vgc_paste_teams` (`regulation_id`, `paste_id`);

CREATE INDEX `vgc_limitless_tournaments_regulation_idx`
  ON `vgc_limitless_tournaments` (`regulation_id`);

CREATE INDEX `vgc_limitless_tournaments_regulation_status_idx`
  ON `vgc_limitless_tournaments` (`regulation_id`, `status`);

CREATE INDEX `vgc_limitless_teams_tournament_idx`
  ON `vgc_limitless_teams` (`tournament_id`);

CREATE INDEX `vgc_limitless_teams_tournament_player_idx`
  ON `vgc_limitless_teams` (`tournament_id`, `player_slug`);

CREATE INDEX `vgc_limitless_teams_paste_idx`
  ON `vgc_limitless_teams` (`paste_id`);

CREATE INDEX `vgc_regulations_active_idx`
  ON `vgc_regulations` (`active`);

CREATE INDEX `vgc_regulations_format_idx`
  ON `vgc_regulations` (`format_id`);
