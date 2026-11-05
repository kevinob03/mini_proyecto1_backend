import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { authApi } from '../services/api.js';

export default function Login() {
  const { login, usuario, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [passwordResetToken, setPasswordResetToken] = useState('');
  const [recoveryStep, setRecoveryStep] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.registered ? 'Cuenta creada. Ahora puedes iniciar sesión.' : '');
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = window.setTimeout(() => setResendCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  if (ready && usuario) return <Navigate to="/" replace />;

  async function submitLogin(event) {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try { await login({ correo, password }); navigate('/', { replace: true }); }
    catch (err) {
      if (err.status === 423) {
        setError(''); setLocked(true);
        setResendCooldown(Math.max(0, Number(err.retryAfter) || 0));
        setNotice(err.delivery === 'console'
          ? 'Modo local: el código de prueba aparece en la terminal del backend.'
          : err.delivery === 'unavailable'
            ? 'No se pudo enviar el correo. Puedes esperar el desbloqueo automático en 15 minutos.'
            : 'Si el correo está registrado, revisa tu bandeja y la carpeta de spam.');
      } else if (err.status === 401 && Number.isInteger(err.intentosRestantes)) {
        setError(`${err.message} Te quedan ${err.intentosRestantes} ${err.intentosRestantes === 1 ? 'intento' : 'intentos'} antes del bloqueo.`);
      } else setError(err.message);
    } finally { setBusy(false); }
  }

  async function submitUnlock(event) {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try {
      const result = await authApi.verifyUnlock({ correo, codigo });
      setLocked(false); setCodigo(''); setPassword(''); setResendCooldown(0);
      setPasswordResetToken(result.passwordResetToken);
      setRecoveryStep('choice');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function resendCode() {
    setError(''); setNotice(''); setBusy(true);
    try {
      const result = await authApi.resendUnlock({ correo });
      setResendCooldown(result.cooldown);
      setNotice(result.delivery === 'console'
        ? 'Modo local: el nuevo código aparece en la terminal del backend.'
        : 'Enviamos otro código. Revisa tu bandeja y la carpeta de spam.');
    } catch (err) {
      setError(err.message);
      if (Number.isInteger(err.retryAfter)) setResendCooldown(Math.max(0, err.retryAfter));
    } finally { setBusy(false); }
  }

  async function skipPasswordChange() {
    setError(''); setNotice(''); setBusy(true);
    try {
      const result = await authApi.skipPasswordReset({ correo, passwordResetToken });
      setPasswordResetToken(''); setRecoveryStep(''); setNotice(result.message);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function submitPasswordChange(event) {
    event.preventDefault(); setError(''); setNotice('');
    if (passwordNueva.length < 8) return setError('La nueva contraseña debe tener al menos 8 caracteres.');
    if (passwordNueva !== confirmacion) return setError('Las contraseñas no coinciden.');
    setBusy(true);
    try {
      const result = await authApi.resetPassword({ correo, passwordResetToken, password: passwordNueva });
      setPasswordResetToken(''); setPasswordNueva(''); setConfirmacion(''); setRecoveryStep(''); setNotice(result.message);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  const recoveryChoice = recoveryStep === 'choice';
  const changingPassword = recoveryStep === 'change';
  const eyebrow = locked ? 'VERIFICACIÓN DE CORREO' : recoveryChoice ? 'CUENTA DESBLOQUEADA' : changingPassword ? 'CAMBIO DE CONTRASEÑA' : 'ACCESO AL ATELIER';
  const title = locked ? 'Confirma que eres tú.' : recoveryChoice ? '¿Quieres cambiar tu contraseña?' : changingPassword ? 'Elige una nueva contraseña.' : 'Bienvenida de vuelta.';
  const description = locked
    ? 'Alcanzaste el límite de intentos. Ingresa el código de 6 dígitos asociado al correo. Vence en 10 minutos; puedes reenviarlo cada minuto hasta tres veces.'
    : recoveryChoice
      ? 'Tu correo quedó verificado y la cuenta está desbloqueada. Puedes cambiar ahora la contraseña o continuar con la actual.'
      : changingPassword
        ? 'La nueva contraseña debe tener al menos 8 caracteres. Después podrás iniciar sesión con ella.'
        : 'Inicia sesión para consultar el catálogo y el inventario.';

  return <main className="auth-page"><a className="brand-name auth-brand" href="/">NOIR<span>®</span></a><section className="auth-card">
    <span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p>
    {locked && <form onSubmit={submitUnlock}>
      <label>Correo<input type="email" autoComplete="email" required maxLength={150} value={correo} onChange={(e) => setCorreo(e.target.value)} /></label>
      <label>Código de verificación<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))} /></label>
      {error && <div className="auth-error" role="alert">{error}</div>}
      {notice && <div className="auth-success" role="status">{notice}</div>}
      <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Verificando…' : 'Verificar código'} <span>→</span></button>
      <button className="auth-back auth-resend" type="button" disabled={busy || resendCooldown > 0} onClick={resendCode}>
        {resendCooldown > 0 ? `Reenviar código en ${String(Math.floor(resendCooldown / 60)).padStart(2, '0')}:${String(resendCooldown % 60).padStart(2, '0')}` : 'Reenviar código'}
      </button>
      <button className="auth-back" type="button" onClick={() => { setLocked(false); setCodigo(''); setError(''); }}>Volver al inicio de sesión</button>
    </form>}

    {recoveryChoice && <div className="recovery-actions">
      {error && <div className="auth-error" role="alert">{error}</div>}
      <button className="button button-primary auth-submit" disabled={busy} onClick={() => { setRecoveryStep('change'); setError(''); }}>Sí, cambiar contraseña <span>→</span></button>
      <button className="button button-secondary auth-submit" disabled={busy} onClick={skipPasswordChange}>{busy ? 'Continuando…' : 'No, continuar con la actual'}</button>
    </div>}

    {changingPassword && <form onSubmit={submitPasswordChange}>
      <label>Nueva contraseña<input type="password" autoComplete="new-password" required minLength={8} value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)} /></label>
      <label>Confirmar contraseña<input type="password" autoComplete="new-password" required minLength={8} value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} /></label>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar contraseña'} <span>→</span></button>
      <button className="auth-back" type="button" onClick={() => { setRecoveryStep('choice'); setError(''); }}>Volver a la pregunta</button>
    </form>}

    {!locked && !recoveryStep && <form onSubmit={submitLogin}>
      <label>Correo<input type="email" autoComplete="email" required maxLength={150} value={correo} onChange={(e) => setCorreo(e.target.value)} /></label>
      <label>Contraseña<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {error && <div className="auth-error" role="alert">{error}</div>}
      {notice && <div className="auth-success" role="status">{notice}</div>}
      <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Ingresando…' : 'Iniciar sesión'} <span>→</span></button>
    </form>}
    <div className="auth-switch">¿Primera visita? <Link to="/registro">Crear una cuenta</Link></div>
    <small>Proyecto académico · Inventario de demostración</small>
  </section></main>;
}
