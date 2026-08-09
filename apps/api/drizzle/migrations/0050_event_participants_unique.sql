-- Event membership becomes the source of truth for pack entitlement, so
-- (participant_id, event_id) must be unique. Existing duplicates are collapsed
-- first: the surviving row is the oldest one, promoted to the strongest status
-- any of its duplicates held, so nobody loses a confirmed membership.
UPDATE `boffmedia_event_participants` ep
JOIN (
  SELECT
    MIN(id) AS keep_id,
    MAX(status = 'confirmed') AS any_confirmed,
    MAX(status = 'registered') AS any_registered
  FROM `boffmedia_event_participants`
  GROUP BY participant_id, event_id
  HAVING COUNT(*) > 1
) dup ON dup.keep_id = ep.id
SET ep.status = IF(dup.any_confirmed = 1, 'confirmed', IF(dup.any_registered = 1, 'registered', ep.status));
--> statement-breakpoint
DELETE ep FROM `boffmedia_event_participants` ep
JOIN (
  SELECT participant_id, event_id, MIN(id) AS keep_id
  FROM `boffmedia_event_participants`
  GROUP BY participant_id, event_id
) dup
  ON dup.participant_id = ep.participant_id
 AND dup.event_id = ep.event_id
WHERE ep.id <> dup.keep_id;
--> statement-breakpoint
ALTER TABLE `boffmedia_event_participants` ADD CONSTRAINT `ep_participant_event_uq` UNIQUE(`participant_id`,`event_id`);
