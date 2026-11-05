import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHmac, randomBytes, randomInt } from 'node:crypto';
import { cancelPasswordResetGrant, createUser, findPublicUserById, findUserByEmail, getLoginLockStatus, recordLoginFailure, resendUnlockCode, resetLoginSecurity, resetPasswordWithGrant, verifyUnlockCode } from '../models/userModel.js';
import { sendUnlockCode } from '../services/emailService.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const publicUser = ({ id, nombre, correo, fechaCreacion }) => ({ id, nombre, correo, fechaCreacion });
const MAX_LOGIN_ATTEMPTS = 5;
const MAX_CODE_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_CODE_RESENDS = 3;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('not-a-real-noir-password', 12);
const unlockDelivery = () => process.env.MAIL_MODE?.toLowerCase() === 'console' && process.env.NODE_ENV !== 'production' ? 'console' : 'email';

function hashUnlockCode(userId, code) {
  return createHmac('sha256', process.env.JWT_SECRET).update(`${userId}:${code}`).digest('hex');
}

function hashPasswordResetGrant(userId, token) {
  return createHmac('sha256', process.env.JWT_SECRET).update(`password-reset:${userId}:${token}`).digest('hex');
}

export async function register(req, res, next) {
  const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';
  const correo = typeof req.body?.correo === 'string' ? req.body.correo.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const errors = [];
  if (!nombre || nombre.length > 100) errors.push('El nombre es obligatorio y debe tener hasta 100 caracteres.');
  if (!correo || correo.length > 150 || !emailPattern.test(correo)) errors.push('Ingresa un correo válido de hasta 150 caracteres.');
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') < 8) errors.push('La contraseña debe tener al menos 8 caracteres.');
  if (Buffer.byteLength(password, 'utf8') > 72) errors.push('La contraseña no puede superar 72 bytes.');
  if (errors.length) return res.status(400).json({ error: 'Datos inválidos.', details: errors });

  try {
    if (await findUserByEmail(correo)) return res.status(400).json({ error: 'Ese correo ya está registrado.' });
    const hash = await bcrypt.hash(password, 12);
    const user = await createUser({ nombre, correo, password: hash });
    return res.status(201).json({ usuario: publicUser(user) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Ese correo ya está registrado.' });
    return next(error);
  }
}

export async function login(req, res, next) {
  const correo = typeof req.body?.correo === 'string' ? req.body.correo.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!emailPattern.test(correo) || !password) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  try {
    const row = await findUserByEmail(correo);
    if (!row) {
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }
    const lockStatus = await getLoginLockStatus(row.id, RESEND_COOLDOWN_SECONDS);
    if (lockStatus.locked) {
      return res.status(423).json({
        code: 'ACCOUNT_LOCKED',
        delivery: unlockDelivery(),
        retryAfter: lockStatus.retryAfter,
        error: 'La cuenta está bloqueada. Si el correo está registrado, revisa tu bandeja; también se desbloqueará automáticamente en 15 minutos.',
      });
    }
    const valid = await bcrypt.compare(password, row.password);
    if (!valid) {
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      const result = await recordLoginFailure(row.id, { codigoHash: hashUnlockCode(row.id, code), maxAttempts: MAX_LOGIN_ATTEMPTS });
      let delivery = unlockDelivery();
      if (result.locked) {
        if (result.sendCode) {
          try { delivery = await sendUnlockCode({ to: row.correo, nombre: row.nombre, code }); }
          catch { delivery = 'unavailable'; console.error('[NOIR] No se pudo entregar el correo de desbloqueo; revisa la configuración SMTP.'); }
        }
        return res.status(423).json({
          code: 'ACCOUNT_LOCKED',
          delivery,
          retryAfter: RESEND_COOLDOWN_SECONDS,
          error: 'La cuenta está bloqueada. Si el correo está registrado, revisa tu bandeja; también se desbloqueará automáticamente en 15 minutos.',
        });
      }
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.', intentosRestantes: result.attemptsRemaining });
    }
    await resetLoginSecurity(row.id);
    const token = jwt.sign({ sub: String(row.id) }, process.env.JWT_SECRET, {
      algorithm: 'HS256', expiresIn: '1h', issuer: 'noir-api', audience: 'noir-web',
    });
    return res.json({ token, usuario: publicUser(row) });
  } catch (error) { return next(error); }
}

export async function resendUnlock(req, res, next) {
  const correo = typeof req.body?.correo === 'string' ? req.body.correo.trim().toLowerCase() : '';
  if (!emailPattern.test(correo)) return res.status(400).json({ error: 'No hay un bloqueo activo para ese correo.' });
  try {
    const user = await findUserByEmail(correo);
    if (!user) return res.status(400).json({ error: 'No hay un bloqueo activo para ese correo.' });
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const result = await resendUnlockCode(user.id, hashUnlockCode(user.id, code), {
      cooldownSeconds: RESEND_COOLDOWN_SECONDS,
      maxResends: MAX_CODE_RESENDS,
    });
    if (!result.ok) {
      if (result.reason === 'not-locked') return res.status(400).json({ error: 'No hay un bloqueo activo para ese correo.' });
      return res.status(429).json({
        error: result.reason === 'limit' ? 'Alcanzaste el máximo de reenvíos para este bloqueo.' : 'Espera antes de pedir otro código.',
        retryAfter: result.retryAfter,
      });
    }
    try {
      const delivery = await sendUnlockCode({ to: user.correo, nombre: user.nombre, code });
      return res.json({ message: 'Se envió un nuevo código.', delivery, cooldown: RESEND_COOLDOWN_SECONDS, resendsRemaining: result.resendsRemaining });
    } catch {
      console.error('[NOIR] No se pudo reenviar el código; revisa la configuración SMTP.');
      return res.status(503).json({ error: 'No se pudo enviar el correo. Intenta de nuevo en un minuto o espera el desbloqueo automático.', retryAfter: RESEND_COOLDOWN_SECONDS });
    }
  } catch (error) { return next(error); }
}

export async function resetPassword(req, res, next) {
  const correo = typeof req.body?.correo === 'string' ? req.body.correo.trim().toLowerCase() : '';
  const token = typeof req.body?.passwordResetToken === 'string' ? req.body.passwordResetToken : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!emailPattern.test(correo) || !/^[a-f0-9]{64}$/i.test(token)) {
    return res.status(400).json({ error: 'La autorización para cambiar la contraseña no es válida o venció.' });
  }
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.' });
  }
  try {
    const user = await findUserByEmail(correo);
    if (!user) return res.status(400).json({ error: 'La autorización para cambiar la contraseña no es válida o venció.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const updated = await resetPasswordWithGrant(user.id, hashPasswordResetGrant(user.id, token), passwordHash);
    if (!updated) return res.status(400).json({ error: 'La autorización para cambiar la contraseña no es válida o venció.' });
    return res.json({ message: 'Contraseña actualizada. Inicia sesión con la nueva contraseña.' });
  } catch (error) { return next(error); }
}

export async function skipPasswordReset(req, res, next) {
  const correo = typeof req.body?.correo === 'string' ? req.body.correo.trim().toLowerCase() : '';
  const token = typeof req.body?.passwordResetToken === 'string' ? req.body.passwordResetToken : '';
  if (!emailPattern.test(correo) || !/^[a-f0-9]{64}$/i.test(token)) {
    return res.status(400).json({ error: 'La autorización para continuar no es válida o venció.' });
  }
  try {
    const user = await findUserByEmail(correo);
    if (!user) return res.status(400).json({ error: 'La autorización para continuar no es válida o venció.' });
    const canceled = await cancelPasswordResetGrant(user.id, hashPasswordResetGrant(user.id, token));
    if (!canceled) return res.status(400).json({ error: 'La autorización para continuar no es válida o venció.' });
    return res.json({ message: 'Cuenta desbloqueada. Inicia sesión con tu contraseña actual.' });
  } catch (error) { return next(error); }
}

export async function verifyUnlock(req, res, next) {
  const correo = typeof req.body?.correo === 'string' ? req.body.correo.trim().toLowerCase() : '';
  const code = typeof req.body?.codigo === 'string' ? req.body.codigo.trim() : '';
  if (!emailPattern.test(correo) || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'Correo o código incorrectos, vencidos o sin bloqueo activo.' });
  }
  try {
    const user = await findUserByEmail(correo);
    if (!user) return res.status(400).json({ error: 'Correo o código incorrectos, vencidos o sin bloqueo activo.' });
    const passwordResetToken = randomBytes(32).toString('hex');
    const result = await verifyUnlockCode(user.id, hashUnlockCode(user.id, code), MAX_CODE_ATTEMPTS, hashPasswordResetGrant(user.id, passwordResetToken));
    if (!result.ok) return res.status(400).json({ error: 'Correo o código incorrectos, vencidos o sin bloqueo activo.' });
    return res.json({ message: 'Correo verificado y cuenta desbloqueada.', passwordResetToken });
  } catch (error) { return next(error); }
}

export async function me(req, res, next) {
  try {
    const user = await findPublicUserById(req.user.id);
    return user ? res.json({ usuario: user }) : res.status(401).json({ error: 'La sesión ya no corresponde a un usuario activo.' });
  } catch (error) { return next(error); }
}
