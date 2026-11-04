import { useState } from 'react';
import CatalogPage from './pages/CatalogPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';

export default function App() {
  const [section, setSection] = useState('catalogo');
  return <div className="site-shell">
    <header className="topbar"><a className="brand" href="#inicio" aria-label="NOIR, inicio"><span className="brand-mark">N</span><span className="brand-name">NOIR<span>®</span></span></a><nav className="main-nav" aria-label="Navegación principal"><button className={section === 'catalogo' ? 'active' : ''} onClick={() => { setSection('catalogo'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Catálogo</button><button className={section === 'admin' ? 'active' : ''} onClick={() => { setSection('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Administración</button></nav><div className="header-right"><span>ATELIER DE MODA ALTERNATIVA</span><span className="header-age">18+</span></div></header>
    <div className="content-wrap">{section === 'catalogo' ? <CatalogPage /> : <InventoryPage />}</div>
    <footer className="site-footer"><a className="brand-name" href="#inicio">NOIR<span>®</span></a><span>PROYECTO ACADÉMICO · CATÁLOGO DE MUESTRA</span><span>SOLO ADULTOS · 18+</span></footer>
  </div>;
}
