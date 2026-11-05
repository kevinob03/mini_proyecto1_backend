import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RutaProtegida() {
  const { usuario, ready } = useAuth();
  if (!ready) return <main className="auth-loading" role="status">Verificando sesión…</main>;
  return usuario ? <Outlet /> : <Navigate to="/login" replace />;
}
