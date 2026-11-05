-- Guarda un permiso efímero de un solo uso para cambiar contraseña después del código.
USE inventario_empresa;

SET @noir_column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'seguridad_login' AND COLUMN_NAME = 'password_reset_hash'
);
SET @noir_sql = IF(@noir_column_exists = 0,
  'ALTER TABLE seguridad_login ADD COLUMN password_reset_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL',
  'SELECT 1');
PREPARE noir_stmt FROM @noir_sql;
EXECUTE noir_stmt;
DEALLOCATE PREPARE noir_stmt;

SET @noir_column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'seguridad_login' AND COLUMN_NAME = 'password_reset_expira'
);
SET @noir_sql = IF(@noir_column_exists = 0,
  'ALTER TABLE seguridad_login ADD COLUMN password_reset_expira DATETIME NULL',
  'SELECT 1');
PREPARE noir_stmt FROM @noir_sql;
EXECUTE noir_stmt;
DEALLOCATE PREPARE noir_stmt;
