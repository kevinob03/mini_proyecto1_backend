import model from '../models/productModel.js';
import { entityController } from './entityController.js';
export default entityController({
  model, label: 'Producto',
  fields: [
    { name: 'nombre', type: 'text', required: true },
    { name: 'descripcion', type: 'text' },
    { name: 'precio', type: 'number', required: true },
    { name: 'stock', type: 'integer', required: true },
    { name: 'categoria_id', type: 'id', required: true },
    { name: 'proveedor_id', type: 'id', required: true },
    { name: 'imagen_url', type: 'url' },
    { name: 'imagen_autor', type: 'text' },
    { name: 'imagen_autor_url', type: 'url' },
    { name: 'imagen_credito_url', type: 'url' },
    { name: 'imagen_fuente', type: 'text' },
  ],
});
