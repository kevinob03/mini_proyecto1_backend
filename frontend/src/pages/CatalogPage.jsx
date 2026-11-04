import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';

const placeholder = '/noir-placeholder.svg';
const coverImage = '/images/noir/cover-reference.jpg';
const money = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 });

function ImageCredit({ item }) {
  if (item.imagen_fuente === 'Ilustración original NOIR') {
    return <div className="photo-credit">Ilustración vectorial original NOIR · No es una fotografía del artículo.</div>;
  }
  if (!item.imagen_autor && !item.imagen_fuente) return null;
  return <div className="photo-credit">
    {item.imagen_autor && <>Foto de {item.imagen_autor_url ? <a href={item.imagen_autor_url} target="_blank" rel="noreferrer">{item.imagen_autor}</a> : <span>{item.imagen_autor}</span>}</>}
    {item.imagen_autor && item.imagen_fuente && ' · '}
    {item.imagen_fuente && (item.imagen_credito_url ? <a href={item.imagen_credito_url} target="_blank" rel="noreferrer">{item.imagen_fuente}</a> : <span>{item.imagen_fuente}</span>)}
  </div>;
}

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('featured');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.list('productos'), api.list('categorias')])
      .then(([items, groups]) => { setProducts(items); setCategories(groups); })
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('es');
    const items = products.filter((item) => {
      const matchesSearch = !search || `${item.nombre} ${item.descripcion || ''} ${item.categoria_nombre || ''}`.toLocaleLowerCase('es').includes(search);
      return matchesSearch && (!category || String(item.categoria_id) === category);
    });
    if (sort === 'price-asc') items.sort((a, b) => Number(a.precio) - Number(b.precio));
    if (sort === 'price-desc') items.sort((a, b) => Number(b.precio) - Number(a.precio));
    return items;
  }, [products, query, category, sort]);

  return <>
    <section className="hero">
      <div className="hero-copy"><span className="eyebrow">MODA ALTERNATIVA · SAN JOSÉ</span><h1>La noche<br /><em>tiene forma.</em></h1><p>Prendas y accesorios de estética oscura, presentados como un catálogo académico de inventario.</p><a className="button button-primary" href="#catalogo">Explorar catálogo <span>↓</span></a></div>
      <div className="hero-art"><img src={coverImage} alt="Referencia editorial: traje de lobo antropomórfico con arnés verde sobre fondo claro"/><span className="hero-index">REFERENCIA DE ESTILO&nbsp; / &nbsp;NO. 01</span></div>
      <div className="hero-side-label">NOIR · ESTUDIO DE ESTILO</div>
    </section>
    <div className="demo-banner"><span className="demo-icon">✳</span><span><strong>Catálogo de demostración</strong> · Productos, precios y existencias ficticios. No hay ventas ni compras disponibles.</span><span className="adult-label">SOLO ADULTOS · 18+</span></div>
    <section className="catalog" id="catalogo">
      <div className="section-title"><div><span className="eyebrow">SELECCIÓN NOIR · 01—{String(filtered.length).padStart(2, '0')}</span><h2>Piezas de archivo</h2></div><p>Diseños alternativos<br/>para una mirada propia.</p></div>
      <div className="catalog-tools"><label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en el catálogo" aria-label="Buscar productos"/><kbd>⌘ K</kbd></label><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrar por categoría"><option value="">Todas las categorías</option>{categories.map((item) => <option value={item.id} key={item.id}>{item.nombre}</option>)}</select><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Ordenar productos"><option value="featured">Orden: destacados</option><option value="price-asc">Precio: menor a mayor</option><option value="price-desc">Precio: mayor a menor</option></select></div>
      {error && <div className="catalog-state error">No se pudo cargar el catálogo: {error}. Verifica la API y la conexión a MySQL.</div>}
      {loading ? <div className="catalog-state">Cargando catálogo…</div> : !error && !filtered.length ? <div className="catalog-state">No hay coincidencias. Carga los datos de muestra para mostrar las piezas.</div> : <div className="product-grid">{filtered.map((item, index) => <article className="product-card" key={item.id} style={{ '--card-order': index }}>
        <button className="product-image" onClick={() => setSelected(item)} aria-label={`Ver detalles de ${item.nombre}`}><img src={item.imagen_url || placeholder} alt={item.imagen_url ? (item.descripcion || item.nombre) : 'Ilustración editorial genérica; no representa este producto'} loading="lazy" onError={(event) => { event.currentTarget.src = placeholder; }}/>{item.imagen_fuente === 'Ilustración original NOIR' ? <span className="placeholder-tag">ILUSTRACIÓN ORIGINAL</span> : !item.imagen_url && <span className="placeholder-tag">ILUSTRACIÓN GENÉRICA</span>}<span className="quick-view">Ver pieza ↗</span></button>
        <div className="product-meta"><span>{item.categoria_nombre || 'SIN CATEGORÍA'}</span><span>REF. {String(item.id).padStart(3, '0')}</span></div>
        <button className="product-name" onClick={() => setSelected(item)}>{item.nombre}</button><p className="product-description">{item.descripcion || 'Pieza de moda alternativa.'}</p>
        <div className="product-bottom"><span className="product-price">{money.format(Number(item.precio))}</span><span className={`availability ${Number(item.stock) ? 'in-stock' : 'out-stock'}`}>{Number(item.stock) ? `${item.stock} en muestra` : 'Sin existencias'}</span></div>
        <ImageCredit item={item} />
      </article>)}</div>}
      <p className="catalog-footnote">Los valores y las existencias son datos ficticios para fines académicos. Este catálogo es una presentación de inventario, no una tienda transaccional.</p>
    </section>
    <section className="manifesto"><span>NOIR / 001</span><p>Vestir también es<br/><em>elegir una actitud.</em></p><span>MODA ALTERNATIVA · COSTA RICA</span></section>
    {selected && <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}><section className="detail-modal" role="dialog" aria-modal="true" aria-label={`Detalles de ${selected.nombre}`} onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)} aria-label="Cerrar">×</button><img src={selected.imagen_url || placeholder} alt={selected.imagen_url ? selected.nombre : 'Ilustración editorial genérica'} onError={(event) => { event.currentTarget.src = placeholder; }}/><div className="detail-copy"><span className="eyebrow">{selected.categoria_nombre || 'NOIR'} · REFERENCIA {selected.id}</span><h2>{selected.nombre}</h2><p>{selected.descripcion || 'Pieza de moda alternativa.'}</p><strong>{money.format(Number(selected.precio))}</strong><span className="detail-disclaimer">Existencia de demostración: {selected.stock}. No disponible para compra.</span><ImageCredit item={selected} /></div></section></div>}
  </>;
}
