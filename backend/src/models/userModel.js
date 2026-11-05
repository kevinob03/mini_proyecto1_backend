import pool from '../config/database.js';
import { timingSafeEqual } from 'node:crypto';

const PUBLIC_COLUMNS = 'id, nombre, correo, fechaCreacion';

function hashesMatch(saved, candidate) {
  const savedBuffer = Buffer.from(saved || '', 'hex');
  const candidateBuffer = Buffer.from(candidate || '', 'hex');
  return savedBuffer.length === candidateBuffer.length && savedBuffer.length > 0 && timingSafeEqual(savedBuffer, candidateBuffer);
}

export async function findUserByEmail(correo) {
  const [rows] = await pool.execute(
    `SELECT id, nombre, correo, password FROM usuarios WHERE correo = ? LIMIT 1`,
    [correo],
  );
  return rows[0] || null;
}

export async function findPublicUserById(id) {
  const [rows] = await pool.execute(`SELECT ${PUBLIC_COLUMNS} FROM usuarios WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

export async function createUser({ nombre, correo, password }) {
  const [result] = await pool.execute(
    'INSERT INTO usuarios (nombre, correo, password) VALUES (?, ?, ?)',
    [nombre, correo, password],
  );
  return findPublicUserById(result.insertId);
}

export async function getLoginLockStatus(id, cooldownSeconds = 60) {
  const [rows] = await pool.execute(
    `SELECT (bloqueado_hasta > NOW()) AS bloqueado,
     GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), DATE_ADD(codigo_enviado_en, INTERVAL ? SECOND))) AS espera_reenvio
     FROM seguridad_login WHERE usuario_id = ?`,
    [cooldownSeconds, id],
  );
  return { locked: Boolean(rows[0]?.bloqueado), retryAfter: Number(rows[0]?.espera_reenvio || 0) };
}

export async function recordLoginFailure(id, { codigoHash, maxAttempts = 5 }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('INSERT IGNORE INTO seguridad_login (usuario_id) VALUES (?)', [id]);
    const [rows] = await connection.execute(
      `SELECT intentos_fallidos, (bloqueado_hasta > NOW()) AS bloqueado,
       (bloqueado_hasta IS NOT NULL AND bloqueado_hasta <= NOW()) AS bloqueo_vencido
       FROM seguridad_login WHERE usuario_id = ? FOR UPDATE`,
      [id],
    );
    const state = rows[0];
    if (state.bloqueado) {
      await connection.commit();
      return { locked: true, sendCode: false };
    }
    const attempts = state.bloqueo_vencido ? 1 : Number(state.intentos_fallidos) + 1;
    if (state.bloqueo_vencido) {
      await connection.execute(
        `UPDATE seguridad_login SET intentos_fallidos = 0, bloqueado_hasta = NULL,
         codigo_hash = NULL, codigo_expira = NULL, intentos_codigo = 0,
         codigo_enviado_en = NULL, reenvios_codigo = 0,
         password_reset_hash = NULL, password_reset_expira = NULL WHERE usuario_id = ?`,
        [id],
      );
    }
    if (attempts >= maxAttempts) {
      await connection.execute(
        `UPDATE seguridad_login
         SET intentos_fallidos = ?, bloqueado_hasta = DATE_ADD(NOW(), INTERVAL 15 MINUTE),
             codigo_hash = ?, codigo_expira = DATE_ADD(NOW(), INTERVAL 10 MINUTE), intentos_codigo = 0,
             codigo_enviado_en = NOW(), reenvios_codigo = 0,
             password_reset_hash = NULL, password_reset_expira = NULL
         WHERE usuario_id = ?`,
        [maxAttempts, codigoHash, id],
      );
      await connection.commit();
      return { locked: true, sendCode: true };
    }
    await connection.execute(
      'UPDATE seguridad_login SET intentos_fallidos = ? WHERE usuario_id = ?',
      [attempts, id],
    );
    await connection.commit();
    return { locked: false, sendCode: false, attemptsRemaining: maxAttempts - attempts };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

export async function resetLoginSecurity(id) {
  await pool.execute(
    `UPDATE seguridad_login SET intentos_fallidos = 0, bloqueado_hasta = NULL,
     codigo_hash = NULL, codigo_expira = NULL, intentos_codigo = 0,
     codigo_enviado_en = NULL, reenvios_codigo = 0,
     password_reset_hash = NULL, password_reset_expira = NULL WHERE usuario_id = ?`,
    [id],
  );
}

export async function verifyUnlockCode(id, suppliedHash, maxAttempts = 5, resetGrantHash) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT codigo_hash, (codigo_expira > NOW()) AS codigo_vigente,
              (bloqueado_hasta > NOW()) AS bloqueado, intentos_codigo
       FROM seguridad_login WHERE usuario_id = ? FOR UPDATE`,
      [id],
    );
    const state = rows[0];
    if (!state || !state.codigo_hash || !state.codigo_vigente || !state.bloqueado || state.intentos_codigo >= maxAttempts) {
      await connection.commit();
      return { ok: false, reason: 'invalid' };
    }
    const savedHash = Buffer.from(state.codigo_hash, 'hex');
    const candidateHash = Buffer.from(suppliedHash, 'hex');
    const matches = savedHash.length === candidateHash.length && timingSafeEqual(savedHash, candidateHash);
    if (!matches) {
      const attempts = Number(state.intentos_codigo) + 1;
      await connection.execute(
        `UPDATE seguridad_login SET intentos_codigo = ?,
         codigo_hash = IF(? >= ?, NULL, codigo_hash),
         codigo_expira = IF(? >= ?, NULL, codigo_expira)
         WHERE usuario_id = ?`,
        [attempts, attempts, maxAttempts, attempts, maxAttempts, id],
      );
      await connection.commit();
      return { ok: false, reason: attempts >= maxAttempts ? 'limit' : 'invalid' };
    }
    await connection.execute(
      `UPDATE seguridad_login SET intentos_fallidos = 0, bloqueado_hasta = NULL,
       codigo_hash = NULL, codigo_expira = NULL, intentos_codigo = 0,
       codigo_enviado_en = NULL, reenvios_codigo = 0, password_reset_hash = ?,
       password_reset_expira = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE usuario_id = ?`,
      [resetGrantHash, id],
    );
    await connection.commit();
    return { ok: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

export async function resetPasswordWithGrant(id, grantHash, passwordHash) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT password_reset_hash, (password_reset_expira > NOW()) AS grant_vigente
       FROM seguridad_login WHERE usuario_id = ? FOR UPDATE`,
      [id],
    );
    const state = rows[0];
    if (!state?.grant_vigente || !hashesMatch(state.password_reset_hash, grantHash)) {
      await connection.commit();
      return false;
    }
    await connection.execute('UPDATE usuarios SET password = ? WHERE id = ?', [passwordHash, id]);
    await connection.execute(
      `UPDATE seguridad_login SET password_reset_hash = NULL, password_reset_expira = NULL,
       intentos_fallidos = 0, bloqueado_hasta = NULL WHERE usuario_id = ?`,
      [id],
    );
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

export async function cancelPasswordResetGrant(id, grantHash) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT password_reset_hash, (password_reset_expira > NOW()) AS grant_vigente
       FROM seguridad_login WHERE usuario_id = ? FOR UPDATE`,
      [id],
    );
    const state = rows[0];
    if (!state?.grant_vigente || !hashesMatch(state.password_reset_hash, grantHash)) {
      await connection.commit();
      return false;
    }
    await connection.execute(
      'UPDATE seguridad_login SET password_reset_hash = NULL, password_reset_expira = NULL WHERE usuario_id = ?',
      [id],
    );
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

