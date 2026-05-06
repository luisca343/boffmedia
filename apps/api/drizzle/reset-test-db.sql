-- WARNING: This script irreversibly deletes only VGC-prefixed views and tables
-- (name starts with `vgc_`) in the current database.
-- Use only in local/test environments.

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- Drop views first to avoid dependency issues on some MySQL setups.
SET @OLD_GROUP_CONCAT_MAX_LEN = @@GROUP_CONCAT_MAX_LEN;
SET SESSION group_concat_max_len = 1024 * 1024;

SELECT GROUP_CONCAT(CONCAT('`', table_name, '`') ORDER BY table_name SEPARATOR ', ')
INTO @view_list
FROM information_schema.views
WHERE table_schema = DATABASE()
  AND table_name LIKE 'vgc\_%';

SET @drop_views_sql = IF(
  @view_list IS NULL OR @view_list = '',
  'SELECT 1',
  CONCAT('DROP VIEW IF EXISTS ', @view_list)
);

PREPARE stmt_drop_views FROM @drop_views_sql;
EXECUTE stmt_drop_views;
DEALLOCATE PREPARE stmt_drop_views;

-- Drop only VGC-prefixed tables in the selected database.
SELECT GROUP_CONCAT(CONCAT('`', table_name, '`') ORDER BY table_name SEPARATOR ', ')
INTO @table_list
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_type = 'BASE TABLE'
  AND table_name LIKE 'vgc\_%';

SET @drop_tables_sql = IF(
  @table_list IS NULL OR @table_list = '',
  'SELECT 1',
  CONCAT('DROP TABLE IF EXISTS ', @table_list)
);

PREPARE stmt_drop_tables FROM @drop_tables_sql;
EXECUTE stmt_drop_tables;
DEALLOCATE PREPARE stmt_drop_tables;

SET SESSION group_concat_max_len = @OLD_GROUP_CONCAT_MAX_LEN;
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;