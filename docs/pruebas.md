# Plan y resultados de pruebas — Día 2

## Ejecución observada

El 5 de noviembre de 2026 se ejecutó `node scripts/smoke-day2.js` desde `backend/`, contra el servidor Express local y MySQL configurado en `backend/.env`.

**Resultado real: 50 pruebas HTTP superadas.** Se verificaron registro correcto (201), registro inválido y correo duplicado (400), login válido (200), contador de intentos restantes sin revelar información para correos inexistentes, límite de 5 contraseñas fallidas y bloqueo (423), rechazo de login mientras está bloqueado, reenvío de código (200), espera de 60 segundos y máximo de 3 reenvíos (429), código incorrecto (400), código correcto (200), elección de conservar o cambiar contraseña, permiso temporal de un solo uso, rechazo de contraseña corta, contraseña anterior inválida tras el cambio, nuevo login con contraseña actualizada, `/me` con y sin token (200/401), token mal formado y token correctamente firmado pero expirado (401), CRUD de categorías/proveedores/productos (201/200/204), acceso sin token a categorías e imágenes (401), ID inexistente (404), datos inválidos (400), clave foránea inexistente (400) y borrado de categoría relacionada (409). La API no devolvió hashes de contraseñas ni permisos temporales.

También se confirmó conexión MySQL con `SELECT 1`, presencia de las tablas `usuarios` y `seguridad_login` tras ejecutar las migraciones y compilación Vite exitosa. El recorrido de desbloqueo usa una cuenta QA temporal; para verificar los endpoints sin enviar un correo real, el script instala un HMAC de código conocido únicamente en esa fila y limpia los datos QA al final. No se imprimen credenciales ni secretos y no se eliminan registros preexistentes.

## Colección Postman

Importa [`postman/NOIR_Dia2.postman_collection.json`](../postman/NOIR_Dia2.postman_collection.json) y ejecútala en orden. La primera petición define un correo QA único; la petición de login almacena el token como variable de colección. Requiere que API y MySQL estén ejecutándose.

La colección prepara registros QA propios y termina eliminando el producto, categoría y proveedor QA. Ejecuta toda la colección en el mismo orden para que los identificadores se compartan. El usuario de prueba no cuenta con endpoint de borrado por diseño; para limpiar ese usuario QA después, usa SQL parametrizado con el correo generado en la variable `email`. No borres usuarios reales.

La colección contiene los casos de token inválido y de intento de desbloqueo sin código activo. La prueba de integración genera localmente un JWT firmado con expiración pasada, sin esperar una hora, y comprueba 401; también ejercita el flujo de bloqueo y verificación con datos QA.

## Limitaciones de la evidencia

- La colección está preparada para importar, pero no se reporta como ejecutada dentro de Postman.
- El build probado es el build de producción de Vite; el flujo de UI no se automatizó con un navegador.
- La prueba de integración necesita el `.env` privado local y no crea una base de datos desde cero.
