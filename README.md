# NOIR — Latex & Bondage

Aplicación académica de inventario presentada como boutique editorial de moda alternativa para adultos. El frontend usa React/Vite; el backend, Node.js/Express; la persistencia, MySQL. Incluye catálogo visual, CRUD de productos/categorías/proveedores y autenticación con JWT y bcrypt.

El catálogo muestra productos, precios e inventario ficticios; no hay compras, ventas ni pagos. Las ilustraciones SVG existentes se conservan y son representaciones editoriales, no fotos de productos reales.

## Estructura

```text
backend/src/                 API REST, JWT, bcrypt y CRUD
backend/scripts/             Prueba de integración del Día 2
frontend/src/                Catálogo, administración y pantallas de autenticación
frontend/public/images/noir/ Ilustraciones originales existentes
database/inventario.sql      Esquema para instalación nueva
database/003_usuarios_migration.sql  Migración aditiva de Usuario
database/004_bloqueo_login_correo.sql Migración de bloqueos/códigos de desbloqueo
database/005_reenvio_codigo.sql      Migración para enfriamiento/límite de reenvíos
database/006_password_reset_grant.sql  Permiso temporal para cambio de contraseña
docs/investigacion-jwt.md    Informe de investigación JWT
docs/modelo-datos.md         Modelo relacional y diagrama ER
docs/pruebas.md              Pruebas y colección Postman
postman/NOIR_Dia2.postman_collection.json
PROGRESO_DIA2.md             Checklist y avance real
```

## Requisitos

- Node.js 20 o posterior y npm.
- MySQL 8 con InnoDB.
- Credenciales de MySQL locales que ya tengas o un usuario de aplicación creado por tu administrador.

## Base de datos

Para una instalación nueva, crea el esquema ejecutando `database/inventario.sql` desde MySQL Workbench. Para conservar una base existente, ejecuta `database/003_usuarios_migration.sql`, `database/004_bloqueo_login_correo.sql`, `database/005_reenvio_codigo.sql` y `database/006_password_reset_grant.sql` en ese orden; son aditivas y no eliminan ni modifican productos, categorías o proveedores.

Si todavía necesitas los campos de imágenes, ejecuta la migración existente `database/002_noir_image_migration.sql` de acuerdo con su documentación previa. Los datos de muestra opcionales están en `database/noir_demo_products.sql`.

## Configuración local

1. Copia `backend/.env.example` a `backend/.env` y rellena los datos MySQL con credenciales válidas de tu entorno. No guardes `.env` en Git.
2. Genera un secreto aleatorio de al menos 32 bytes y guárdalo solo en `JWT_SECRET` dentro de `backend/.env`. En PowerShell:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
   ```

   El servidor rechaza un secreto ausente, corto o de ejemplo; no tiene una clave predeterminada. En producción usa HTTPS y un gestor de secretos.
3. Opcionalmente configura `UNSPLASH_ACCESS_KEY` para las funciones existentes de búsqueda de imágenes. Esta clave solo se usa en el backend. Los CRUD y las ilustraciones locales no dependen de ella.
4. `frontend/.env.example` permite cambiar `VITE_API_URL`; por defecto se usa `http://localhost:3000/api`.
5. Para enviar códigos a correos reales, configura `MAIL_MODE=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` y `MAIL_FROM` en `backend/.env`. `MAIL_MODE=console` es solo para desarrollo local: imprime el código en la terminal y no envía correo. No uses ese modo en producción.

## Instalar y ejecutar

Desde la raíz, instala dependencias y abre dos terminales:

```powershell
cd backend
npm install
npm run dev
```

```powershell
cd frontend
npm install
npm run dev
```

Abre la dirección que muestra Vite, normalmente `http://localhost:5173`. La única ruta técnica pública es `GET /api/health`, que comprueba disponibilidad de la API y MySQL y no devuelve registros empresariales. El registro y el login son públicos; el catálogo, las imágenes y todos los CRUD requieren autenticación.

## Registro y sesión

1. Abre `/registro`, crea un nombre, correo y contraseña de al menos 8 caracteres.
2. Inicia sesión en `/login`. El backend normaliza el correo, guarda únicamente bcrypt y entrega un JWT de una hora.
3. React guarda solo el token en `sessionStorage`, valida la sesión en `/api/auth/me` al recargar y envía `Authorization: Bearer <token>` a las rutas privadas.
4. El botón **Cerrar sesión** borra el token de esa pestaña. Una respuesta 401 también limpia la sesión y vuelve a solicitar autenticación.
5. Cinco contraseñas incorrectas bloquean el login por 15 minutos. Se envía un código de un solo uso al correo; vence a los 10 minutos y permite desbloquear, pero luego se debe iniciar sesión con la contraseña. Hay hasta cinco intentos para ingresar el código. Se puede reenviar cada 60 segundos, hasta tres veces por bloqueo.
6. Después de verificar el correo, la pantalla pregunta si se desea cambiar la contraseña. Si elige cambiarla, un permiso aleatorio de un solo uso, guardado como HMAC en MySQL, autoriza el cambio por 10 minutos. Si elige continuar, ese permiso se revoca y se conserva la contraseña actual.

La práctica usa `sessionStorage` por requisito académico. Como cualquier almacenamiento accesible a JavaScript, un token allí puede quedar expuesto ante XSS; no se guardan contraseñas. Lee las limitaciones y alternativas en `docs/investigacion-jwt.md`.

## API

- `POST /api/auth/register` — crea usuario y devuelve datos públicos, sin contraseña ni hash.
- `POST /api/auth/login` — devuelve `{ token, usuario }`.
- `POST /api/auth/verify-unlock` — valida el código de 6 dígitos y desbloquea; es pública para que funcione la recuperación antes del login.
- `POST /api/auth/resend-unlock` — reenvía el código mientras el bloqueo siga activo, con espera y límite para reducir spam.
- `POST /api/auth/reset-password` — cambia la contraseña usando el permiso temporal emitido tras verificar el correo.
- `POST /api/auth/skip-password-reset` — revoca el permiso temporal si la persona elige conservar su contraseña.
- `GET /api/auth/me` — datos públicos del usuario actual; requiere JWT.
- `/api/productos`, `/api/categorias`, `/api/proveedores` — cada recurso tiene `POST`, `GET`, `GET /:id`, `PUT /:id`, `DELETE /:id`; todos requieren Bearer JWT.
- `/api/imagenes` también requiere JWT.
- `GET /api/health` es el único endpoint técnico público y devuelve solo estado de conexión.

Los errores de validación responden 400, token ausente/inválido/expirado 401, registro inexistente 404 y borrado que viola una FK 409. Las relaciones de productos validan categoría/proveedor y las consultas SQL usan parámetros.

## Pruebas

Prueba de integración HTTP contra el backend y MySQL local:

```powershell
cd backend
node scripts/smoke-day2.js
```

La prueba crea datos QA con correo único, verifica autenticación/CRUD/errores y elimina solo las filas que creó. Para repetir pruebas manuales, importa `postman/NOIR_Dia2.postman_collection.json` en Postman y ejecútala en orden; la colección guarda y reutiliza el JWT. Consulta los resultados observados y su alcance en `docs/pruebas.md`.

## Documentación académica

- [Investigación JWT](docs/investigacion-jwt.md)
- [Modelo de datos y diagrama ER](docs/modelo-datos.md)
- [Pruebas](docs/pruebas.md)
- [Justificación original](docs/justificacion.md)
- [Progreso Día 2](PROGRESO_DIA2.md)
