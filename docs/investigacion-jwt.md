# Investigación: autenticación con JWT

## ¿Qué es un JWT?

Un JSON Web Token (JWT) es una forma compacta de transportar afirmaciones (claims) entre sistemas. Se usa con frecuencia para que una API reciba la identidad de una sesión en cada petición. Un JWT firmado permite comprobar integridad y autoría, pero la firma **no cifra** el contenido: cualquiera que tenga el token puede leer su payload. Por eso no se deben poner secretos ni datos privados en él.

## Partes y validación

Un JWT firmado suele tener tres segmentos separados por puntos: `header.payload.signature`. El header declara el tipo y el algoritmo; el payload lleva claims como `sub` (sujeto), `iss` (emisor), `aud` (destinatario) y `exp` (vencimiento); la firma se calcula sobre los segmentos codificados con una clave. La API verifica la firma y las condiciones esperadas antes de confiar en el identificador. Base64url es una codificación, no cifrado. La especificación permite también JWT cifrados, pero este proyecto no los necesita.

Con `jsonwebtoken`, Node puede firmar con `jwt.sign(payload, secret, { expiresIn: '1h' })` y verificar con `jwt.verify(token, secret, { algorithms: ['HS256'] })`. La aplicación fija el algoritmo y comprueba emisor y audiencia para evitar aceptar tokens de otro contexto. No se usa `jwt.decode` como validación: decodificar no demuestra que el token sea auténtico. El middleware lee `Authorization: Bearer <token>`, verifica el JWT, extrae el `sub` y deja continuar; si falta, está mal formado, la firma falla o expiró, responde 401 JSON.

## Expiración y refresh tokens

`exp` marca el instante a partir del cual el token ya no debe aceptarse. En NOIR el access token dura una hora. Un refresh token es una credencial de vida más larga que se usa para pedir un nuevo access token sin volver a escribir la contraseña. Su manejo requiere rotación, almacenamiento protegido, detección de reutilización y revocación, así que aumenta el alcance de seguridad. El requisito pide investigarlo, pero no implementarlo. Cuando el token actual vence, la API responde 401, el frontend borra la sesión y la persona inicia sesión de nuevo.

## Dónde guardar tokens en el navegador

| Opción | Comportamiento | Consideraciones |
|---|---|---|
| `localStorage` | Persiste entre reinicios del navegador | JavaScript del mismo origen puede leerlo; una vulnerabilidad XSS puede robarlo. |
| `sessionStorage` | Persiste al recargar la pestaña y normalmente se elimina al cerrar esa pestaña | También es legible por JavaScript y por tanto vulnerable a XSS; no es una bóveda de secretos. |
| Cookie `httpOnly` | JavaScript no puede leerla; el navegador la envía según sus reglas | Debe configurarse `Secure` y `SameSite`; como el navegador la adjunta automáticamente, se evalúa riesgo CSRF y se aplican defensas según el diseño. |

OWASP recomienda no guardar identificadores de sesión en almacenamiento accesible por JavaScript cuando se puede evitar. La práctica académica pide `sessionStorage`; NOIR guarda únicamente el access token ahí, lo mantiene por pestaña, lo valida con `/api/auth/me` al iniciar y lo elimina ante logout o 401. Una política de contenido, escape de contenido y dependencias cuidadas ayudan contra XSS, pero no hacen que sessionStorage sea inmune. Como no se usa cookie de autenticación, el navegador no adjunta el Bearer automáticamente, lo que reduce el patrón típico de CSRF; XSS sigue siendo un riesgo importante.

## React, Express y configuración

El servicio centralizado de React añade `Authorization: Bearer <token>` a las llamadas protegidas. La ruta `/api/auth/me` devuelve solo los datos públicos del usuario. El middleware de Express comprueba el formato, algoritmo, firma, emisor, audiencia y expiración antes de permitir acceso a productos, categorías, proveedores e imágenes.

`JWT_SECRET` se configura solo en el `.env` local, ignorado por Git. Debe ser aleatorio y fuerte (este proyecto exige al menos 32 bytes), distinto por ambiente y nunca escrito en el repositorio, frontend, logs ni respuestas HTTP. No debe haber un valor predeterminado de desarrollo que permita iniciar accidentalmente con una clave conocida. En producción se debe usar un gestor de secretos.

El payload de NOIR contiene únicamente el identificador interno como `sub`; no incluye contraseña, hash, correo, datos de pago ni información sensible. HTTPS es necesario fuera de localhost porque cifra el tráfico y dificulta que un tercero intercepte y reutilice el token en tránsito. HTTPS no sustituye a la validación del JWT ni protege contra XSS en el dispositivo.

## Decisión de este proyecto

Se utiliza `jsonwebtoken` con HS256 y una clave aleatoria privada en el servidor, expiración de una hora, `iss` y `aud` fijos, y `sub` con el id del usuario. Contraseñas se guardan como hash bcrypt mediante `bcryptjs`; se exige mínimo 8 caracteres y se limita a 72 bytes para evitar que bcrypt trate como iguales contraseñas que difieren después de su límite de entrada. El hash nunca se devuelve. React guarda el token en `sessionStorage` solo porque así lo exige esta práctica y valida la sesión al cargar. No se implementan refresh tokens ni roles, ya que no son necesarios para la rúbrica. En un sistema real con mayor exposición convendría evaluar cookies `httpOnly; Secure; SameSite` y un diseño completo de CSRF.

## Referencias consultadas

- IETF, [RFC 7519 — JSON Web Token (JWT)](https://www.rfc-editor.org/rfc/rfc7519/).
- OWASP, [JSON Web Token for Java Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html) y [Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
- Auth0, [node-jsonwebtoken README](https://github.com/auth0/node-jsonwebtoken/blob/master/README.md).
- MDN, [Window.sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage).
- OWASP, [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) y [Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

Consulta de documentación web realizada el 5 de noviembre de 2026. Las recomendaciones dependen del diseño y deben revisarse al cambiar versiones o arquitectura.
