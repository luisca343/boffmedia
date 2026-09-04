-- Pack version changelog (X18): enable players to see what changed between versions.
--
-- A nullable TEXT column added to `pack_versions`. Players see this on the web
-- pack detail page (/app/packs/[slug]) and in the desktop app's pack detail
-- view, to understand version-specific changes before they install or update.
--
-- Unlike `notes` (for admin commentary), `changelog` is player-facing and
-- describes what changed from the previous version — new content, fixes, removals.
--
-- Safe on populated tables: one ALTER, zero backfill, zero constraint changes.

ALTER TABLE `pack_versions` ADD COLUMN `changelog` text;
