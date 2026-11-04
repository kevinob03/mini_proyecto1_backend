-- Migración aditiva para una base creada con la versión inicial del inventario.
-- Ejecutar una sola vez sobre inventario_empresa; no borra ni reemplaza datos.
USE inventario_empresa;
ALTER TABLE productos
  ADD COLUMN imagen_url VARCHAR(2048) NULL,
  ADD COLUMN imagen_autor VARCHAR(200) NULL,
  ADD COLUMN imagen_autor_url VARCHAR(2048) NULL,
  ADD COLUMN imagen_credito_url VARCHAR(2048) NULL,
  ADD COLUMN imagen_fuente VARCHAR(100) NULL;

INSERT INTO categorias (nombre, descripcion) VALUES
  ('Prendas de látex', 'Prendas de moda alternativa en látex'),
  ('Corsetería', 'Corsés y prendas estructuradas de moda'),
  ('Arneses y accesorios', 'Accesorios de moda alternativa'),
  ('Guantes y máscaras', 'Accesorios de moda editorial'),
  ('Cuerdas decorativas', 'Elementos decorativos y de exhibición')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

INSERT INTO proveedores (nombre, telefono, correo)
SELECT 'Atelier Noche (demo)', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE nombre = 'Atelier Noche (demo)');
INSERT INTO proveedores (nombre, telefono, correo)
SELECT 'Cuero Urbano (demo)', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE nombre = 'Cuero Urbano (demo)');
INSERT INTO proveedores (nombre, telefono, correo)
SELECT 'Accesorios Nocturnos (demo)', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE nombre = 'Accesorios Nocturnos (demo)');
