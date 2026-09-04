-- Teams now support user-defined tags and sync status detection.
--
-- `tags` is a JSON array stored as TEXT, enabling flexible tagging without a
-- separate join table. Example: '["competitive", "doubles"]'. Default is '[]'.
--
-- Teams can now be filtered by tag and searched by name in TeamsView. The
-- `clientUpdatedAt` column (already present) is used to detect when the local
-- copy is newer than the cloud copy, flagging a merge conflict before the user's
-- work is silently overwritten.
--
-- Safe on populated tables: one ADD COLUMN with a NOT NULL default.

ALTER TABLE `tools_battlesim_teams` ADD COLUMN `tags` text NOT NULL DEFAULT '[]';
