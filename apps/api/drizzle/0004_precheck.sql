-- Pre-check for migration 0004 (run BEFORE `pnpm --filter api migrate`).
--
-- 0004 adds two UNIQUE constraints to tables that until now only had plain
-- indexes. If any existing row violates them the ALTER fails, and because
-- MySQL DDL is not transactional a failure mid-file leaves 0004 half applied.
-- Both queries below must return ZERO rows before you migrate.
--
--   mysql -u <user> -p <database> < apps/api/drizzle/0004_precheck.sql

-- 1. Two phases of the same tournament sharing a phase_order.
--    Advancement resolves "the next phase" as phase_order + 1, so a duplicate
--    makes that lookup ambiguous.
SELECT 'DUPLICATE phase_order' AS problem,
       tournament_id,
       phase_order,
       COUNT(*)                    AS rows_affected,
       GROUP_CONCAT(id ORDER BY id) AS phase_ids
FROM boffmedia_tournament_phases
GROUP BY tournament_id, phase_order
HAVING COUNT(*) > 1;

-- 2. Two entrants of the same phase sharing a seed.
--    Seeds are 1..N and drive every pairing algorithm.
SELECT 'DUPLICATE phase seed' AS problem,
       phase_id,
       seed,
       COUNT(*)                    AS rows_affected,
       GROUP_CONCAT(participant_id ORDER BY participant_id) AS participant_ids
FROM boffmedia_tournament_phase_entrants
GROUP BY phase_id, seed
HAVING COUNT(*) > 1;
