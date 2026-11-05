import 'dotenv/config';
import { createHmac } from 'node:crypto';
import jwt from 'jsonwebtoken';
import pool from '../src/config/database.js';

const base = process.env.TEST_API_URL || 'http://localhost:3000/api';
const email = `noir.smoke.${Date.now()}@example.test`;
const password = 'NoirSmoke_2026!';
let token = '';
let userId;
let categoryId;
let supplierId;
let productId;
let count = 0;

async function check(name, method, path, expected, { body, auth = true, headers: extraHeaders = {} } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (response.status !== expected) throw new Error(`${name}: esperado ${expected}, recibido ${response.status}`);
  count += 1;
  console.log(`PASS ${name} (${response.status})`);
  return response.status === 204 ? null : response.json();
}

try {
  const registered = await check('registro válido', 'POST', '/auth/register', 201, { auth: false, body: { nombre: 'NOIR QA', correo: email, password } });
  userId = registered.usuario.id;
  if (registered.usuario.password || registered.usuario.hash) throw new Error('registro expuso credencial');
  await check('registro inválido', 'POST', '/auth/register', 400, { auth: false, body: { nombre: '', correo: 'mal', password: '123' } });
  await check('correo duplicado', 'POST', '/auth/register', 400, { auth: false, body: { nombre: 'NOIR QA', correo: email.toUpperCase(), password } });
  const unauthorized = await check('login válido', 'POST', '/auth/login', 200, { auth: false, body: { correo: email.toUpperCase(), password } });
  token = unauthorized.token;
  if (!token || unauthorized.usuario.password) throw new Error('respuesta de login incorrecta');
  const firstFailure = await check('credenciales incorrectas', 'POST', '/auth/login', 401, { auth: false, body: { correo: email, password: 'incorrecta' } });
  if (firstFailure.intentosRestantes !== 4) throw new Error('contador de intentos incorrecto tras primer fallo');
  const unknownEmail = await check('correo sin cuenta no revela el contador', 'POST', '/auth/login', 401, { auth: false, body: { correo: `missing.${Date.now()}@example.test`, password: 'incorrecta' } });
  if (unknownEmail.intentosRestantes !== undefined) throw new Error('se expuso información de intentos para correo desconocido');
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const failure = await check(`intento fallido adicional ${attempt + 1}`, 'POST', '/auth/login', 401, { auth: false, body: { correo: email, password: 'incorrecta' } });
    if (failure.intentosRestantes !== 3 - attempt) throw new Error('contador de intentos incorrecto');
  }
  const locked = await check('bloqueo al quinto intento', 'POST', '/auth/login', 423, { auth: false, body: { correo: email, password: 'incorrecta' } });
  if (locked.code !== 'ACCOUNT_LOCKED') throw new Error('respuesta de bloqueo incorrecta');
  await check('login mientras sigue bloqueada', 'POST', '/auth/login', 423, { auth: false, body: { correo: email, password } });
  const cooldown = await check('reenvío respeta espera inicial', 'POST', '/auth/resend-unlock', 429, { auth: false, body: { correo: email } });
  if (cooldown.retryAfter < 1) throw new Error('el enfriamiento de reenvío no se informó');
  await pool.execute('UPDATE seguridad_login SET codigo_enviado_en = DATE_SUB(NOW(), INTERVAL 61 SECOND) WHERE usuario_id = ?', [userId]);
  const resent = await check('reenviar código permitido', 'POST', '/auth/resend-unlock', 200, { auth: false, body: { correo: email } });
  if (resent.delivery !== 'console' || resent.cooldown !== 60) throw new Error('respuesta de reenvío incorrecta');
  await check('reenvío vuelve a respetar espera', 'POST', '/auth/resend-unlock', 429, { auth: false, body: { correo: email } });
  await pool.execute('UPDATE seguridad_login SET reenvios_codigo = 3, codigo_enviado_en = DATE_SUB(NOW(), INTERVAL 61 SECOND) WHERE usuario_id = ?', [userId]);
  await check('máximo de tres reenvíos', 'POST', '/auth/resend-unlock', 429, { auth: false, body: { correo: email } });
  const [lockRows] = await pool.execute('SELECT codigo_hash FROM seguridad_login WHERE usuario_id = ?', [userId]);
  const wrongCode = lockRows[0].codigo_hash === createHmac('sha256', process.env.JWT_SECRET).update(`${userId}:000000`).digest('hex') ? '000001' : '000000';
  await check('código de desbloqueo incorrecto', 'POST', '/auth/verify-unlock', 400, { auth: false, body: { correo: email, codigo: wrongCode } });
  const fixtureCode = '246810';
  const fixtureHash = createHmac('sha256', process.env.JWT_SECRET).update(`${userId}:${fixtureCode}`).digest('hex');
  await pool.execute(
    'UPDATE seguridad_login SET codigo_hash = ?, codigo_expira = DATE_ADD(NOW(), INTERVAL 10 MINUTE), intentos_codigo = 0 WHERE usuario_id = ?',
    [fixtureHash, userId],
  );
  const verified = await check('verificación de código correcto', 'POST', '/auth/verify-unlock', 200, { auth: false, body: { correo: email, codigo: fixtureCode } });
  if (!/^[a-f0-9]{64}$/.test(verified.passwordResetToken)) throw new Error('no se emitió el permiso temporal de cambio');
  await check('elegir conservar la contraseña', 'POST', '/auth/skip-password-reset', 200, { auth: false, body: { correo: email, passwordResetToken: verified.passwordResetToken } });
  await check('permiso descartado no permite cambiar contraseña', 'POST', '/auth/reset-password', 400, { auth: false, body: { correo: email, passwordResetToken: verified.passwordResetToken, password } });
  const reauthenticated = await check('login después del desbloqueo', 'POST', '/auth/login', 200, { auth: false, body: { correo: email, password } });
  token = reauthenticated.token;
  if (!token) throw new Error('no se emitió token después del desbloqueo');
  const resetCode = '135790';
  const resetCodeHash = createHmac('sha256', process.env.JWT_SECRET).update(`${userId}:${resetCode}`).digest('hex');
  await pool.execute(
    `UPDATE seguridad_login SET intentos_fallidos = 5, bloqueado_hasta = DATE_ADD(NOW(), INTERVAL 15 MINUTE),
     codigo_hash = ?, codigo_expira = DATE_ADD(NOW(), INTERVAL 10 MINUTE), intentos_codigo = 0,
     codigo_enviado_en = NOW(), reenvios_codigo = 0 WHERE usuario_id = ?`,
    [resetCodeHash, userId],
  );
  const verifiedForReset = await check('verificar antes de cambiar contraseña', 'POST', '/auth/verify-unlock', 200, { auth: false, body: { correo: email, codigo: resetCode } });
  await check('rechazar contraseña nueva corta', 'POST', '/auth/reset-password', 400, { auth: false, body: { correo: email, passwordResetToken: verifiedForReset.passwordResetToken, password: 'corta' } });
  await check('cambiar contraseña desde permiso temporal', 'POST', '/auth/reset-password', 200, { auth: false, body: { correo: email, passwordResetToken: verifiedForReset.passwordResetToken, password: 'NoirSmoke_Reset2026!' } });
  await check('contraseña anterior ya no funciona', 'POST', '/auth/login', 401, { auth: false, body: { correo: email, password } });
  const loginAfterReset = await check('login con contraseña nueva', 'POST', '/auth/login', 200, { auth: false, body: { correo: email, password: 'NoirSmoke_Reset2026!' } });
  token = loginAfterReset.token;
  await check('perfil sin token', 'GET', '/auth/me', 401, { auth: false });
  const me = await check('perfil autenticado', 'GET', '/auth/me', 200);
  if (me.usuario.id !== userId || me.usuario.password) throw new Error('perfil incorrecto o expone hash');
  await check('token inválido', 'GET', '/auth/me', 401, { auth: false, headers: { Authorization: 'Bearer invalid.invalid.invalid' } });
  const expiredToken = jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '-1s', issuer: 'noir-api', audience: 'noir-web' });
  await check('token expirado', 'GET', '/auth/me', 401, { auth: false, headers: { Authorization: `Bearer ${expiredToken}` } });
  await check('categorías protegidas sin token', 'GET', '/categorias', 401, { auth: false });
  await check('rutas de imágenes protegidas sin token', 'GET', '/imagenes/buscar?query=latex', 401, { auth: false });

  const category = await check('crear categoría', 'POST', '/categorias', 201, { body: { nombre: `QA ${Date.now()}`, descripcion: 'Prueba automatizada' } });
  categoryId = category.data.id;
  await check('listar categorías', 'GET', '/categorias', 200);
  await check('consultar categoría', 'GET', `/categorias/${categoryId}`, 200);
  await check('actualizar categoría', 'PUT', `/categorias/${categoryId}`, 200, { body: { descripcion: 'Actualizada en prueba' } });
  await check('categoría inexistente', 'GET', '/categorias/999999999', 404);
  await check('validación categoría', 'POST', '/categorias', 400, { body: { nombre: '' } });

  const supplier = await check('crear proveedor', 'POST', '/proveedores', 201, { body: { nombre: `QA ${Date.now()}`, correo: email } });
  supplierId = supplier.data.id;
  await check('listar proveedores', 'GET', '/proveedores', 200);
  await check('consultar proveedor', 'GET', `/proveedores/${supplierId}`, 200);
  await check('actualizar proveedor', 'PUT', `/proveedores/${supplierId}`, 200, { body: { telefono: '8888-0000' } });

  const product = await check('crear producto', 'POST', '/productos', 201, { body: { nombre: 'NOIR QA item', descripcion: 'Prueba automatizada', precio: 10, stock: 1, categoria_id: categoryId, proveedor_id: supplierId } });
  productId = product.data.id;
  await check('listar productos', 'GET', '/productos', 200);
  await check('consultar producto', 'GET', `/productos/${productId}`, 200);
  await check('actualizar producto', 'PUT', `/productos/${productId}`, 200, { body: { stock: 2 } });
  await check('clave foránea inválida', 'POST', '/productos', 400, { body: { nombre: 'FK QA', precio: 10, stock: 1, categoria_id: 999999999, proveedor_id: supplierId } });
  await check('no borrar categoría relacionada', 'DELETE', `/categorias/${categoryId}`, 409);
  await check('borrar producto QA', 'DELETE', `/productos/${productId}`, 204);
  productId = undefined;
  await check('borrar categoría QA', 'DELETE', `/categorias/${categoryId}`, 204);
  categoryId = undefined;
  await check('borrar proveedor QA', 'DELETE', `/proveedores/${supplierId}`, 204);
  supplierId = undefined;
  console.log(`RESULT ${count} pruebas superadas.`);
} finally {
  // Solo limpia filas creadas en esta ejecución; nunca modifica datos preexistentes.
  for (const [label, sql, params] of [
    ['producto QA', 'DELETE FROM productos WHERE id = ?', [productId]],
    ['categoría QA', 'DELETE FROM categorias WHERE id = ?', [categoryId]],
    ['proveedor QA', 'DELETE FROM proveedores WHERE id = ?', [supplierId]],
    ['usuario QA', 'DELETE FROM usuarios WHERE id = ? AND correo = ?', [userId, email]],
  ]) {
    if (!params[0]) continue;
    try {
      const [result] = await pool.execute(sql, params);
      console.log(`CLEANUP ${label}: ${result.affectedRows === 1 ? 'eliminado' : 'ya ausente'}`);
    } catch (error) {
      console.error(`CLEANUP ${label}: falló (${error.code || 'error'})`);
      process.exitCode = 1;
    }
  }
  await pool.end();
}
