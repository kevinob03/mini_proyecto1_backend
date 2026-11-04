export default function EntityTable({ config, rows, onEdit, onDelete }) {
  const columns = config.key === 'productos'
    ? [['nombre', 'Producto'], ['categoria_nombre', 'Categoría'], ['proveedor_nombre', 'Proveedor'], ['precio', 'Precio'], ['stock', 'Existencias']]
    : config.key === 'categorias'
      ? [['nombre', 'Categoría'], ['descripcion', 'Descripción']]
      : [['nombre', 'Proveedor'], ['telefono', 'Teléfono'], ['correo', 'Correo']];
  return <div className="table-wrap"><table><thead><tr>{columns.map(([, label]) => <th key={label}>{label}</th>)}<th><span className="sr-only">Acciones</span></th></tr></thead><tbody>
    {rows.map((row) => <tr key={row.id}>{columns.map(([key]) => <td key={key}>{key === 'precio' ? `₡${Number(row[key]).toLocaleString('es-CR', { minimumFractionDigits: 2 })}` : (row[key] ?? '—')}</td>)}<td className="actions"><button className="text-button" onClick={() => onEdit(row)}>Editar</button><button className="text-button danger" onClick={() => onDelete(row)}>Eliminar</button></td></tr>)}
  </tbody></table></div>;
}
