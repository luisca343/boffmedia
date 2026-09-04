-- Staged rollout and emergency pause for desktop releases (X17).
--
-- Add staged rollout support to allow percentage-based rollout of new releases,
-- with a pause flag for emergency holds. Clients are assigned to rollout buckets
-- deterministically by hashing their device identifier, ensuring the same client
-- always gets a stable answer across repeated update checks.
--
-- rollout_percent: integer 0-100, default 100 (all clients). A release at 50%
-- is offered only to a stable subset (hash-based bucketing).
--
-- paused: boolean, default false. When true, the release is not offered in the
-- update feed even if published. Useful for emergency holds without unpublishing.

ALTER TABLE `desktop_releases` ADD COLUMN `rollout_percent` int NOT NULL DEFAULT 100;--> statement-breakpoint
ALTER TABLE `desktop_releases` ADD COLUMN `paused` boolean NOT NULL DEFAULT false;
