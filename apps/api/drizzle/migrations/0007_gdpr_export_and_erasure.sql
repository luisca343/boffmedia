-- GDPR: self-serve data export, and a retention window for soft-deleted accounts (A18).
--
-- Two halves of one promise. `boffmedia_users.deleted_at` already scrubbed every
-- PII field in place, which satisfies erasure of the identifying data — but the
-- row was then kept forever, and nothing ever offered the person a copy of what
-- was held on them in the first place.
--
-- `boffmedia_data_exports` is one row per "send me everything" request. It exists
-- because the answer spans ~90 tables across two identities, which is far too
-- slow to build inside the POST: the controller records intent here, enqueues an
-- outbox job, and the browser polls this row. The archive itself is a file under
-- DATA_EXPORT_ROOT (default <cwd>/var/exports), deliberately NOT under
-- UPLOADS_ROOT — that tree is served statically at /uploads, and this file is the
-- densest pile of one person's data the system can produce.
--
-- `filename` is a basename, never a path, and never leaves the API: the download
-- route resolves it server-side from the row id, so a leaked response body is not
-- a leaked path. The FK is ON DELETE cascade because the request has no meaning
-- without the account; the erasure job unlinks the FILES first, so the cascade
-- can never leave an orphaned archive on disk.
--
-- The `boffmedia_audit.subject_type` ALTER appends `user` and only appends it.
-- MySQL stores ENUM by ordinal position, so a value inserted anywhere but the end
-- silently remaps every existing row. The new value carries `user.erased`, the
-- retention job's record that an account's grace period ran out.
--
-- The tombstone account is the reason the erasure can happen at all. Four
-- references to `boffmedia_users` are ON DELETE RESTRICT — restricts that
-- `_db/schema/_fk-actions.spec.ts` pins on purpose, because a thread has to
-- outlive its author. `boffmedia_forum_threads.user_id` and
-- `boffmedia_forum_posts.user_id` are NOT NULL, so there is no NULL to fall back
-- on and those rows are re-pointed here. (The other two are handled without it:
-- a content report is deleted, because `bcr_content_reporter_uq` would collide
-- on the second erased account that reported the same post, and a sanction's
-- subject goes to NULL.)
--
-- The tombstone is soft-deleted from birth, so every read path already hides it,
-- and the sweep excludes it by id: without that exclusion the first run would
-- try to erase the row that every erased account's history now hangs off.
--
-- Safe on populated tables: one CREATE, one ENUM append, one guarded INSERT. No
-- backfill, no rewrite, no column dropped.

CREATE TABLE `boffmedia_data_exports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`status` enum('pending','ready','failed','expired') NOT NULL DEFAULT 'pending',
	`filename` varchar(128),
	`size_bytes` int,
	`last_error` text,
	`requested_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`expires_at` timestamp,
	CONSTRAINT `boffmedia_data_exports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `boffmedia_data_exports` ADD CONSTRAINT `boffmedia_data_exports_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `bde_user_requested_idx` ON `boffmedia_data_exports` (`user_id`,`requested_at`);--> statement-breakpoint
CREATE INDEX `bde_status_idx` ON `boffmedia_data_exports` (`status`);--> statement-breakpoint
ALTER TABLE `boffmedia_audit` MODIFY COLUMN `subject_type` enum('event','tournament','participant','match','user') NOT NULL;--> statement-breakpoint
INSERT INTO `boffmedia_users` (`username`, `email`, `password`, `email_verified`, `deleted_at`)
SELECT 'deleted_account', 'deleted@deleted.invalid', NULL, 0, NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `boffmedia_users` WHERE `username` = 'deleted_account');
