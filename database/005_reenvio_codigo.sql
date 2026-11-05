-- Añade enfriamiento y límite de reenvíos; repetible en MySQL 8.
USE inventario_empresa;

SET @noir_column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'seguridad_login' AND COLUMN_NAME = 'codigo_enviado_en'
);
SET @noir_sql = IF(@noir_column_exists = 0,
  'ALTER TABLE seguridad_login ADD COLUMN codigo_enviado_en DATETIME NULL',
  'SELECT 1');
PREPARE noir_stmt FROM @noir_sql;
EXECUTE noir_stmt;
DEALLOCATE PREPARE noir_stmt;

SET @noir_column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'seguridad_login' AND COLUMN_NAME = 'reenvios_codigo'
);
SET @noir_sql = IF(@noir_column_exists = 0,
  'ALTER TABLE seguridad_login ADD COLUMN reenvios_codigo TINYINT UNSIGNED NOT NULL DEFAULT 0',
  'SELECT 1');
PREPARE noir_stmt FROM @noir_sql;
EXECUTE noir_stmt;
DEALLOCATE PREPARE noir_stmt;
