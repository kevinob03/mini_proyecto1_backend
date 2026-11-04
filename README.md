# NOIR — Latex & Bondage

Aplicación académica de inventario presentada como boutique editorial de moda alternativa para adultos. React/Vite consume una API REST en Node.js/Express y MySQL. Incluye catálogo visual y administración CRUD de productos, categorías y proveedores.

El catálogo es una demostración: sus productos, precios y existencias son ficticios; no hay carrito, ventas ni compras. Incluye 15 ilustraciones vectoriales originales y locales, asignadas a su pieza de muestra correspondiente. Son representaciones editoriales, no fotografías de productos reales. Las imágenes no se asignan aleatoriamente.

## Estructura

```text
backend/src/{config,controllers,models,routes}/ API Express
frontend/src/{components,pages,services}/       Catálogo y administración React
frontend/public/noir-placeholder.svg            Respaldo ilustrado genérico
frontend/public/images/noir/                    15 ilustraciones originales para el catálogo
frontend/scripts/generate-noir-illustrations.mjs Generador de las ilustraciones SVG
database/inventario.sql                        Esquema NOIR para instalación nueva
database/002_noir_image_migration.sql          Migración aditiva de imagen
database/noir_demo_products.sql                 15 registros ficticios de catálogo
docs/                                           Entregables académicos y pruebas
```

## Requisitos

- Node.js 20 o posterior y npm.
- MySQL 8 con InnoDB.
- Credenciales locales de MySQL configuradas por el usuario.
- Opcional: una aplicación Unsplash y su Access Key.

## Preparar la base de datos

### Instalación nueva

En MySQL Workbench, conéctate usando una cuenta administradora que ya tengas, abre `database/inventario.sql` (**File → Open SQL Script**) y ejecútalo con el botón del rayo. Después abre y ejecuta `database/noir_demo_products.sql`. El esquema crea las tres entidades, sus relaciones y campos para URLs y atribución de fotografías.

### Base creada con la versión anterior del inventario

La migración solo agrega columnas; no borra datos. En MySQL Workbench, conectado con una cuenta administradora, abre `database/002_noir_image_migration.sql` y ejecútalo una sola vez; luego abre y ejecuta `database/noir_demo_products.sql`. No repitas la migración una vez añadidas sus columnas. Los productos demo se insertan si aún no existen; si ya existen sin imagen, el script les asigna la ilustración local correspondiente y conserva las imágenes que ya tuvieran.

Las rutas quedan guardadas en `productos.imagen_url`, por ejemplo `/images/noir/catsuit-eclipse.svg` y `/images/noir/arnes-geometrico.svg`. Los archivos viven bajo `frontend/public/images/noir/` y Vite los sirve como `/images/noir/<archivo>.svg`.

## Configuración local

1. Copia `backend/.env.example` a `backend/.env`.
2. Confirma que ya importaste el esquema con un usuario administrador de MySQL que ya tengas.
3. Desde MySQL Workbench conectado con tu cuenta administradora, crea un usuario de aplicación con una contraseña elegida localmente:

   ```sql
   CREATE USER 'noir_app'@'localhost' IDENTIFIED BY 'ELIGE_UNA_CONTRASENA_LOCAL';
   GRANT SELECT, INSERT, UPDATE, DELETE ON inventario_empresa.* TO 'noir_app'@'localhost';
   FLUSH PRIVILEGES;
   ```

   No pegues la contraseña en este repositorio. Pon el mismo valor elegido en `DB_PASSWORD` dentro de `backend/.env` y deja `DB_USER=noir_app`.

4. Completa `DB_HOST`, `DB_PORT` y `DB_NAME` según tu servicio. No se incluye contraseña ni se modifica la del usuario `root`.
5. Para imágenes, crea una aplicación en Unsplash y coloca su clave únicamente en `UNSPLASH_ACCESS_KEY` dentro de `backend/.env`. La interfaz React nunca recibe esta clave. Sin ella, los CRUD y el catálogo siguen disponibles; el selector permite ingresar una URL HTTPS propia autorizada.
6. Opcionalmente copia `frontend/.env.example` a `frontend/.env` si la API no está en `http://localhost:3000/api`.

El endpoint propio `GET /api/imagenes/buscar?query=latex%20fashion` solicita a Unsplash resultados con `content_filter=high`, caché en memoria de 10 minutos y límites locales de 20 solicitudes por IP por minuto y 45 llamadas upstream por hora (ajustable hasta 45 mediante `UNSPLASH_HOURLY_LIMIT`, para conservar margen respecto al límite de demo de Unsplash). `POST /api/imagenes/seleccionar` notifica la selección de la imagen usando el `download_location` recibido de Unsplash. La [documentación oficial de Unsplash](https://unsplash.com/documentation) exige hotlink de las URLs de imagen y atribución del fotógrafo y Unsplash con parámetros UTM; el catálogo muestra ambos créditos. El filtro `high` reduce ciertos resultados, pero no garantiza que todos sean adecuados, así que el administrador debe revisar cada foto antes de asignarla.

## Instalar y ejecutar

En dos terminales, desde la raíz del proyecto:

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

Abre la URL local indicada por Vite, normalmente `http://localhost:5173`. En la barra superior puedes alternar entre **Catálogo** y **Administración**.

## Endpoints

`/api/productos`, `/api/categorias` y `/api/proveedores` tienen `GET`, `POST`, `GET /:id`, `PUT /:id` y `DELETE /:id`. `GET /api/health` comprueba la conexión de base de datos. Consulta [docs/pruebas.md](docs/pruebas.md) para ejemplos; [docs/justificacion.md](docs/justificacion.md) y [docs/modelo-datos.md](docs/modelo-datos.md) describen la práctica.

## Conexión MySQL observada anteriormente

En la revisión previa, el servicio MySQL 8 estaba activo, pero `root` rechazó la conexión sin contraseña (`Access denied`). Configura en `backend/.env` un usuario y contraseña válidos que ya tengas, o crea un usuario de aplicación con los permisos necesarios usando tu administrador de MySQL. No se cambió ni se inventó ninguna credencial.

El API respondió a la validación de búsqueda con `400` para consultas demasiado cortas. Sin `UNSPLASH_ACCESS_KEY`, la búsqueda devuelve `503` con una explicación y sigue disponible el campo de URL propia. La compilación de React pasó. Quedan pendientes el importado del esquema, CRUD persistido, búsqueda Unsplash y carga de imágenes reales hasta configurar esas credenciales y `UNSPLASH_ACCESS_KEY`.
