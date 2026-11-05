-- Migración aditiva para bloqueo temporal y códigos de desbloqueo por correo.
-- No altera productos, categorías, proveedores ni usuarios existentes.
USE inventario_empresa;

CREATE TABLE IF NOT EXISTS seguridad_login (
  usuario_id INT UNSIGNED NOT NULL,
  intentos_fallidos TINYINT UNSIGNED NOT NULL DEFAULT 0,
  bloqueado_hasta DATETIME NULL,
  codigo_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
  codigo_expira DATETIME NULL,
  intentos_codigo TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (usuario_id),
  CONSTRAINT fk_seguridad_login_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