export async function resendUnlockCode(id, codigoHash, { cooldownSeconds = 60, maxResends = 3 } = {}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT (bloqueado_hasta > NOW()) AS bloqueado, reenvios_codigo,
       GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), bloqueado_hasta)) AS segundos_bloqueo,
       GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), DATE_ADD(codigo_enviado_en, INTERVAL ? SECOND))) AS espera_reenvio
       FROM seguridad_login WHERE usuario_id = ? FOR UPDATE`,
      [cooldownSeconds, id],
    );
    const state = rows[0];
    if (!state?.bloqueado) {
      await connection.commit();
      return { ok: false, reason: 'not-locked' };
    }
    if (Number(state.reenvios_codigo) >= maxResends) {
      await connection.commit();
      return { ok: false, reason: 'limit', retryAfter: Number(state.segundos_bloqueo) };
    }
    if (Number(state.espera_reenvio) > 0) {
      await connection.commit();
      return { ok: false, reason: 'cooldown', retryAfter: Number(state.espera_reenvio) };
    }
    await connection.execute(
      `UPDATE seguridad_login SET codigo_hash = ?, codigo_expira = DATE_ADD(NOW(), INTERVAL 10 MINUTE),
       codigo_enviado_en = NOW(), reenvios_codigo = reenvios_codigo + 1, intentos_codigo = 0
       WHERE usuario_id = ?`,
      [codigoHash, id],
    );
    await connection.commit();
    return { ok: true, resendsRemaining: maxResends - Number(state.reenvios_codigo) - 1 };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}
