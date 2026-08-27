-- ============================================================================
-- DESTRUCTIVE: drops EVERY view and EVERY table in the current database.
--
-- This is a full reset, not a cleanup. There is no undo. It is intended for a
-- local/dev database that is about to be rebuilt from `0000_initial.sql`.
-- `drizzle/reset-test-db.sql` is the narrow sibling that only removes the
-- `tools_vgc_*` objects.
--
--   mysql -u <user> -p <database> < apps/api/drizzle/reset-database.sql
--   pnpm --filter api migrate
--
-- Check WHICH database you are pointed at before running it:
--   SELECT DATABASE();
-- Everything below is scoped to DATABASE(), so it drops whatever the
-- connection is currently using — including tables this application does not
-- own, if it shares a schema with anything else.
--
-- Three things make this work where a hand-written DROP list would not:
--
--  1. FOREIGN_KEY_CHECKS is disabled. With 163 foreign keys there is no drop
--     order that satisfies every constraint, and circular references make one
--     impossible in principle. Dropping with checks off sidesteps ordering
--     entirely.
--
--  2. group_concat_max_len is raised to 1 MB. It defaults to 1024 bytes, which
--     truncates the generated list at roughly 25 table names — and a truncated
--     list does not error, it produces a DROP statement ending mid-identifier.
--     That either fails with a confusing syntax error or, worse, drops a subset
--     and leaves you believing the database is clean.
--
--  3. `__drizzle_migrations` is included. Drizzle records applied migrations in
--     that table, and it is created by drizzle-kit rather than declared in
--     `src/_db/schema/`, so it is easy to leave behind. If it survives, the next
--     `migrate` sees the baseline as already applied and creates NOTHING,
--     leaving an empty database that looks migrated. It is caught here because
--     this script drops everything rather than a known list.
-- ============================================================================

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET @OLD_GROUP_CONCAT_MAX_LEN = @@GROUP_CONCAT_MAX_LEN;
SET FOREIGN_KEY_CHECKS = 0;
SET SESSION group_concat_max_len = 1024 * 1024;

-- Views first: a view over a dropped table becomes invalid rather than being
-- removed, and would then break later introspection.
SELECT GROUP_CONCAT(CONCAT('`', table_name, '`') ORDER BY table_name SEPARATOR ', ')
INTO @view_list
FROM information_schema.views
WHERE table_schema = DATABASE();

SET @drop_views_sql = IF(
  @view_list IS NULL OR @view_list = '',
  'SELECT "no views to drop" AS note',
  CONCAT('DROP VIEW IF EXISTS ', @view_list)
);

PREPARE stmt_drop_views FROM @drop_views_sql;
EXECUTE stmt_drop_views;
DEALLOCATE PREPARE stmt_drop_views;

-- Then every base table, `__drizzle_migrations` included (see note 3 above).
-- Triggers belonging to a table are dropped with it, so they need no pass.
SELECT GROUP_CONCAT(CONCAT('`', table_name, '`') ORDER BY table_name SEPARATOR ', ')
INTO @table_list
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_type = 'BASE TABLE';

SET @drop_tables_sql = IF(
  @table_list IS NULL OR @table_list = '',
  'SELECT "no tables to drop" AS note',
  CONCAT('DROP TABLE IF EXISTS ', @table_list)
);

PREPARE stmt_drop_tables FROM @drop_tables_sql;
EXECUTE stmt_drop_tables;
DEALLOCATE PREPARE stmt_drop_tables;

SET SESSION group_concat_max_len = @OLD_GROUP_CONCAT_MAX_LEN;
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

-- Both counts must be 0. If they are not, the drop was partial — re-run rather
-- than migrating on top of a half-cleared schema.
SELECT
  (SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE') AS tables_left,
  (SELECT COUNT(*) FROM information_schema.views
    WHERE table_schema = DATABASE()) AS views_left;

-- Stored routines and events are NOT touched: dropping them needs one statement
-- each (DROP PROCEDURE takes no list), so it would need a cursor for objects
-- this codebase does not currently create. Confirm there are none with:
--
--   SELECT routine_type, routine_name FROM information_schema.routines
--    WHERE routine_schema = DATABASE();
--   SELECT event_name FROM information_schema.events
--    WHERE event_schema = DATABASE();
