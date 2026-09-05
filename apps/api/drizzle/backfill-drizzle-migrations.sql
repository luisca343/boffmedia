-- GENERATED FILE -- DO NOT EDIT.
-- Source:     apps/api/drizzle/migrations (read through drizzle-orm's own readMigrationFiles)
-- Regenerate: node scripts/generate-migration-backfill.mjs
--
-- Marks the 21 migrations in the journal as ALREADY APPLIED, so that
-- `drizzle-kit migrate` becomes usable instead of trying to replay all of them
-- against a schema that already has them.
--
-- RUN THIS ONLY ON A DATABASE WHERE EVERY MIGRATION IN THE JOURNAL IS ALREADY
-- APPLIED. On a fresh database, run the migrations instead -- backfilling there
-- would skip them forever and leave you with an empty schema the tooling
-- believes is current.
--
-- Safe to run twice: the insert is guarded on the ledger being empty, so a
-- non-empty ledger is left exactly as it was rather than being appended to.
--
--   mysql -u <user> -p <database> < apps/api/drizzle/backfill-drizzle-migrations.sql

CREATE TABLE IF NOT EXISTS `__drizzle_migrations` (
  id serial primary key,
  hash text not null,
  created_at bigint
);

-- Read the count BEFORE inserting anything: once the first row lands the table
-- is no longer empty, so a per-row `WHERE NOT EXISTS` would insert exactly one
-- migration and skip the other 20.
SET @ledger_rows := (SELECT COUNT(*) FROM `__drizzle_migrations`);

INSERT INTO `__drizzle_migrations` (`hash`, `created_at`)
SELECT * FROM (
  SELECT '68ceb2a81e95a3006541adf5f954deac3cc2e0aa60d814da809bfce81780717c', 1787863526188  -- 0000_grey_madame_hydra
  UNION ALL SELECT 'ac921a3f1e6396f63c94c27b75305b1f4a65f6c5f513e30a3dccde3009ceedfc', 1787936885305  -- 0001_add_pack_version_runtime
  UNION ALL SELECT '1c03356976aeeb8353e308b95825dc904819025eae3ca7063c5a663c88c02e48', 1787949181600  -- 0002_wild_krista_starr
  UNION ALL SELECT 'd7d5e34c8bbe37170b0b45ad2d43321267d7a9948d7ea073ec57d295f3967713', 1787949181601  -- 0003_repoint_tcg_artwork_paths
  UNION ALL SELECT '6a091e7ddb0b09b759f0ad4d66b78634d59b61e30458e53d5656a1c39316a69e', 1787949181602  -- 0004_vgc_tracker_sync_columns
  UNION ALL SELECT 'e02cc00ad35fd34af9beb1ccc53f212bd98fc6061324e00a599f66f00939b021', 1788363027375  -- 0005_battlesim_replays_teams
  UNION ALL SELECT '8aaeb108a99c749dc9f53c96efae137afb76a668fd3589d750d02ab445119a9d', 1788521195797  -- 0006_auth_hardening_2fa_refresh_rotation
  UNION ALL SELECT '56ea2071cac406246672e5e08e7889942e74b3394ff29d778973670fca92fcd0', 1788522500000  -- 0007_gdpr_export_and_erasure
  UNION ALL SELECT '7959060a203f9f2ab423e06ec561b354cabd5d6279acb3f069696968a2ff9589', 1788524000000  -- 0008_moderation_reports
  UNION ALL SELECT 'a2db074fe87f0c6d19f8b22f411d242d5e13a1fe064b899087f47245c8a72b71', 1788530000000  -- 0009_pack_version_changelog
  UNION ALL SELECT 'de33012541e40835d996f50aa5cf1171beda2c5ff20178ddff167008ce49aa8b', 1788530001000  -- 0010_desktop_release_rollout
  UNION ALL SELECT 'dfcb600b4b245b95fa7c4b50caa5e834595e9cb8cf981e4ba633c330cf8ccd8e', 1788530002000  -- 0011_notification_preferences
  UNION ALL SELECT 'a7582d4ed5ee45be0aee2c6b94e14caf13af1b5b3fbfa2644d84f42f42818730', 1788530003000  -- 0012_battlesim_team_tags
  UNION ALL SELECT '5e0ec761c68b95cd4401a34118676d2c71999942a2c06b328eadf669543cdbeb', 1788530004000  -- 0013_tournament_disputes
  UNION ALL SELECT 'fda1c81322ffb02f10593e2efc644b5068d9e88b860c5a21e08e919ad2d42d91', 1788530005000  -- 0014_wigglypop_listing_custody
  UNION ALL SELECT 'd55322cfba6115d3b4d7947a3c1dfb382e3aa7ad332459e57e5983d2ca6b1590', 1788530006000  -- 0015_desktop_telemetry
  UNION ALL SELECT 'e8a3d43998fe251020f81a692287fc2efa0d09a363407b1477da1e10e7ba62cd', 1788530007000  -- 0016_retention_lease
  UNION ALL SELECT '54b5fdcc69276e2a7ed6b19a7ec24b8e45448abf3bb75dfa332dca714129ee9e', 1788530008000  -- 0017_wigglypop_session_guard
  UNION ALL SELECT 'e906235f29c67a083dd2529127b0f047a5a534ceff0840724c5e5a0dd3506b94', 1788530009000  -- 0018_boffmedia_admin_subroles
  UNION ALL SELECT 'abcf0efb35aa4c3f13f965e2eb14f483d072ce458ac022455a40703798ee52ef', 1788530010000  -- 0019_ficusai_usage_tracking
  UNION ALL SELECT '9e5e93d06aff1e5148cb43dcdf9a84c02dec12def7f43b7fde044d9cb0b8dd82', 1788530011000  -- 0020_mail_bounce_handling
) AS applied
WHERE @ledger_rows = 0;

-- What you should see: 21 rows, and a newest `created_at` of
-- 1788530011000 (0020_mail_bounce_handling).
-- If `ledger_rows_before` is not 0, nothing was written and the ledger already
-- had content -- work out why before forcing anything.
SELECT
  @ledger_rows                                   AS ledger_rows_before,
  COUNT(*)                                       AS ledger_rows_now,
  MAX(created_at)                                AS newest_created_at
FROM `__drizzle_migrations`;
