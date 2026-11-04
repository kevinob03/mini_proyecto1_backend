import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './config/database.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import imageRoutes from './routes/imageRoutes.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'connected' }); }
  catch { res.status(503).json({ status: 'error', database: 'unavailable' }); }
});
app.use('/api/productos', productRoutes);
app.use('/api/categorias', categoryRoutes);
app.use('/api/proveedores', supplierRoutes);
app.use('/api/imagenes', imageRoutes);
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use((error, _req, res, _next) => {
  if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'La categoría o el proveedor indicado no existe.' });
  if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ error: 'No se puede eliminar: hay productos relacionados.' });
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe un registro con ese valor.' });
  console.error(error);
  return res.status(500).json({ error: 'Error interno del servidor.' });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`API de inventario disponible en http://localhost:${port}`));
