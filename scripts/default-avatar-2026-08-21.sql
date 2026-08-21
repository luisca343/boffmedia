-- The default avatar pointed at cdn.boffmedia.es, a host that was never set up,
-- so every account created since has a broken picture. It now points at a file
-- in the asset tree, stored relative like every other asset path.
--
-- Run AFTER migration 0002_profile_picture_default.sql and after
-- /boffmedia/img/profile.png exists on the server.

-- 1. Survey: how many rows point at the dead host, and in what shape?
SELECT profile_picture, COUNT(*) AS rows
FROM boffmedia_users
WHERE profile_picture LIKE 'https://cdn.boffmedia.es/%'
GROUP BY profile_picture
ORDER BY rows DESC;

-- 2. Rows holding the old default become the new default. Exact match only, so
--    a user's real uploaded avatar is never overwritten by this statement.
UPDATE boffmedia_users
SET profile_picture = '/boffmedia/img/profile.png'
WHERE profile_picture = 'https://cdn.boffmedia.es/default-profile.png';

-- 3. Any rows the survey still shows are per-user avatars that were uploaded to
--    the dead CDN, so their files do not exist anywhere. Decide from the survey
--    output before running this — it resets those users to the default picture.
-- UPDATE boffmedia_users
-- SET profile_picture = '/boffmedia/img/profile.png'
-- WHERE profile_picture LIKE 'https://cdn.boffmedia.es/%';

-- 4. Verification: expect 0.
SELECT COUNT(*) AS remaining_cdn_rows
FROM boffmedia_users
WHERE profile_picture LIKE 'https://cdn.boffmedia.es/%';
