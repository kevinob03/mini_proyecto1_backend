# Progreso — Mini Proyecto 1, Día 2

Fecha de trabajo: 5 de noviembre de 2026 (Costa Rica). Las horas del plan son objetivos originales; se ajustan al tiempo real disponible.

## Fase 1 (10:30–11:00) — Inspección, investigación y planificación
- [x] Revisar la estructura del repositorio existente. Evidencia: `backend/`, `frontend/`, `database/`, `docs/`; se conserva la aplicación NOIR.
- [x] Consultar el PDF del Día 2 y contrastarlo con el prompt del usuario. Evidencia: rúbrica identificada: CRUD, JWT/bcrypt, interfaz autenticada, relaciones y documentación.
- [x] Investigar fuentes técnicas de JWT, almacenamiento y validación. Evidencia: referencias oficiales registradas en `docs/investigacion-jwt.md` (en elaboración).
- [x] Anotar incompatibilidades entre el PDF y la solicitud. Evidencia: el prompt detalla sessionStorage y exige `/api/auth/me`; se aplican ambos y se mantiene el alcance del PDF.

## Fase 2 (11:00–11:45) — Base de datos, usuario, bcrypt, JWT y middleware
- [x] Crear la tabla `usuarios` en el esquema principal. Evidencia: `database/inventario.sql`.
- [x] Crear migración aditiva y repetible para bases existentes. Evidencia: `database/003_usuarios_migration.sql`; ejecutada en la base local, resultado: tabla presente.
- [x] Implementar registro/login/perfil con validación y bcrypt. Evidencia: `backend/src/controllers/authController.js`, `backend/src/models/userModel.js`.
- [x] Validar `JWT_SECRET` al iniciar; implementar JWT de una hora. Evidencia: `backend/src/app.js`; secreto aleatorio local agregado a `.env`, valor no registrado.
- [x] Implementar middleware Bearer JWT y respuestas 401 JSON. Evidencia: `backend/src/middlewares/authMiddleware.js`.

## Fase 3 (11:45–12:30) — CRUD, protección y relaciones
- [x] Verificar los cinco endpoints CRUD para productos, categorías y proveedores. Evidencia: `backend/src/routes/entityRoutes.js`; pruebas HTTP realizadas.
- [x] Proteger todos los endpoints de gestión e imágenes con JWT. Evidencia: montajes con `authMiddleware` en `backend/src/app.js`.
- [x] Verificar validación de claves foráneas y estados 400/404/409. Evidencia actualizada: 50 pruebas en `backend/scripts/smoke-day2.js`, incluidas relaciones y estados de error.
- [x] Documentar health check público si se conserva. Evidencia: documentado en README como endpoint técnico sin datos empresariales.

## Fase 4 (12:30–1:30) — Login, registro, rutas protegidas y logout
- [x] Integrar React Router sin reemplazar el diseño/catálogo existente. Evidencia: `frontend/src/App.jsx`; layout y catálogo se mantienen.
- [x] Crear login y registro con validaciones y mensajes claros. Evidencia: `frontend/src/pages/Login.jsx`, `Registro.jsx`.
- [x] Implementar AuthContext con `sessionStorage` y validación inicial `/me`. Evidencia: `frontend/src/context/AuthContext.jsx`.
- [x] Proteger el catálogo y la administración; agregar cierre de sesión. Evidencia: `RutaProtegida.jsx` y botón del layout.
- [x] Adjuntar Bearer automáticamente y limpiar sesión ante HTTP 401. Evidencia: `frontend/src/services/api.js`.

