-- Stored asset URLs that changed location in the public/ reorganization.
-- Run once, against the same database the API uses. Both statements are
-- idempotent: re-running them matches nothing, because the old substring is
-- gone after the first pass.
--
-- Inspect before committing. Wrap in a transaction if your client does not
-- autocommit; note that MySQL DDL is not transactional but these are DML.

-- 1. Chat screenshots. The files moved from public/uploads/chat-screenshots to
--    laboon/uploads/chat/chat-screenshots, so the URL gains one path segment.
--    The value lives inside a JSON blob in `content` ({"imageUrl": "...", ...}),
--    which is why this is a substring replace rather than a column assignment.
SELECT COUNT(*) AS rows_to_update_chat
FROM rotom_chat_messages
WHERE content LIKE '%/uploads/chat-screenshots/%';

UPDATE rotom_chat_messages
SET content = REPLACE(
      content,
      '/uploads/chat-screenshots/',
      '/uploads/chat/chat-screenshots/'
    )
WHERE content LIKE '%/uploads/chat-screenshots/%';

-- 2. StarBank account pictures. They are user uploads, so they moved out of the
--    read-only asset tree into laboon/uploads/starbank. The stored value keeps
--    its `?v=` cache-busting stamp; only the prefix changes.
SELECT COUNT(*) AS rows_to_update_starbank
FROM rotom_starbank_accounts
WHERE image LIKE '/smartrotom/img/apps/starbank/cuentas/%';

UPDATE rotom_starbank_accounts
SET image = REPLACE(
      image,
      '/smartrotom/img/apps/starbank/cuentas/',
      '/uploads/starbank/'
    )
WHERE image LIKE '/smartrotom/img/apps/starbank/cuentas/%';

-- Verification: both counts must be 0 afterwards.
SELECT
  (SELECT COUNT(*) FROM rotom_chat_messages
     WHERE content LIKE '%/uploads/chat-screenshots/%') AS chat_remaining,
  (SELECT COUNT(*) FROM rotom_starbank_accounts
     WHERE image LIKE '/smartrotom/img/apps/starbank/cuentas/%') AS starbank_remaining;
