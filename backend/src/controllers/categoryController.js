import model from '../models/categoryModel.js';
import { entityController } from './entityController.js';
export default entityController({ model, label: 'Categoría', fields: [{ name: 'nombre', type: 'text', required: true }, { name: 'descripcion', type: 'text' }] });
