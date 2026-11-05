import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Registro() {
  const { register, usuario, ready } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', correo: '', password: '', confirmacion: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (ready && usuario) return <Navigate to="/" replace />;
  function update(event) { setForm((old) => ({ ...old, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault(); setError('');
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (form.password !== form.confirmacion) return setError('Las contraseñas no coinciden.');
    setBusy(true);
    try { await register({ nombre: form.nombre, correo: form.correo, password: form.password }); navigate('/login', { replace: true, state: { registered: true } }); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><a className="brand-name auth-brand" href="/">NOIR<span>®</span></a><section className="auth-card"><span className="eyebrow">NUEVA CUENTA</span><h1>Entra en la noche.</h1><p>Regístrate para acceder al inventario académico de NOIR.</p><form onSubmit={submit}>
    <label>Nombre<input name="nombre" autoComplete="name" required maxLength={100} value={form.nombre} onChange={update} /></label>
    <label>Correo<input name="correo" type="email" autoComplete="email" required maxLength={150} value={form.correo} onChange={update} /></label>
    <label>Contraseña<input name="password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={update} /><small>Mínimo 8 caracteres.</small></label>
    <label>Confirmar contraseña<input name="confirmacion" type="password" autoComplete="new-password" required minLength={8} value={form.confirmacion} onChange={update} /></label>
    {error && <div className="auth-error" role="alert">{error}</div>}
    <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Creando cuenta…' : 'Registrarme'} <span>→</span></button>
  </form><div className="auth-switch">¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link></div><small>No almacenamos contraseñas en el navegador.</small></section></main>;
}
