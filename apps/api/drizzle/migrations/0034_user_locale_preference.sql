-- Stored language preference for server-composed text the browser cannot
-- translate (transactional emails: password reset, email verification).
-- NULL means "never chosen" and falls back to Spanish, so existing rows keep
-- exactly the behaviour they have today. Not backfilled on purpose.
ALTER TABLE `boffmedia_users` ADD COLUMN `locale` varchar(8);
