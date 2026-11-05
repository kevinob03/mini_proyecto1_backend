import nodemailer from 'nodemailer';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

export async function sendUnlockCode({ to, nombre, code }) {
  const mode = (process.env.MAIL_MODE || 'smtp').toLowerCase();
  if (mode === 'console') {
    if (process.env.NODE_ENV === 'production') throw new Error('MAIL_MODE=console está prohibido en producción.');
    console.info(`[NOIR DEV ONLY] Código de desbloqueo para ${to}: ${code}`);
    return 'console';
  }
  if (mode !== 'smtp') throw new Error('MAIL_MODE debe ser smtp o console.');

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM;
  if (!host || !user || !pass || !from || !Number.isInteger(port)) {
    throw new Error('Falta configurar SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y MAIL_FROM.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: { user, pass },
  });
  const safeName = escapeHtml(nombre);
  await transporter.sendMail({
    from,
    to,
    subject: 'Código para desbloquear tu cuenta NOIR',
    text: `Hola ${nombre}, tu código de desbloqueo NOIR es ${code}. Vence en 10 minutos. Si no solicitaste esto, ignora el mensaje.`,
    html: `<main style="font-family:Arial,sans-serif;background:#0b0b0d;color:#f5f1ed;padding:32px"><p style="letter-spacing:4px;color:#c995a8">NOIR</p><h1 style="font-weight:400">Verifica tu correo</h1><p>Hola ${safeName}, usa este código para desbloquear tu cuenta:</p><p style="font-size:30px;letter-spacing:8px;color:#e7a9bf">${code}</p><p>El código vence en 10 minutos. Desbloquear la cuenta no inicia sesión; después debes ingresar tu contraseña.</p><p>Si no solicitaste el código, ignora este correo. Tu cuenta volverá a estar disponible automáticamente después del bloqueo temporal.</p></main>`,
  });
  return 'email';
}
