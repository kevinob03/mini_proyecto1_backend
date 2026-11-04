-- Productos ficticios con ilustraciones vectoriales locales originales; no son fotos de artículos reales.
USE inventario_empresa;
CREATE TEMPORARY TABLE noir_demo_products (
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL,
  imagen_url VARCHAR(300) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  proveedor VARCHAR(150) NOT NULL
);

INSERT INTO noir_demo_products VALUES
  ('Catsuit Eclipse', 'Prenda de moda de cuerpo completo, acabado brillante.', 89500, 4, '/images/noir/catsuit-eclipse.svg', 'Prendas de látex', 'Atelier Noche (demo)'),
  ('Catsuit Ónix', 'Diseño de cuello alto para estilismo editorial.', 97200, 3, '/images/noir/catsuit-onix.svg', 'Prendas de látex', 'Atelier Noche (demo)'),
  ('Bodysuit Aurora', 'Bodysuit de líneas limpias en tono ciruela.', 64800, 6, '/images/noir/bodysuit-aurora.svg', 'Prendas de látex', 'Atelier Noche (demo)'),
  ('Bodysuit Sombra', 'Silueta minimalista con acabado oscuro.', 61900, 5, '/images/noir/bodysuit-sombra.svg', 'Prendas de látex', 'Atelier Noche (demo)'),
  ('Vestido Nocturna', 'Vestido de moda alternativa con corte recto.', 75400, 3, '/images/noir/vestido-nocturna.svg', 'Prendas de látex', 'Atelier Noche (demo)'),
  ('Vestido Carmesí', 'Vestido de línea elegante en color vino.', 78100, 2, '/images/noir/vestido-carmesi.svg', 'Prendas de látex', 'Atelier Noche (demo)'),
  ('Corsé Velvet', 'Corsé de inspiración vintage en material sintético.', 53200, 7, '/images/noir/corse-velvet.svg', 'Corsetería', 'Cuero Urbano (demo)'),
  ('Corsé Obsidiana', 'Corsé estructurado de acabado mate.', 57900, 4, '/images/noir/corse-obsidiana.svg', 'Corsetería', 'Cuero Urbano (demo)'),
  ('Arnés Geométrico', 'Accesorio de moda con tiras ajustables.', 32800, 8, '/images/noir/arnes-geometrico.svg', 'Arneses y accesorios', 'Accesorios Nocturnos (demo)'),
  ('Arnés Minimal', 'Diseño de líneas sencillas para estilismo.', 28900, 9, '/images/noir/arnes-minimal.svg', 'Arneses y accesorios', 'Accesorios Nocturnos (demo)'),
  ('Choker Meridian', 'Collar decorativo con herrajes plateados.', 14500, 12, '/images/noir/choker-meridian.svg', 'Arneses y accesorios', 'Accesorios Nocturnos (demo)'),
  ('Muñequeras Atlas', 'Par de accesorios de cuero sintético.', 18900, 10, '/images/noir/munecas-atlas.svg', 'Arneses y accesorios', 'Cuero Urbano (demo)'),
  ('Guantes Opera', 'Guantes largos de moda con acabado brillante.', 21500, 8, '/images/noir/guantes-opera.svg', 'Guantes y máscaras', 'Atelier Noche (demo)'),
  ('Antifaz Prisma', 'Antifaz decorativo para estilismo editorial.', 16200, 11, '/images/noir/antifaz-prisma.svg', 'Guantes y máscaras', 'Accesorios Nocturnos (demo)'),
  ('Cuerda Escénica', 'Cuerda decorativa para exhibición y fotografía.', 12800, 6, '/images/noir/cuerda-escenica.svg', 'Cuerdas decorativas', 'Accesorios Nocturnos (demo)');

INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, imagen_fuente, categoria_id, proveedor_id)
SELECT d.nombre, d.descripcion, d.precio, d.stock, d.imagen_url, 'Ilustración original NOIR', c.id, p.id
FROM noir_demo_products d
JOIN categorias c ON c.nombre = d.categoria
JOIN proveedores p ON p.nombre = d.proveedor
WHERE NOT EXISTS (SELECT 1 FROM productos x WHERE x.nombre = d.nombre);

UPDATE productos p
JOIN noir_demo_products d ON d.nombre = p.nombre
SET p.imagen_fuente = 'Ilustración original NOIR', p.imagen_url = d.imagen_url
WHERE p.imagen_url IS NULL OR p.imagen_url = '';

DROP TEMPORARY TABLE noir_demo_products;
