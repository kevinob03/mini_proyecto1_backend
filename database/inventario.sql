CREATE DATABASE IF NOT EXISTS inventario_empresa
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inventario_empresa;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(150) NOT NULL,
  password VARCHAR(255) NOT NULL,
  fechaCreacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_correo (correo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS seguridad_login (
  usuario_id INT UNSIGNED NOT NULL,
  intentos_fallidos TINYINT UNSIGNED NOT NULL DEFAULT 0,
  bloqueado_hasta DATETIME NULL,
  codigo_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
  codigo_expira DATETIME NULL,
  intentos_codigo TINYINT UNSIGNED NOT NULL DEFAULT 0,
  codigo_enviado_en DATETIME NULL,
  reenvios_codigo TINYINT UNSIGNED NOT NULL DEFAULT 0,
  password_reset_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
  password_reset_expira DATETIME NULL,
  PRIMARY KEY (usuario_id),
  CONSTRAINT fk_seguridad_login_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categorias (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categorias_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS proveedores (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(20) NULL,
  correo VARCHAR(150) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_proveedores_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS productos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT NULL,
  precio DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL,
  categoria_id INT UNSIGNED NOT NULL,
  proveedor_id INT UNSIGNED NOT NULL,
  imagen_url VARCHAR(2048) NULL,
  imagen_autor VARCHAR(200) NULL,
  imagen_autor_url VARCHAR(2048) NULL,
  imagen_credito_url VARCHAR(2048) NULL,
  imagen_fuente VARCHAR(100) NULL,
  PRIMARY KEY (id),
  KEY idx_productos_categoria (categoria_id),
  KEY idx_productos_proveedor (proveedor_id),
  CONSTRAINT chk_productos_precio CHECK (precio >= 0),
  CONSTRAINT chk_productos_stock CHECK (stock >= 0),
  CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id)
    REFERENCES categorias (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_productos_proveedor FOREIGN KEY (proveedor_id)
    REFERENCES proveedores (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO categorias (nombre, descripcion) VALUES
  ('Prendas de látex', 'Prendas de moda alternativa en látex'),
  ('Corsetería', 'Corsés y prendas estructuradas de moda'),
  ('Arneses y accesorios', 'Accesorios de moda alternativa'),
  ('Guantes y máscaras', 'Accesorios de moda editorial'),
  ('Cuerdas decorativas', 'Elementos decorativos y de exhibición')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

INSERT INTO proveedores (nombre, telefono, correo) VALUES
  ('Atelier Noche (demo)', NULL, NULL),
  ('Cuero Urbano (demo)', NULL, NULL),
  ('Accesorios Nocturnos (demo)', NULL, NULL)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);
