CREATE DATABASE IF NOT EXISTS inventario_empresa
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inventario_empresa;

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
