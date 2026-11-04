import { createEntityModel } from './entityModel.js';
export default createEntityModel('productos', ['id', 'nombre', 'descripcion', 'precio', 'stock', 'categoria_id', 'proveedor_id', 'imagen_url', 'imagen_autor', 'imagen_autor_url', 'imagen_credito_url', 'imagen_fuente'], ['nombre', 'descripcion']);
