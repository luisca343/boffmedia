ALTER TABLE `vgc_smogon_pokemon`
  ADD INDEX `vgc_smogon_snapshot_lookup_idx` (`format_id`, `month`, `cutoff`);

ALTER TABLE `vgc_pastes`
  ADD INDEX `vgc_pastes_format_idx` (`format_id`);
