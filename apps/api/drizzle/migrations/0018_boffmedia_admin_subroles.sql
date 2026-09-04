-- Boffmedia admin sub-roles for fine-grained access control
--
-- W8: Split BOFF_ADMIN into sub-roles:
-- - BOFF_ADMIN_CONTENT: events, tournaments, games, achievements, moderation, content management
-- - BOFF_ADMIN_RELEASE: desktop builds, pack releases (step-up required)
--
-- BOFF_ADMIN remains as a full super-admin role for backward compatibility.
-- Existing BOFF_ADMIN users are granted all sub-roles to preserve access.

INSERT INTO `boffmedia_roles` (`name`) VALUES
  ('BOFF_ADMIN_CONTENT'),
  ('BOFF_ADMIN_RELEASE')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Assign all sub-roles to existing BOFF_ADMIN users for backward compatibility
-- Get the BOFF_ADMIN role ID, then the new sub-role IDs, and join users to each sub-role
INSERT INTO `boffmedia_user_roles` (`user_id`, `role_id`)
SELECT
  bur.`user_id`,
  br_sub.`id`
FROM `boffmedia_user_roles` bur
INNER JOIN `boffmedia_roles` br_admin ON br_admin.`name` = 'BOFF_ADMIN' AND bur.`role_id` = br_admin.`id`
CROSS JOIN `boffmedia_roles` br_sub
WHERE br_sub.`name` IN ('BOFF_ADMIN_CONTENT', 'BOFF_ADMIN_RELEASE')
ON DUPLICATE KEY UPDATE `role_id` = VALUES(`role_id`);
