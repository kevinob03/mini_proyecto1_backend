# Pruebas y guía de verificación

## API de imágenes

`GET /api/imagenes/buscar?query=black%20corset%20fashion` devuelve `{ "data": [...] }` con `url`, `alt`, `author`, `authorUrl` y `creditUrl`. Usa `content_filter=high` en Unsplash. `POST /api/imagenes/seleccionar` con `{ "photoId": "..." }` notifica la elección de una foto a Unsplash.

## CRUD y catálogo

Base: `http://localhost:3000`.

Crear producto (`POST /api/productos`, `Content-Type: application/json`):

```json
{
  "nombre": "Bodysuit de muestra",
  "descripcion": "Referencia de moda editorial.",
  "precio": 64800,
  "stock": 6,
  "categoria_id": 1,
  "proveedor_id": 1
}
```

La respuesta exitosa es `201` con `{ "data": { ... } }`. Para asociar una imagen, incluye `imagen_url` (HTTPS), `imagen_autor`, `imagen_autor_url`, `imagen_credito_url` e `imagen_fuente`.

`GET /api/productos` devuelve `200` con `{ "data": [...] }`, incluyendo el nombre de categoría/proveedor y datos opcionales de la imagen. Los CRUD completos también están en `/api/categorias` y `/api/proveedores`. Los precios y existencias de las filas de demostración son ficticios; no se procesan compras.

## Registro de verificaciones ejecutadas

- `npm run build` en `frontend/`: completado correctamente (32 módulos transformados).
- `node --check` en el servidor, controlador de entidades, controlador de imágenes y modelo de producto: correcto.
- Servidor Express: inició en `http://localhost:3000`.
- Respaldo local `GET http://127.0.0.1:5173/noir-placeholder.svg`: `200 image/svg+xml`.
- Ilustraciones de producto: se generaron 15 SVG locales en `frontend/public/images/noir/`; sus rutas `/images/noir/<archivo>.svg` se guardan en `productos.imagen_url` desde el SQL de demostración.
- Portada: la imagen compartida por el usuario quedó local en `/images/noir/cover-reference.jpg`, separada de las fotos/ilustraciones de productos.
- `GET /api/imagenes/buscar?query=x`: `400` con JSON indicando longitud mínima.
- `GET /api/imagenes/buscar?query=latex%20fashion`: `503` con JSON indicando que falta configurar Unsplash.
- `POST /api/imagenes/seleccionar` con id inválido: `400` con JSON de validación.
- `GET /api/health`: `503 database unavailable`; MySQL rechaza la conexión `root` sin contraseña.
- No se ejecutó CRUD persistido, migración SQL ni búsqueda real de fotos porque no hay credenciales locales configuradas.
- La revisión visual automática se omitió: no hay navegador disponible en el entorno de control UI (inventario vacío).
