-- One participant identity per Boffmedia account: a concurrent first-join used to
-- fork a user into two participant rows, splitting progress/trophies/entitlement.
-- Collapse any existing duplicates (non-NULL user_id only; anonymous NULLs are
-- left alone, and MySQL allows many NULLs under the unique index) onto the oldest
-- row, repoint every child row to the keeper, then enforce uniqueness.
CREATE TEMPORARY TABLE `_participant_dedupe` AS
SELECT p.id AS dupe_id, k.keep_id AS keep_id
FROM `boffmedia_participants` p
JOIN (
  SELECT user_id, MIN(id) AS keep_id
  FROM `boffmedia_participants`
  WHERE user_id IS NOT NULL
  GROUP BY user_id
  HAVING COUNT(*) > 1
) k ON k.user_id = p.user_id
WHERE p.id <> k.keep_id;
--> statement-breakpoint
-- event memberships: (participant_id, event_id) is unique, so drop a dupe's row
-- when the keeper already holds one for the same event, then repoint the rest.
DELETE ep FROM `boffmedia_event_participants` ep
JOIN `_participant_dedupe` d ON d.dupe_id = ep.participant_id
JOIN `boffmedia_event_participants` keep
  ON keep.participant_id = d.keep_id AND keep.event_id = ep.event_id;
--> statement-breakpoint
UPDATE `boffmedia_event_participants` ep
JOIN `_participant_dedupe` d ON d.dupe_id = ep.participant_id
SET ep.participant_id = d.keep_id;
--> statement-breakpoint
-- team members: PK is (team_id, participant_id); drop the dupe's row when the
-- keeper is already on that team, then repoint the rest.
DELETE tm FROM `boffmedia_event_team_members` tm
JOIN `_participant_dedupe` d ON d.dupe_id = tm.participant_id
JOIN `boffmedia_event_team_members` keep
  ON keep.participant_id = d.keep_id AND keep.team_id = tm.team_id;
--> statement-breakpoint
UPDATE `boffmedia_event_team_members` tm
JOIN `_participant_dedupe` d ON d.dupe_id = tm.participant_id
SET tm.participant_id = d.keep_id;
--> statement-breakpoint
-- achievement progress: PK is (participant_id, achievement_id); drop the dupe's
-- row when the keeper already has progress for that achievement, then repoint.
DELETE pp FROM `boffmedia_participant_progress` pp
JOIN `_participant_dedupe` d ON d.dupe_id = pp.participant_id
JOIN `boffmedia_participant_progress` keep
  ON keep.participant_id = d.keep_id AND keep.achievement_id = pp.achievement_id;
--> statement-breakpoint
UPDATE `boffmedia_participant_progress` pp
JOIN `_participant_dedupe` d ON d.dupe_id = pp.participant_id
SET pp.participant_id = d.keep_id;
--> statement-breakpoint
-- the duplicate participant rows are now orphaned; remove them.
DELETE p FROM `boffmedia_participants` p
JOIN `_participant_dedupe` d ON d.dupe_id = p.id;
--> statement-breakpoint
DROP TEMPORARY TABLE `_participant_dedupe`;
--> statement-breakpoint
ALTER TABLE `boffmedia_participants` ADD CONSTRAINT `p_user_uq` UNIQUE(`user_id`);
