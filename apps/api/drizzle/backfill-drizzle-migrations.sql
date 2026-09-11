-- GENERATED FILE -- DO NOT EDIT.
-- Source:     apps/api/drizzle/migrations (read through drizzle-orm's own readMigrationFiles)
-- Regenerate: node scripts/generate-migration-backfill.mjs
--
-- Marks the 3 migrations in the journal as ALREADY APPLIED, so that
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
-- migration and skip the other 2.
SET @ledger_rows := (SELECT COUNT(*) FROM `__drizzle_migrations`);

INSERT INTO `__drizzle_migrations` (`hash`, `created_at`)
SELECT * FROM (
  SELECT 'c5b5d99028745aed6d2535a54b2821d6e49cd6ac26e1f25372bf6e4440333bb0', 1788901013401  -- 0000_free_falcon
  UNION ALL SELECT '1b7d6283e9ab1fc987c9e34d412cc531834e84b3406d70d1d7de4170ca8785d8', 1789025637456  -- 0001_naive_raza
  UNION ALL SELECT '11f108c1900c31a662c6247a9796369523c36b06ebf2968761fe9e1c012a1ef8', 1789118632964  -- 0002_repair_wigglypop_sessions
) AS applied
WHERE @ledger_rows = 0;

-- What you should see: 3 rows, and a newest `created_at` of
-- 1789118632964 (0002_repair_wigglypop_sessions).
-- If `ledger_rows_before` is not 0, nothing was written and the ledger already
-- had content -- work out why before forcing anything.
SELECT
  @ledger_rows                                   AS ledger_rows_before,
  COUNT(*)                                       AS ledger_rows_now,
  MAX(created_at)                                AS newest_created_at
FROM `__drizzle_migrations`;
