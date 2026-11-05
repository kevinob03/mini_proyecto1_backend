import { useState } from 'react';
import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import CatalogPage from './pages/CatalogPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import { useAuth } from './context/AuthContext.jsx';

function NoirLayout() {
  const [section, setSection] = useState('catalogo');
  const { usuario, logout } = useAuth();
  return <div className="site-shell">
    <header className="topbar"><Link className="brand" to="/" aria-label="NOIR, inicio"><span className="brand-mark">N</span><span className="brand-name">NOIR<span>®</span></span></Link><nav className="main-nav" aria-label="Navegación principal"><button className={section === 'catalogo' ? 'active' : ''} onClick={() => { setSection('catalogo'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Catálogo</button><button className={section === 'admin' ? 'active' : ''} onClick={() => { setSection('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Administración</button></nav><div className="header-right"><span className="header-user">{usuario?.nombre}</span><button className="logout-button" onClick={logout}>Cerrar sesión</button><span className="header-age">18+</span></div></header>
    <div className="content-wrap">{section === 'catalogo' ? <CatalogPage /> : <InventoryPage />}</div>
    <footer className="site-footer"><Link className="brand-name" to="/">NOIR<span>®</span></Link><span>PROYECTO ACADÉMICO · CATÁLOGO DE MUESTRA</span><span>SOLO ADULTOS · 18+</span></footer>
  </div>;
}

function PublicRoute({ children }) {
  const { ready, usuario } = useAuth();
  if (!ready) return <main className="auth-loading" role="status">Verificando sesión…</main>;
  return usuario ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/registro" element={<PublicRoute><Registro /></PublicRoute>} />
    <Route element={<RutaProtegida />}><Route path="/*" element={<NoirLayout />} /></Route>
  </Routes>;
}
