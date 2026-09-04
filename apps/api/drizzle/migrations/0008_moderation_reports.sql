-- Post-moderation: reports, the hide ledger and author sanctions.
--
-- The design decision worth knowing before reading the DDL: a report names its
-- target by `(content_type, content_id)` and nothing else. That is what lets
-- the forum, Rooker and a profile bio share one queue and one dedupe rule, and
-- it is why `content_id` is a `varchar(64)` rather than an `int` — the primary
-- keys it points at are `int` on some surfaces and `char(36)` on others, so a
-- typed column could only ever serve half of them.
--
-- `content_type` is a varchar and NOT an enum, which is the one deliberate
-- departure from CONVENTIONS.md's "closed sets are enums" rule. The set really
-- is closed, but it is closed in `api/boffmedia/moderation/content-registry.ts`
-- rather than in the schema: making it an enum would turn every new UGC surface
-- into an ALTER TABLE, which is exactly the per-surface cost this whole change
-- exists to remove. The registry rejects an unknown type at the DTO boundary,
-- so no unregistered value can reach these rows.
--
-- `bcr_content_reporter_uq` is the dedupe rule, in the database rather than in
-- a read-then-write: a second report from the same person on the same item
-- UPDATES their reason instead of inflating the count, so "how many times was
-- this reported" counts people, not clicks. Two rapid clicks are the ordinary
-- case and a check-then-insert loses that race.
--
-- `boffmedia_content_moderation` holds the hide decision, one row per item, and
-- never deletes anything: `hidden_at` is a latch that an unhide clears while
-- the row (and its `hidden_reason`) stays. Two surfaces apply the decision two
-- ways — the forum writes its own `deleted_at`, Rooker and profiles are
-- filtered against this table at read time — but the record of WHO decided WHAT
-- is here in both cases. That matters for the forum in particular, where the
-- column is shared with the author's own delete: without this ledger an unhide
-- could not tell a moderator's hide from an author's deletion.
--
-- `boffmedia_moderation_sanctions` outlives the post it came from on purpose. A
-- second offence only reads as a second offence if the first is still on record
-- after its content was hidden, which is why revoking sets `revoked_at` instead
-- of deleting the row.
--
-- Both the report and the sanction carry TWO identity columns for the author.
-- The product has two identity systems and they do not always link
-- (`boffmedia_users.uuid` is nullable and `set null`): a Rooker post has only
-- the in-game uuid, a forum post has only the website account.

CREATE TABLE `boffmedia_content_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content_type` varchar(32) NOT NULL,
	`content_id` varchar(64) NOT NULL,
	`reporter_user_id` int NOT NULL,
	`reason` enum('spam','harassment','hate','sexual','illegal','off_topic','other') NOT NULL,
	`detail` varchar(500),
	`author_user_id` int,
	`author_uuid` char(36),
	`status` enum('open','actioned','dismissed') NOT NULL DEFAULT 'open',
	`resolution` varchar(200),
	`resolved_at` timestamp,
	`resolved_by_user_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boffmedia_content_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `bcr_content_reporter_uq` UNIQUE(`content_type`,`content_id`,`reporter_user_id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_content_moderation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content_type` varchar(32) NOT NULL,
	`content_id` varchar(64) NOT NULL,
	`hidden_at` timestamp,
	`hidden_by_user_id` int,
	`hidden_reason` varchar(200),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boffmedia_content_moderation_id` PRIMARY KEY(`id`),
	CONSTRAINT `bcm_content_uq` UNIQUE(`content_type`,`content_id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_moderation_sanctions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject_user_id` int,
	`subject_uuid` char(36),
	`kind` enum('warning','content_ban') NOT NULL,
	`reason` varchar(200) NOT NULL,
	`report_id` int,
	`expires_at` timestamp,
	`revoked_at` timestamp,
	`revoked_by_user_id` int,
	`issued_by_user_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `boffmedia_moderation_sanctions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `boffmedia_content_reports` ADD CONSTRAINT `bcr_reporter_fk` FOREIGN KEY (`reporter_user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE restrict;--> statement-breakpoint
ALTER TABLE `boffmedia_content_reports` ADD CONSTRAINT `bcr_author_fk` FOREIGN KEY (`author_user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null;--> statement-breakpoint
ALTER TABLE `boffmedia_content_reports` ADD CONSTRAINT `bcr_author_uuid_fk` FOREIGN KEY (`author_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_content_reports` ADD CONSTRAINT `bcr_resolver_fk` FOREIGN KEY (`resolved_by_user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null;--> statement-breakpoint
ALTER TABLE `boffmedia_content_moderation` ADD CONSTRAINT `bcm_hidden_by_fk` FOREIGN KEY (`hidden_by_user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null;--> statement-breakpoint
ALTER TABLE `boffmedia_moderation_sanctions` ADD CONSTRAINT `bms_subject_fk` FOREIGN KEY (`subject_user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE restrict;--> statement-breakpoint
ALTER TABLE `boffmedia_moderation_sanctions` ADD CONSTRAINT `bms_subject_uuid_fk` FOREIGN KEY (`subject_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_moderation_sanctions` ADD CONSTRAINT `bms_report_fk` FOREIGN KEY (`report_id`) REFERENCES `boffmedia_content_reports`(`id`) ON DELETE set null;--> statement-breakpoint
ALTER TABLE `boffmedia_moderation_sanctions` ADD CONSTRAINT `bms_issuer_fk` FOREIGN KEY (`issued_by_user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE set null;--> statement-breakpoint
CREATE INDEX `bcr_status_idx` ON `boffmedia_content_reports` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `bcr_content_idx` ON `boffmedia_content_reports` (`content_type`,`content_id`);--> statement-breakpoint
CREATE INDEX `bcr_author_idx` ON `boffmedia_content_reports` (`author_user_id`);--> statement-breakpoint
CREATE INDEX `bcr_author_uuid_idx` ON `boffmedia_content_reports` (`author_uuid`);--> statement-breakpoint
CREATE INDEX `bms_subject_idx` ON `boffmedia_moderation_sanctions` (`subject_user_id`,`revoked_at`);--> statement-breakpoint
CREATE INDEX `bms_subject_uuid_idx` ON `boffmedia_moderation_sanctions` (`subject_uuid`,`revoked_at`);--> statement-breakpoint
-- Appended at the END of the enum, and it has to stay that way: MySQL stores an
-- ENUM by ordinal position, so inserting a value in the middle silently remaps
-- every existing row to the wrong subject. `report` is a dismissal, `content`
-- is a hide or unhide, `user` is what was done to an author.
ALTER TABLE `boffmedia_audit` MODIFY COLUMN `subject_type` enum('event','tournament','participant','match','report','content','user') NOT NULL;
