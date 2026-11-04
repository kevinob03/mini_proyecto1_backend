import { useEffect, useState } from 'react';
import { searchImages, trackImageSelection } from '../services/api.js';

const empty = { nombre: '', descripcion: '' };

export default function EntityForm({ config, initial, categories, suppliers, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || empty);
  const [imageQuery, setImageQuery] = useState('');
  const [imageResults, setImageResults] = useState([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [selectedImageId, setSelectedImageId] = useState('');
  useEffect(() => { setForm(initial || empty); setImageResults([]); setImageError(''); }, [initial, config.key]);
  const fields = config.key === 'productos'
    ? [
      { name: 'nombre', label: 'Nombre', required: true },
      { name: 'descripcion', label: 'Descripción', multiline: true },
      { name: 'precio', label: 'Precio de muestra (₡)', type: 'number', min: '0', step: '0.01', required: true },
      { name: 'stock', label: 'Existencias de muestra', type: 'number', min: '0', step: '1', required: true },
      { name: 'categoria_id', label: 'Categoría', type: 'select', options: categories },
      { name: 'proveedor_id', label: 'Proveedor', type: 'select', options: suppliers },
    ]
    : config.key === 'categorias'
      ? [{ name: 'nombre', label: 'Nombre', required: true }, { name: 'descripcion', label: 'Descripción', multiline: true }]
      : [{ name: 'nombre', label: 'Nombre', required: true }, { name: 'telefono', label: 'Teléfono' }, { name: 'correo', label: 'Correo', type: 'email' }];

  async function findImages(event) {
    event.preventDefault();
    setImageLoading(true); setImageError('');
    try { setImageResults(await searchImages(imageQuery)); }
    catch (error) { setImageError(error.message); setImageResults([]); }
    finally { setImageLoading(false); }
  }

  async function chooseImage(image) {
    setImageError('');
    try {
      await trackImageSelection(image.id);
      setSelectedImageId(image.id);
      setForm((previous) => ({ ...previous, imagen_url: image.url, imagen_autor: image.author, imagen_autor_url: image.authorUrl, imagen_credito_url: image.creditUrl, imagen_fuente: image.source }));
    } catch (error) { setImageError(error.message); }
  }

  function submit(event) {
    event.preventDefault();
    const values = { ...form };
    if (config.key === 'productos') {
      values.precio = Number(values.precio);
      values.stock = Number(values.stock);
      values.categoria_id = Number(values.categoria_id);
      values.proveedor_id = Number(values.proveedor_id);
    }
    onSubmit(values);
  }

  return <form className="form-card" onSubmit={submit}>
    <div className="form-heading"><div><span className="eyebrow">{initial ? 'ACTUALIZAR REGISTRO' : 'NUEVO REGISTRO'}</span><h2>{initial ? `Editar ${config.singular}` : `Agregar ${config.singular}`}</h2></div><button type="button" className="icon-button" aria-label="Cerrar formulario" onClick={onCancel}>×</button></div>
    {fields.map((field) => <label className="field" key={field.name}>{field.label}
      {field.type === 'select'
        ? <select required value={form[field.name] || ''} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}><option value="">Seleccione…</option>{field.options.map((option) => <option key={option.id} value={option.id}>{option.nombre}</option>)}</select>
        : field.multiline
          ? <textarea rows="3" value={form[field.name] || ''} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} />
          : <input required={field.required} type={field.type || 'text'} min={field.min} step={field.step} value={form[field.name] ?? ''} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} />}
    </label>)}
    {config.key === 'productos' && <section className="image-field"><div><span className="eyebrow">IMAGEN DE REFERENCIA</span><h3>Asignar una imagen</h3><p>Revisa cada resultado para confirmar que encaja con la pieza. No se elige una foto automáticamente.</p></div>
      <div className="image-search"><input value={imageQuery} onChange={(event) => setImageQuery(event.target.value)} placeholder="Ej. black corset fashion" aria-label="Buscar imagen en Unsplash"/><button type="button" className="button button-secondary" onClick={findImages} disabled={imageLoading || imageQuery.trim().length < 2}>{imageLoading ? 'Buscando…' : 'Buscar en Unsplash'}</button></div>
      {imageError && <p className="image-error" role="alert">{imageError}</p>}
      {imageResults.length > 0 && <div className="image-results">{imageResults.map((image) => <button type="button" className={`image-result ${selectedImageId === image.id ? 'chosen' : ''}`} key={image.id} onClick={() => chooseImage(image)}><img src={image.url} alt={image.alt} loading="lazy"/><span>{image.author}</span><small>{selectedImageId === image.id ? 'Seleccionada' : 'Seleccionar'}</small></button>)}</div>}
      {form.imagen_url && <div className="selected-image"><img src={form.imagen_url} alt="Vista previa de la imagen seleccionada"/><span>{form.imagen_autor ? `Foto de ${form.imagen_autor}` : 'Imagen propia'}</span><button type="button" className="text-button danger" onClick={() => { setForm({ ...form, imagen_url: '', imagen_autor: '', imagen_autor_url: '', imagen_credito_url: '', imagen_fuente: '' }); setSelectedImageId(''); }}>Quitar</button></div>}
      <details className="manual-image"><summary>Usar una URL propia autorizada</summary><label className="field">URL HTTPS de imagen<input type="url" placeholder="https://…" value={form.imagen_url || ''} onChange={(event) => setForm({ ...form, imagen_url: event.target.value })}/></label><label className="field">Autor / crédito<input value={form.imagen_autor || ''} onChange={(event) => setForm({ ...form, imagen_autor: event.target.value })}/></label><label className="field">URL del fotógrafo<input type="url" placeholder="https://…" value={form.imagen_autor_url || ''} onChange={(event) => setForm({ ...form, imagen_autor_url: event.target.value })}/></label><label className="field">Fuente / publicación<input value={form.imagen_fuente || ''} onChange={(event) => setForm({ ...form, imagen_fuente: event.target.value })}/></label><label className="field">URL de atribución de la imagen<input type="url" placeholder="https://…" value={form.imagen_credito_url || ''} onChange={(event) => setForm({ ...form, imagen_credito_url: event.target.value })}/></label></details>
    </section>}
    <div className="form-actions"><button type="button" className="button button-light" onClick={onCancel}>Cancelar</button><button className="button button-primary" type="submit">{initial ? 'Guardar cambios' : 'Guardar registro'}</button></div>
  </form>;
}
