import { createEntityModel } from './entityModel.js';
export default createEntityModel('proveedores', ['id', 'nombre', 'telefono', 'correo'], ['nombre', 'correo']);
