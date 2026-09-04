-- Auth hardening: refresh-token rotation + mandatory 2FA for admin accounts.
--
-- `boffmedia_refresh_tokens` is the ledger that makes a refresh token
-- single-use. Before it, a stolen token was good for its full seven days
-- ALONGSIDE the legitimate one and nothing anywhere noticed. One row per issued
-- `jti`; `family_id` is the lineage from one sign-in and survives every
-- rotation, so a detected reuse can kill that whole chain — and only that chain,
-- leaving the account's other devices signed in.
--
-- `rotated_at` is the single-use latch, claimed with
-- `UPDATE … WHERE jti = ? AND rotated_at IS NULL`. The uniqueness of `jti` plus
-- that conditional update is the entire concurrency story: two racing refreshes
-- cannot both win. The row deliberately outlives its own rotation — reuse
-- detection needs the spent row still to be there when the stolen copy arrives,
-- so the hourly sweeper prunes on `expires_at` and never on `rotated_at`.
--
-- `boffmedia_user_totp` holds ONE row per account, keyed on the user id, with
-- the shared secret ENCRYPTED (AES-256-GCM under SECRET_ENCRYPTION_KEY) rather
-- than hashed: verifying a six-digit code means regenerating it, so the secret
-- has to come back out intact. `pending_secret` is a separate column on purpose
-- — writing an unproven secret into `secret` locks an admin out of their own
-- account the moment they open the QR and close the tab. `last_step` is the
-- replay latch: a TOTP code is arithmetically valid for its whole 30-second
-- window, so without it the same six digits work twice.
--
-- `boffmedia_user_backup_codes` stores SHA-256 hashes only, same discipline as
-- the reset and verification tokens; the plaintext is shown once at enrolment
-- and never again.

CREATE TABLE `boffmedia_refresh_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jti` char(36) NOT NULL,
	`family_id` char(36) NOT NULL,
	`user_id` int NOT NULL,
	`expires_at` timestamp NOT NULL,
	`rotated_at` timestamp,
	`revoked_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `boffmedia_refresh_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `boffmedia_refresh_tokens_jti_unique` UNIQUE(`jti`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_user_backup_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`code_hash` char(64) NOT NULL,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `boffmedia_user_backup_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boffmedia_user_totp` (
	`user_id` int NOT NULL,
	`secret` varchar(255),
	`pending_secret` varchar(255),
	`confirmed_at` timestamp,
	`last_step` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boffmedia_user_totp_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `boffmedia_refresh_tokens` ADD CONSTRAINT `boffmedia_refresh_tokens_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_user_backup_codes` ADD CONSTRAINT `boffmedia_user_backup_codes_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `boffmedia_user_totp` ADD CONSTRAINT `boffmedia_user_totp_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `rt_family_idx` ON `boffmedia_refresh_tokens` (`family_id`);--> statement-breakpoint
CREATE INDEX `rt_user_idx` ON `boffmedia_refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `rt_expires_idx` ON `boffmedia_refresh_tokens` (`expires_at`);--> statement-breakpoint
CREATE INDEX `ubc_user_idx` ON `boffmedia_user_backup_codes` (`user_id`);