## Fase 5 (1:30–2:10) — Pruebas y colección Postman
- [x] Preparar colección importable con variables de entorno y JWT reutilizable. Evidencia: `postman/NOIR_Dia2.postman_collection.json`.
- [x] Cubrir autenticación y CRUD, incluyendo errores y ausencia de token. Evidencia: colección y `backend/scripts/smoke-day2.js`.
- [x] Ejecutar pruebas posibles y registrar resultados observados. Evidencia actualizada: 50 pruebas HTTP aprobadas en `docs/pruebas.md`, incluidos JWT expirado, reenvíos y ambos caminos tras el desbloqueo.
- [x] Verificar compilación de frontend y arranque/configuración del backend. Evidencia: Vite build exitosa; servidor inicia y MySQL conectado.

## Fase 6 (2:10–2:40) — Documentación y rúbrica
- [x] Completar investigación JWT con fuentes reales. Evidencia: `docs/investigacion-jwt.md` con RFC, OWASP, Auth0 y MDN.
- [x] Actualizar diagrama entidad-relación. Evidencia: `docs/modelo-datos.md` incluye USUARIOS y SEGURIDAD_LOGIN.
- [x] Actualizar README, `.env.example` y guía de migración/ejecución. Evidencia: README y ejemplo de configuración revisados.
- [x] Documentar la colección y los resultados de pruebas. Evidencia actualizada: `docs/pruebas.md` registra 50 pruebas reales y limitaciones.

## Fase 7 (2:40–3:00) — Revisión crítica
- [x] Revisar los criterios obligatorios de la rúbrica y corregir fallas críticas. Evidencia actualizada: build final y 50 pruebas aprobadas.
- [x] Confirmar que secretos/datos existentes no se exponen ni se eliminan. Evidencia: `.env` ignorado; secreto privado; prueba limpia solo datos QA.

## Problemas encontrados y pendientes
- Repositorio inicial: CRUD de las tres entidades ya existe; todavía no tiene autenticación.
- MySQL está instalado como servicio; la conexión depende de las variables locales privadas en `backend/.env`.
- No se imprimen credenciales ni secretos en este archivo ni en los registros.

## Avance real aproximado
100% de los entregables implementables y verificados localmente. La colección Postman está lista para importar; la UI no fue automatizada con navegador.

## Próximo paso recomendado
Importar la colección en Postman si se requiere evidencia gráfica para la entrega; los servidores de backend y frontend quedan iniciados para la demostración.

## Mejora solicitada después del Día 2 — Desbloqueo por correo
- [x] Agregar estado de intentos y bloqueo temporal con migración aditiva `database/004_bloqueo_login_correo.sql`.
- [x] Bloquear tras 5 intentos fallidos durante 15 minutos y emitir código de uso único con caducidad de 10 minutos.
- [x] Guardar HMAC del código, aceptar hasta 5 intentos de verificación y exigir login normal después del desbloqueo.
- [x] Añadir pantalla de verificación y servicio de entrega SMTP con modo de consola solo para desarrollo.
- [ ] Configurar credenciales SMTP reales para que los correos lleguen a una bandeja.
- [x] Ejecutar la suite actualizada de API y el build final. Evidencia: build Vite exitoso y 50 pruebas HTTP aprobadas, incluidos contador, reenvíos y cambio opcional de contraseña; correo real pendiente de credenciales SMTP.
- [x] Mostrar intentos restantes en login tras cada contraseña incorrecta, sin revelar contador para correos inexistentes. Evidencia: `frontend/src/pages/Login.jsx`, `backend/src/controllers/authController.js` y smoke test.
- [x] Añadir botón de reenvío con espera de 60 segundos y máximo de tres reenvíos por bloqueo. Evidencia: `POST /api/auth/resend-unlock`, migración `database/005_reenvio_codigo.sql` y pruebas HTTP.
- [x] Tras verificar el correo, ofrecer cambio de contraseña; usar permiso HMAC temporal y revocable, de un solo uso. Evidencia: rutas `reset-password` y `skip-password-reset`, migración `database/006_password_reset_grant.sql` y smoke tests.
- [x] Volver a ejecutar suite/build tras la pregunta de cambio. Evidencia: 50 pruebas y build final.
