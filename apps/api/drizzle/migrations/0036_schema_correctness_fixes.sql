-- Correctness fixes found in the pre-production schema audit. Every constraint
-- added here is preceded by the deduplication it needs, because these tables have
-- been accepting duplicates for their whole life — installing the constraint
-- without merging first would just fail the migration on live data.
--
-- Runs AFTER 0035, so every table/column below is already at its final name.

-- ─── 1. boffmedia_users.email had no unique index ────────────────────────────
-- Login, password reset and email verification all key on this column. Soft-delete
-- scrubs it to `deleted+<id>@deleted.invalid` (users.repository.ts), which is
-- unique per row, so tombstones cannot collide with each other or a live account.
-- Any pre-existing live duplicate is parked with a recoverable marker rather than
-- deleted: the older row keeps its data and is renamed out of the way, so a human
-- can merge the accounts. Only the LOWEST id keeps the address.
UPDATE `boffmedia_users` AS `dupe`
INNER JOIN (
  SELECT `email`, MIN(`id`) AS `keep_id`
  FROM `boffmedia_users`
  WHERE `deleted_at` IS NULL
  GROUP BY `email`
  HAVING COUNT(*) > 1
) AS `d` ON `d`.`email` = `dupe`.`email` AND `dupe`.`id` <> `d`.`keep_id`
SET `dupe`.`email` = CONCAT('dupe+', `dupe`.`id`, '@needs-merge.invalid');--> statement-breakpoint
ALTER TABLE `boffmedia_users` ADD CONSTRAINT `boffmedia_users_email_unique` UNIQUE(`email`);--> statement-breakpoint

-- ─── 2. tcg_user_cards declared two PRIMARY KEYs ─────────────────────────────
-- The schema had both `id.primaryKey()` and a composite primaryKey(user_id,card_id).
-- MySQL allows one, so the live table only ever got PRIMARY KEY(id) and the
-- "one row per user per card" rule was never enforced. Duplicates are MERGED
-- (quantities summed) rather than dropped — the rows are somebody's collection.
UPDATE `tcg_user_cards` AS `keeper`
INNER JOIN (
  SELECT `user_id`, `card_id`, MIN(`id`) AS `keep_id`, SUM(`quantity`) AS `total`
  FROM `tcg_user_cards`
  GROUP BY `user_id`, `card_id`
  HAVING COUNT(*) > 1
) AS `d` ON `d`.`keep_id` = `keeper`.`id`
SET `keeper`.`quantity` = `d`.`total`;--> statement-breakpoint
DELETE `dupe` FROM `tcg_user_cards` AS `dupe`
INNER JOIN `tcg_user_cards` AS `keeper`
  ON `keeper`.`user_id` = `dupe`.`user_id`
  AND `keeper`.`card_id` = `dupe`.`card_id`
  AND `keeper`.`id` < `dupe`.`id`;--> statement-breakpoint
CREATE UNIQUE INDEX `tcg_user_cards_user_card_uq` ON `tcg_user_cards` (`user_id`,`card_id`);--> statement-breakpoint

-- ─── 3. Five junction tables shipped with no primary key ─────────────────────
-- Same defect and same remedy as `rotom_chat_message_reads` in 0033: without a PK
-- there is nothing for ON DUPLICATE KEY to key on, so every "add" is an unguarded
-- insert. Dedupe through a throwaway surrogate, then install the real PK.

-- 3a. rotom_user_apps — keep the lowest `order` so a user's layout is preserved.
ALTER TABLE `rotom_user_apps` ADD COLUMN `__dedupe_id` BIGINT NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (`__dedupe_id`);--> statement-breakpoint
DELETE `dupe` FROM `rotom_user_apps` AS `dupe`
INNER JOIN `rotom_user_apps` AS `keeper`
  ON `keeper`.`uuid` = `dupe`.`uuid`
  AND `keeper`.`app_id` = `dupe`.`app_id`
  AND `keeper`.`__dedupe_id` < `dupe`.`__dedupe_id`;--> statement-breakpoint
ALTER TABLE `rotom_user_apps` MODIFY `__dedupe_id` BIGINT NOT NULL;--> statement-breakpoint
ALTER TABLE `rotom_user_apps` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `rotom_user_apps` DROP COLUMN `__dedupe_id`;--> statement-breakpoint
ALTER TABLE `rotom_user_apps` ADD PRIMARY KEY(`uuid`,`app_id`);--> statement-breakpoint

