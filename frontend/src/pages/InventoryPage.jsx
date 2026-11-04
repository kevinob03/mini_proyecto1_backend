import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import EntityForm from '../components/EntityForm.jsx';
import EntityTable from '../components/EntityTable.jsx';

const configs = [
  { key: 'productos', label: 'Productos', singular: 'producto', description: 'Mantén al día el catálogo y las existencias de muestra.' },
  { key: 'categorias', label: 'Categorías', singular: 'categoría', description: 'Organiza las piezas por familia y estilo.' },
  { key: 'proveedores', label: 'Proveedores', singular: 'proveedor', description: 'Administra los contactos ficticios del proyecto.' },
];

export default function InventoryPage() {
  const [active, setActive] = useState('productos');
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const config = configs.find((item) => item.key === active);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.list(active);
      setRows(data);
      if (active === 'productos') {
        const [categoryData, supplierData] = await Promise.all([api.list('categorias'), api.list('proveedores')]);
        setCategories(categoryData); setSuppliers(supplierData);
      }
    } catch (error) { setRows([]); setNotice({ type: 'error', text: error.message }); }
    finally { setLoading(false); }
  }, [active]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (notice) { const timer = setTimeout(() => setNotice(null), 5000); return () => clearTimeout(timer); } }, [notice]);

  async function save(data) {
    try {
      if (editing) await api.update(active, editing.id, data);
      else await api.create(active, data);
      setNotice({ type: 'success', text: `${config.singular[0].toUpperCase()}${config.singular.slice(1)} ${editing ? 'actualizado' : 'agregado'} correctamente.` });
      setShowForm(false); setEditing(null); await load();
    } catch (error) { setNotice({ type: 'error', text: error.message }); }
  }

  async function remove(row) {
    if (!window.confirm(`¿Eliminar ${config.singular} «${row.nombre}»?`)) return;
    try { await api.remove(active, row.id); setNotice({ type: 'success', text: 'Registro eliminado.' }); await load(); }
    catch (error) { setNotice({ type: 'error', text: error.message }); }
  }

  function changeTab(key) { setActive(key); setShowForm(false); setEditing(null); }

  return <main className="admin-view">
    <div className="admin-title"><div><span className="eyebrow">PANEL DE INVENTARIO · MODO DE DEMOSTRACIÓN</span><h1>Administración</h1><p>Gestiona los registros que alimentan el catálogo de NOIR.</p></div><span className="adult-label">SOLO ADULTOS · 18+</span></div>
    <section className="workspace">
      <nav className="tabs" aria-label="Administrar inventario">{configs.map((item) => <button key={item.key} className={`tab ${active === item.key ? 'active' : ''}`} onClick={() => changeTab(item.key)}>{item.label}<span>{item.key === active ? rows.length : ''}</span></button>)}</nav>
      <div className="content-heading"><div><span className="eyebrow">GESTIÓN DE {config.label.toUpperCase()}</span><h2>{config.label}</h2><p>{config.description}</p></div><button className="button button-primary" onClick={() => { setEditing(null); setShowForm(true); }}>＋ <span>Agregar {config.singular}</span></button></div>
      {notice && <div role="status" className={`notice ${notice.type}`}>{notice.text}<button onClick={() => setNotice(null)} aria-label="Cerrar mensaje">×</button></div>}
      {showForm && <EntityForm config={config} initial={editing} categories={categories} suppliers={suppliers} onSubmit={save} onCancel={() => { setShowForm(false); setEditing(null); }} />}
      {loading ? <div className="empty-state"><span className="spinner" />Cargando {config.label.toLowerCase()}…</div>
        : rows.length ? <EntityTable config={config} rows={rows} onEdit={(row) => { setEditing(row); setShowForm(true); window.scrollTo({ top: 300, behavior: 'smooth' }); }} onDelete={remove} />
          : <div className="empty-state"><span className="empty-icon">＋</span><strong>Aún no hay {config.label.toLowerCase()}</strong><span>Agrega un registro o carga los datos ficticios de muestra.</span></div>}
      <footer className="workspace-footer"><span>{rows.length} {rows.length === 1 ? 'registro' : 'registros'}</span><span>Demostración académica · Sin ventas ni compras</span></footer>
    </section>
  </main>;
}
