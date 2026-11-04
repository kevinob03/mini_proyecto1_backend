import model from '../models/supplierModel.js';
import { entityController } from './entityController.js';
export default entityController({ model, label: 'Proveedor', fields: [{ name: 'nombre', type: 'text', required: true }, { name: 'telefono', type: 'text' }, { name: 'correo', type: 'text' }] });