-- 3b. rotom_chat_members
ALTER TABLE `rotom_chat_members` ADD COLUMN `__dedupe_id` BIGINT NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (`__dedupe_id`);--> statement-breakpoint
DELETE `dupe` FROM `rotom_chat_members` AS `dupe`
INNER JOIN `rotom_chat_members` AS `keeper`
  ON `keeper`.`chat_id` = `dupe`.`chat_id`
  AND `keeper`.`uuid` = `dupe`.`uuid`
  AND `keeper`.`__dedupe_id` < `dupe`.`__dedupe_id`;--> statement-breakpoint
ALTER TABLE `rotom_chat_members` MODIFY `__dedupe_id` BIGINT NOT NULL;--> statement-breakpoint
ALTER TABLE `rotom_chat_members` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `rotom_chat_members` DROP COLUMN `__dedupe_id`;--> statement-breakpoint
ALTER TABLE `rotom_chat_members` ADD PRIMARY KEY(`chat_id`,`uuid`);--> statement-breakpoint

-- 3c. rotom_user_documents
ALTER TABLE `rotom_user_documents` ADD COLUMN `__dedupe_id` BIGINT NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (`__dedupe_id`);--> statement-breakpoint
DELETE `dupe` FROM `rotom_user_documents` AS `dupe`
INNER JOIN `rotom_user_documents` AS `keeper`
  ON `keeper`.`uuid` = `dupe`.`uuid`
  AND `keeper`.`document_id` = `dupe`.`document_id`
  AND `keeper`.`__dedupe_id` < `dupe`.`__dedupe_id`;--> statement-breakpoint
ALTER TABLE `rotom_user_documents` MODIFY `__dedupe_id` BIGINT NOT NULL;--> statement-breakpoint
ALTER TABLE `rotom_user_documents` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `rotom_user_documents` DROP COLUMN `__dedupe_id`;--> statement-breakpoint
ALTER TABLE `rotom_user_documents` ADD PRIMARY KEY(`uuid`,`document_id`);--> statement-breakpoint

-- 3d. rotom_note_tag_links
ALTER TABLE `rotom_note_tag_links` ADD COLUMN `__dedupe_id` BIGINT NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (`__dedupe_id`);--> statement-breakpoint
DELETE `dupe` FROM `rotom_note_tag_links` AS `dupe`
INNER JOIN `rotom_note_tag_links` AS `keeper`
  ON `keeper`.`document_id` = `dupe`.`document_id`
  AND `keeper`.`tag_id` = `dupe`.`tag_id`
  AND `keeper`.`__dedupe_id` < `dupe`.`__dedupe_id`;--> statement-breakpoint
ALTER TABLE `rotom_note_tag_links` MODIFY `__dedupe_id` BIGINT NOT NULL;--> statement-breakpoint
ALTER TABLE `rotom_note_tag_links` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `rotom_note_tag_links` DROP COLUMN `__dedupe_id`;--> statement-breakpoint
ALTER TABLE `rotom_note_tag_links` ADD PRIMARY KEY(`document_id`,`tag_id`);--> statement-breakpoint

-- 3e. rotom_starbank_user_accounts
ALTER TABLE `rotom_starbank_user_accounts` ADD COLUMN `__dedupe_id` BIGINT NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (`__dedupe_id`);--> statement-breakpoint
DELETE `dupe` FROM `rotom_starbank_user_accounts` AS `dupe`
INNER JOIN `rotom_starbank_user_accounts` AS `keeper`
  ON `keeper`.`uuid` = `dupe`.`uuid`
  AND `keeper`.`account_id` = `dupe`.`account_id`
  AND `keeper`.`__dedupe_id` < `dupe`.`__dedupe_id`;--> statement-breakpoint
ALTER TABLE `rotom_starbank_user_accounts` MODIFY `__dedupe_id` BIGINT NOT NULL;--> statement-breakpoint
ALTER TABLE `rotom_starbank_user_accounts` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `rotom_starbank_user_accounts` DROP COLUMN `__dedupe_id`;--> statement-breakpoint
ALTER TABLE `rotom_starbank_user_accounts` ADD PRIMARY KEY(`uuid`,`account_id`);--> statement-breakpoint

