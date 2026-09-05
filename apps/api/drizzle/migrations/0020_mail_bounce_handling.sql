-- A14: Email bounce and complaint handling.
-- Resend webhooks mark addresses as bounced to prevent sending to invalid mailboxes.
-- Hard bounces and complaints prevent transactional emails to reduce amplification.
ALTER TABLE `boffmedia_users` ADD COLUMN `email_bounced` boolean NOT NULL DEFAULT false AFTER `deleted_at`;
ALTER TABLE `boffmedia_users` ADD COLUMN `email_bounced_at` timestamp NULL AFTER `email_bounced`;

-- Index for filtering out bounced users in mail queries
CREATE INDEX `boffmedia_users_email_bounced_idx` ON `boffmedia_users` (`email_bounced`);
