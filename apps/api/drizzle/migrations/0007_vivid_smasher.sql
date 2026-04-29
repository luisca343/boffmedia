ALTER TABLE `vgc_regulations`
  ADD `import_status` varchar(16) NOT NULL DEFAULT 'idle',
  ADD `import_error` text,
  ADD `import_team_count` int NOT NULL DEFAULT 0,
  ADD `import_started_at` datetime,
  ADD `import_completed_at` datetime;