-- ─── 4. StarBank money columns ───────────────────────────────────────────────
-- A NULL balance makes every sum, transfer guard and reconciliation over it NULL.
UPDATE `rotom_starbank_accounts` SET `balance` = 0 WHERE `balance` IS NULL;--> statement-breakpoint
ALTER TABLE `rotom_starbank_accounts` MODIFY `balance` bigint NOT NULL DEFAULT 0;--> statement-breakpoint

-- The ledger's own timestamp was varchar(32) holding ISO-8601 strings from
-- toISOString() — unsortable, unindexable, and outside the 0014 datetime sweep
-- because it is not typed as a date. Parse explicitly: MySQL will not implicitly
-- cast the trailing 'Z', and the stored values are UTC while a timestamp column
-- reads back in the session zone, so shift by the session's current offset.
-- A row whose string does not parse is stamped with an obviously-wrong sentinel
-- rather than NOW() — a wrong-but-plausible date on a money row is worse than a
-- broken one you can find with `WHERE date = '2000-01-01 00:00:00'`.
-- NOT the epoch: TIMESTAMP's floor is 1970-01-01 00:00:01 *UTC*, but a literal is
-- read in the session zone, so '1970-01-01 00:00:01' on a UTC+n server converts
-- to below the floor and MySQL rejects it — aborting this migration mid-run.
ALTER TABLE `rotom_starbank_transactions` ADD COLUMN `__date_ts` timestamp NULL;--> statement-breakpoint
UPDATE `rotom_starbank_transactions`
SET `__date_ts` = COALESCE(
  DATE_ADD(
    STR_TO_DATE(REPLACE(REPLACE(`date`, 'T', ' '), 'Z', ''), '%Y-%m-%d %H:%i:%s.%f'),
    INTERVAL TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), NOW()) SECOND
  ),
  DATE_ADD(
    STR_TO_DATE(REPLACE(REPLACE(`date`, 'T', ' '), 'Z', ''), '%Y-%m-%d %H:%i:%s'),
    INTERVAL TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), NOW()) SECOND
  ),
  '2000-01-01 00:00:00'
);--> statement-breakpoint
ALTER TABLE `rotom_starbank_transactions` DROP COLUMN `date`;--> statement-breakpoint
ALTER TABLE `rotom_starbank_transactions` CHANGE `__date_ts` `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
-- The ledger is read by account and ordered by date on every statement screen.
CREATE INDEX `sb_tx_date_idx` ON `rotom_starbank_transactions` (`date`);--> statement-breakpoint
CREATE INDEX `sb_tx_from_idx` ON `rotom_starbank_transactions` (`from_account_id`,`date`);--> statement-breakpoint
CREATE INDEX `sb_tx_to_idx` ON `rotom_starbank_transactions` (`to_account_id`,`date`);--> statement-breakpoint

-- ─── 5. rotom_pokedex allowed the same registration twice ────────────────────
-- Dex completion is derived from row counts, so a duplicate inflates it. Keep the
-- earliest sighting and the earliest catch across the merged rows, so dedupe can
-- never move a caught entry back to seen-only.
UPDATE `rotom_pokedex` AS `keeper`
INNER JOIN (
  SELECT `uuid`, `pokemon_id`, `form_id`, `palette_id`,
         MIN(`id`) AS `keep_id`,
         MIN(`seen_at`) AS `first_seen`,
         MIN(`caught_at`) AS `first_caught`
  FROM `rotom_pokedex`
  GROUP BY `uuid`, `pokemon_id`, `form_id`, `palette_id`
  HAVING COUNT(*) > 1
) AS `d` ON `d`.`keep_id` = `keeper`.`id`
SET `keeper`.`seen_at` = `d`.`first_seen`,
    `keeper`.`caught_at` = `d`.`first_caught`;--> statement-breakpoint
DELETE `dupe` FROM `rotom_pokedex` AS `dupe`
INNER JOIN `rotom_pokedex` AS `keeper`
  ON `keeper`.`uuid` = `dupe`.`uuid`
  AND `keeper`.`pokemon_id` = `dupe`.`pokemon_id`
  AND `keeper`.`form_id` = `dupe`.`form_id`
  AND `keeper`.`palette_id` = `dupe`.`palette_id`
  AND `keeper`.`id` < `dupe`.`id`;--> statement-breakpoint
CREATE UNIQUE INDEX `rotom_pokedex_entry_uq` ON `rotom_pokedex` (`uuid`,`pokemon_id`,`form_id`,`palette_id`);
