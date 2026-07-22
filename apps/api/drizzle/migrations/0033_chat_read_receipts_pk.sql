-- `rotom_chat_message_reads` shipped with no primary key, so duplicate
-- (message_id, uuid) rows may already exist and ON DUPLICATE KEY had nothing to
-- key on. Dedupe via a throwaway surrogate id before installing the real PK.
ALTER TABLE `rotom_chat_message_reads` ADD COLUMN `__dedupe_id` BIGINT NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (`__dedupe_id`);--> statement-breakpoint
DELETE `dupe` FROM `rotom_chat_message_reads` AS `dupe`
INNER JOIN `rotom_chat_message_reads` AS `keeper`
  ON `keeper`.`message_id` = `dupe`.`message_id`
  AND `keeper`.`uuid` = `dupe`.`uuid`
  AND `keeper`.`__dedupe_id` < `dupe`.`__dedupe_id`;--> statement-breakpoint
ALTER TABLE `rotom_chat_message_reads` MODIFY `__dedupe_id` BIGINT NOT NULL;--> statement-breakpoint
ALTER TABLE `rotom_chat_message_reads` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `rotom_chat_message_reads` DROP COLUMN `__dedupe_id`;--> statement-breakpoint
ALTER TABLE `rotom_chat_message_reads` ADD PRIMARY KEY(`message_id`,`uuid`);
